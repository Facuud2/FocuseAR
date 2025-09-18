// src/components/StudyArea.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { AuthContext } from '../hooks/authContext';
import { BookOpen, Clock, Target, Brain, Play, Pause } from 'lucide-react';
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
  const { getUserStudyPlans } = useDatabase();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<StudyTopic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            plan.generatedPlan?.topics?.map((topic: string, index: number) => ({
              id: `topic-${index}`,
              name: topic,
              estimatedTime: '25 min',
              completed: false,
            })) || [],
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

    loadStudyPlans();
  }, [user, getUserStudyPlans]);

  const handleTopicSelect = (topic: StudyTopic) => {
    setSelectedTopic(topic);
    onStartStudySession(topic);
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
        <h2 className="study-area-title">
          <BookOpen size={24} />
          Área de Estudio
        </h2>
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
                      onClick={() => !isTimerActive && handleTopicSelect(topic)}
                    >
                      <div className="topic-header">
                        <span className="topic-name">{topic.name}</span>
                        <span className="topic-time">
                          <Clock size={12} />
                          {topic.estimatedTime}
                        </span>
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
    </div>
  );
};

export default StudyArea;
