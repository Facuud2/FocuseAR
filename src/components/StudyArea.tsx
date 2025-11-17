// src/components/StudyArea.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { AuthContext } from '../hooks/authContext';
import { Clock, Target, Brain, Play, Pause } from 'lucide-react';
import StudyContentGenerator from './StudyContentGenerator';
import StudyMaterialViewer from './StudyMaterialViewer';
import './StudyArea.css';

interface StudyTopic {
  id: string;
  name: string;
  description?: string;
  estimatedTime: string;
  completed: boolean;
}

interface StudyPlan {
  id: string;
  subjectName: string;
  examDate: string;
  topics: StudyTopic[];
  subjectColor?: string;
}

interface StudyContent {
  topic: string;
  subject: string;
  level: string;
  summary: string;
  keyConcepts: Array<{
    concept: string;
    definition: string;
  }>;
  flashcards: Array<{
    question: string;
    answer: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  practiceQuestions: Array<{
    question: string;
    answer: string;
    type: 'application' | 'analysis' | 'synthesis';
  }>;
  connections: Array<{
    relatedTopic: string;
    relationship: string;
  }>;
  studyTips: string[];
  estimatedStudyTime: string;
}

interface StudyAreaProps {
  isTimerActive: boolean;
  currentMode: 'pomodoro' | 'short-break' | 'long-break';
  onStartStudySession: (topic: StudyTopic) => void;
}

const StudyArea: React.FC<StudyAreaProps> = ({
  isTimerActive,
  currentMode,
  onStartStudySession,
}) => {
  const { user } = useContext(AuthContext);
  const { getUserStudyPlans, updateStudyPlan } = useDatabase();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<StudyTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [showMaterialViewer, setShowMaterialViewer] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<StudyContent | null>(
    null,
  );
  const [topicForGeneration, setTopicForGeneration] =
    useState<StudyTopic | null>(null);
  const loadStudyPlans = async () => {
    if (!user) return;

    try {
      const plans = await getUserStudyPlans();
      const convertedPlans: StudyPlan[] = plans.map((plan) => ({
        id: plan.id || `plan-${Date.now()}`,
        subjectName: plan.generatedPlan?.title || 'Plan de Estudio',
        examDate: plan.generatedPlan?.examDate || '',
        subjectColor: plan.generatedPlan?.subjectColor || '#4285F4',
        topics:
          plan.generatedPlan?.topics?.map(
            (
              topic: string | { title?: string; name?: string },
              index: number,
            ) => {
              // Manejar tanto formato string como objeto
              const topicName =
                typeof topic === 'string'
                  ? topic
                  : topic.title || topic.name || 'Tema sin nombre';
              // Buscar el estado de completado en dailyTasks o structuredPlan
              let isCompleted = false;

              // Verificar en dailyTasks si existe
              if (plan.generatedPlan?.dailyTasks) {
                const taskForTopic = plan.generatedPlan.dailyTasks.find(
                  (task) =>
                    task.task.toLowerCase().includes(topicName.toLowerCase()),
                );
                if (taskForTopic) {
                  isCompleted = taskForTopic.completed || false;
                  console.log(
                    `✅ [StudyArea] Tema "${topicName}" encontrado en dailyTasks - Completado: ${isCompleted}`,
                  );
                }
              }

              // Verificar en structuredPlan si existe
              if (plan.generatedPlan?.structuredPlan?.days) {
                for (const day of plan.generatedPlan.structuredPlan.days) {
                  const topicInDay = day.topics.find((t) =>
                    t.name.toLowerCase().includes(topicName.toLowerCase()),
                  );
                  if (topicInDay) {
                    // Verificar si el topic específico está completado o si el día completo está completado
                    isCompleted =
                      (topicInDay as { completed?: boolean }).completed ||
                      day.completed ||
                      false;
                    console.log(
                      `✅ [StudyArea] Tema "${topicName}" encontrado en structuredPlan día ${day.dayNumber} - Completado: ${isCompleted}`,
                    );
                    break;
                  }
                }
              }

              return {
                id: `topic-${index}`,
                name: topicName,
                estimatedTime: '25 min',
                completed: isCompleted,
              };
            },
          ) || [],
      }));

      setStudyPlans(convertedPlans);

      if (convertedPlans.length > 0) {
        setSelectedPlan(convertedPlans[0]);
      }
    } catch (error) {
      console.error('Error cargando planes de estudio:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudyPlans();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escuchar cambios cada 10 segundos para sincronización bidireccional
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadStudyPlans();
    }, 30000); // Verificar cada 30 segundos

    return () => clearInterval(interval);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTopicSelect = (topic: StudyTopic) => {
    setSelectedTopic(topic);
    setTopicForGeneration(topic);

    // Mostrar modal de selección de dificultad en lugar de generar automáticamente
    setShowContentGenerator(true);
  };

  const handleContentGenerated = (content: StudyContent) => {
    setGeneratedContent(content);
    setShowContentGenerator(false);
    setShowMaterialViewer(true);
    // Iniciar el timer cuando se genere contenido desde el modal manual
    if (topicForGeneration) {
      onStartStudySession(topicForGeneration);
    }
  };

  const handleCloseGenerator = () => {
    setShowContentGenerator(false);
    setTopicForGeneration(null);
  };

  const handleCloseMaterialViewer = () => {
    setShowMaterialViewer(false);
    setGeneratedContent(null);

    // Marcar el tema como completado
    if (selectedTopic && selectedPlan) {
      const updatedTopics = selectedPlan.topics.map((topic) =>
        topic.id === selectedTopic.id ? { ...topic, completed: true } : topic,
      );

      const updatedPlan = { ...selectedPlan, topics: updatedTopics };
      setSelectedPlan(updatedPlan);

      // Actualizar la lista de planes
      setStudyPlans((plans) =>
        plans.map((plan) => (plan.id === selectedPlan.id ? updatedPlan : plan)),
      );
    }
  };

  const handleRegenerateContent = () => {
    setShowMaterialViewer(false);
    setShowContentGenerator(true);
  };

  const handleCompleteTopicInPlan = async (
    planId: string,
    topicName: string,
  ) => {
    // Actualizar el estado local del tema como completado
    setStudyPlans((prevPlans) =>
      prevPlans.map((plan) => {
        if (plan.id === planId) {
          const updatedTopics = plan.topics.map((topic) =>
            topic.name === topicName ? { ...topic, completed: true } : topic,
          );
          return { ...plan, topics: updatedTopics };
        }
        return plan;
      }),
    );

    // También actualizar selectedTopic si es el tema actual
    if (selectedTopic && selectedTopic.name === topicName) {
      setSelectedTopic({ ...selectedTopic, completed: true });
    }

    // Persistir cambios en Firebase
    try {
      // Obtener el plan completo desde Firebase para actualizarlo correctamente
      const plans = await getUserStudyPlans();
      const planToUpdate = plans.find((plan) => plan.id === planId);

      if (!planToUpdate) {
        return;
      }

      // Actualizar dailyTasks si existe
      if (planToUpdate.generatedPlan?.dailyTasks) {
        const updatedDailyTasks = planToUpdate.generatedPlan.dailyTasks.map(
          (task) => {
            if (task.task.toLowerCase().includes(topicName.toLowerCase())) {
              return { ...task, completed: true };
            }
            return task;
          },
        );

        const updateData = {
          generatedPlan: {
            ...planToUpdate.generatedPlan,
            dailyTasks: updatedDailyTasks,
          },
        };

        await updateStudyPlan(planId, updateData);
      }

      // Actualizar structuredPlan si existe
      if (planToUpdate.generatedPlan?.structuredPlan?.days) {
        const updatedDays = planToUpdate.generatedPlan.structuredPlan.days.map(
          (day) => {
            const hasTopicInDay = day.topics.some((t) =>
              t.name.toLowerCase().includes(topicName.toLowerCase()),
            );
            if (hasTopicInDay) {
              // Marcar el topic específico como completado
              const updatedTopics = day.topics.map((topic) => {
                if (
                  topic.name.toLowerCase().includes(topicName.toLowerCase())
                ) {
                  return { ...topic, completed: true };
                }
                return topic;
              });

              // Verificar si todos los topics del día están completados
              const allTopicsCompleted = updatedTopics.every(
                (topic) => (topic as { completed?: boolean }).completed,
              );

              return {
                ...day,
                topics: updatedTopics,
                completed: allTopicsCompleted,
              };
            }
            return day;
          },
        );

        const updateData = {
          generatedPlan: {
            ...planToUpdate.generatedPlan,
            structuredPlan: {
              ...planToUpdate.generatedPlan.structuredPlan,
              days: updatedDays,
            },
          },
        };

        await updateStudyPlan(planId, updateData);
      }
    } catch (error) {
      console.error('Error al actualizar tema:', error);
    }
  };

  const getNextTopic = () => {
    if (!selectedPlan) return null;
    return selectedPlan.topics.find((topic) => !topic.completed) || null;
  };

  if (loading) {
    return (
      <div className="study-area">
        <div className="study-area-loading">
          <Brain className="loading-icon" size={32} />
          <p>Cargando tus planes de estudio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="study-area">
      <div className="study-area-header">
        <h2 className="study-area-title"></h2>
        {currentMode === 'pomodoro' && selectedTopic && (
          <div className="current-session">
            <Target size={16} />
            <span>Estudiando: {selectedTopic.name}</span>
          </div>
        )}
      </div>

      {studyPlans.length === 0 ? (
        <div className="no-plans">
          <Brain size={48} />
          <h3>No tienes planes de estudio</h3>
          <p>Ve al Dashboard para crear tu primer plan de estudio con IA</p>
        </div>
      ) : (
        <>
          {/* Selector de Plan de Estudio */}
          <div className="plan-selector">
            <label>Selecciona tu materia:</label>
            <select
              value={selectedPlan?.id || ''}
              onChange={(e) => {
                const plan = studyPlans.find((p) => p.id === e.target.value);
                setSelectedPlan(plan || null);
                setSelectedTopic(null);
              }}
            >
              {studyPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.subjectName}
                </option>
              ))}
            </select>
          </div>

          {selectedPlan && (
            <>
              {/* Información del Plan */}
              <div className="plan-info">
                <div
                  className="plan-color-bar"
                  style={{ backgroundColor: selectedPlan.subjectColor }}
                />
                <div className="plan-details">
                  <h3>{selectedPlan.subjectName}</h3>
                  {selectedPlan.examDate && (
                    <p className="exam-date">
                      <Clock size={16} />
                      Examen:{' '}
                      {new Date(selectedPlan.examDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Próximo Tema Sugerido */}
              {getNextTopic() && (
                <div className="next-topic-suggestion">
                  <h4>Próximo tema recomendado:</h4>
                  <div className="suggested-topic">
                    <div className="topic-info">
                      <span className="topic-name">{getNextTopic()?.name}</span>
                      <span className="topic-time">
                        <Clock size={14} />
                        {getNextTopic()?.estimatedTime}
                      </span>
                    </div>
                    <button
                      className="start-topic-btn"
                      onClick={() =>
                        getNextTopic() && handleTopicSelect(getNextTopic()!)
                      }
                      disabled={isTimerActive}
                    >
                      {isTimerActive ? <Pause size={16} /> : <Play size={16} />}
                      {isTimerActive ? 'En progreso' : 'Empezar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Todos los Temas */}
              <div className="topics-list">
                <h4>Todos los temas ({selectedPlan.topics.length}):</h4>
                <div className="topics-grid">
                  {selectedPlan.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className={`topic-card ${topic.completed ? 'completed' : ''} ${selectedTopic?.id === topic.id ? 'selected' : ''}`}
                    >
                      <div className="topic-header">
                        <span className="topic-name">{topic.name}</span>
                        <span className="topic-time">
                          <Clock size={12} />
                          {topic.estimatedTime}
                        </span>
                      </div>
                      <div className="topic-actions">
                        <button
                          className="start-topic-btn"
                          onClick={() =>
                            !isTimerActive && handleTopicSelect(topic)
                          }
                          disabled={isTimerActive}
                        >
                          {isTimerActive && selectedTopic?.id === topic.id ? (
                            <>
                              <Pause size={14} />
                              En progreso
                            </>
                          ) : (
                            <>
                              <Play size={14} />
                              Empezar
                            </>
                          )}
                        </button>
                      </div>
                      {topic.completed && (
                        <div className="completed-badge">✓ Completado</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Progreso General */}
              <div className="study-progress">
                <h4>Progreso del Plan</h4>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(selectedPlan.topics.filter((t) => t.completed).length / selectedPlan.topics.length) * 100}%`,
                      backgroundColor: selectedPlan.subjectColor,
                    }}
                  />
                </div>
                <span className="progress-text">
                  {selectedPlan.topics.filter((t) => t.completed).length} de{' '}
                  {selectedPlan.topics.length} temas completados
                </span>
              </div>
            </>
          )}
        </>
      )}

      {/* Modales para generación y visualización de contenido */}
      {showContentGenerator && topicForGeneration && selectedPlan && (
        <StudyContentGenerator
          topic={topicForGeneration.name}
          subject={selectedPlan.subjectName}
          onContentGenerated={handleContentGenerated}
          onClose={handleCloseGenerator}
        />
      )}

      {showMaterialViewer && generatedContent && (
        <StudyMaterialViewer
          content={generatedContent}
          onClose={handleCloseMaterialViewer}
          onGenerateNew={handleRegenerateContent}
          onCompleteTopicInPlan={handleCompleteTopicInPlan}
          currentPlanId={selectedPlan?.id}
          currentTopicName={selectedTopic?.name}
        />
      )}
    </div>
  );
};

export default StudyArea;
