import { useState, useEffect, useContext } from 'react';
import './AIPlanner.css';
import { AuthContext } from '../hooks/authContext';
import { useDatabase } from '../hooks/useDatabase';
import { type StudyPlanDay } from '../pages/Dashboard';
import { usePlanner } from '../context/PlannerContext';
import { type Topic } from '../types/studyPlan';

interface TopicLocal {
  id: string;
  name: string;
}

interface Pdf {
  id: number;
  name: string;
  size: string;
}

interface Subject {
  id: string | number;
  name: string;
  examDate: string;
  color: string;
  pdfs: Pdf[];
  importantDates: {
    name: string;
    date: string;
    type: 'exam' | 'tp' | 'other';
  }[];
}

interface StudyPlan {
  id: string | number;
  subjectName: string;
  eventName: string;
  examDate: string;
  topics: Topic[];
  studyDays: string[];
  content: string;
  structuredPlan:
    | {
        title: string;
        summary: string;
        days: Array<{
          date: string;
          dayNumber: number;
          topics: Array<{
            name: string;
            summary: string;
            estimatedTime: string;
          }>;
          totalTime: string;
          recommendations: string;
          completed: boolean;
        }>;
        finalRecommendations: string;
      }
    | null
    | undefined;
  progress: number;
  createdAt: string;
  expanded: boolean;
}

const AIPlanner = () => {
  const { user } = useContext(AuthContext);
  const { extractedTopics } = usePlanner();

  const [topicCounter, setTopicCounter] = useState(1);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [selectedSubjectForPlanning, setSelectedSubjectForPlanning] = useState<
    string | number | null
  >(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicLocal[]>([]);
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
  const [generatedStudyPlan, setGeneratedStudyPlan] = useState<string>('');
  const [nextPlanId, setNextPlanId] = useState(1);

  const {
    getUserStudyPlans,
    createStudyPlan,
    deleteStudyPlan,
    getUserMaterials,
  } = useDatabase();

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      try {
        const materials = await getUserMaterials();
        const convertedSubjects: Subject[] = materials.map(
          (material, index) => {
            const subjectId = material.id || `subject-${Date.now()}-${index}`;
            return {
              id: subjectId,
              name:
                material.subjectName ||
                material.fileName.replace(/\.(pdf|docx|doc)$/i, ''),
              examDate: material.examDate || '',
              color: material.color || '#4285F4',
              pdfs: [
                {
                  id: 1,
                  name: material.fileName,
                  size: '0 MB',
                },
              ],
              importantDates: material.importantDates || [],
            };
          },
        );
        setSubjects(convertedSubjects);

        const studyPlans = await getUserStudyPlans();
        const convertedPlans = studyPlans.map((plan, index) => {
          const planId = plan.id || `plan-${Date.now()}-${index}`;
          const structuredPlan = plan.generatedPlan.structuredPlan as
            | {
                title: string;
                summary: string;
                days: Array<{
                  date: string;
                  dayNumber: number;
                  topics: Array<{
                    name: string;
                    summary: string;
                    estimatedTime: string;
                  }>;
                  totalTime: string;
                  recommendations: string;
                  completed: boolean;
                }>;
                finalRecommendations: string;
              }
            | null
            | undefined;

          return {
            id: planId,
            subjectName: plan.generatedPlan.title || 'Plan de Estudio',
            eventName: 'Examen',
            examDate: plan.generatedPlan.examDate || '',
            topics: Array.isArray(plan.generatedPlan.topics)
              ? plan.generatedPlan.topics.map((topic) =>
                  typeof topic === 'string'
                    ? {
                        id: `topic-${Date.now()}`,
                        title: topic,
                        description: '',
                      }
                    : topic,
                )
              : [],
            studyDays: plan.generatedPlan.studyDates || [],
            content: JSON.stringify(structuredPlan || {}),
            structuredPlan: structuredPlan,
            progress: 0,
            createdAt: plan.createdAt
              ? typeof plan.createdAt === 'object' && 'toDate' in plan.createdAt
                ? plan.createdAt.toDate().toISOString()
                : typeof plan.createdAt === 'string'
                  ? plan.createdAt
                  : new Date().toISOString()
              : new Date().toISOString(),
            expanded: false,
          };
        });
        setStudyPlans(convertedPlans);
      } catch (error: unknown) {
        console.error('Error al cargar datos del usuario:', error);
      }
    };
    loadUserData();
  }, [user, getUserStudyPlans, getUserMaterials]);

  const removeTopic = (id: string) => {
    setTopics(topics.filter((t) => t.id !== id));
  };

  const generateStudyPlan = async () => {
    if (
      !selectedSubjectForPlanning ||
      !selectedEvent ||
      topics.length === 0 ||
      selectedWeekDays.length === 0
    ) {
      alert(
        'Por favor completa todos los campos: materia, evento, temas y días de la semana.',
      );
      return;
    }

    const selectedSubject = subjects.find(
      (s) => s.id === selectedSubjectForPlanning,
    );
    if (!selectedSubject) {
      alert('No se encontró la materia seleccionada.');
      return;
    }

    setGeneratingPlan(true);

    try {
      let examDate = '';
      const importantDates = selectedSubject.importantDates || [];
      if (selectedEvent === 'primer-parcial') {
        const primerParcial = importantDates.find(
          (d) => d.name === 'Primer Parcial',
        );
        examDate = primerParcial?.date || '';
      } else if (selectedEvent === 'final') {
        const segundoParcial = importantDates.find(
          (d) => d.name === 'Segundo Parcial',
        );
        examDate = segundoParcial?.date || '';
      }

      const generatedStudyDates = generateStudyDatesFromWeekDays(
        examDate,
        selectedWeekDays,
      );

      if (generatedStudyDates.length === 0) {
        alert(
          'No hay fechas disponibles con los días de la semana seleccionados hasta la fecha del examen.',
        );
        return;
      }

      const response = await fetch(
        import.meta.env.VITE_GENERATE_PLAN_ENDPOINT,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subjectName: selectedSubject.name,
            eventName: selectedEvent
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            examDate: examDate,
            topics: topics.map((topic) => topic.name),
            studyDates: generatedStudyDates,
            weekDays: selectedWeekDays,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Error en la función Gemini: ${response.status}`);
      }

      const result = await response.json();
      let studyPlan = '';
      let structuredPlan = null;

      if (result.plan) {
        // La respuesta viene con el plan ya parseado
        structuredPlan = result.plan;
        studyPlan = JSON.stringify(structuredPlan);
      } else if (result.raw_response) {
        // Fallback si viene en formato raw_response
        studyPlan = result.raw_response;
        try {
          const cleanedPlan = studyPlan
            .replace(/^[^{]*/, '')
            .replace(/[^}]*$/, '');
          const parsedPlan = JSON.parse(cleanedPlan);

          if (parsedPlan.days && Array.isArray(parsedPlan.days)) {
            parsedPlan.days = parsedPlan.days.map((day: StudyPlanDay) => ({
              ...day,
              date: normalizeDate(day.date),
              completed: false,
            }));
            structuredPlan = parsedPlan;
          }
        } catch (error: unknown) {
          console.log(
            '⚠️ No se pudo parsear como JSON, usando formato texto:',
            error,
          );
        }
      } else {
        throw new Error('Formato de respuesta inesperado');
      }

      // Asegurar que el plan estructurado tenga el formato correcto
      if (
        structuredPlan &&
        structuredPlan.days &&
        Array.isArray(structuredPlan.days)
      ) {
        structuredPlan.days = structuredPlan.days.map((day: StudyPlanDay) => ({
          ...day,
          date: normalizeDate(day.date),
          completed: false,
        }));
      }

      setGeneratedStudyPlan(studyPlan);

      try {
        const planId = await createStudyPlan({
          materialId: selectedSubject.id.toString(),
          generatedPlan: {
            title:
              structuredPlan?.title ||
              `Plan de Estudio - ${selectedSubject.name}`,
            summary:
              structuredPlan?.summary || 'Plan de estudio generado con IA',
            durationDays: generatedStudyDates.length,
            examDate: examDate,
            selectedWeekDays: selectedWeekDays,
            topics: topics.map((t) => ({ id: t.id, title: t.name })),
            studyDates: generatedStudyDates,
            structuredPlan: structuredPlan as
              | {
                  title: string;
                  summary: string;
                  days: Array<{
                    date: string;
                    dayNumber: number;
                    topics: Array<{
                      name: string;
                      summary: string;
                      estimatedTime: string;
                    }>;
                    totalTime: string;
                    recommendations: string;
                    completed: boolean;
                  }>;
                  finalRecommendations: string;
                }
              | undefined,
            dailyTasks: structuredPlan?.days
              ? structuredPlan.days.map((day: StudyPlanDay, index: number) => ({
                  day: index + 1,
                  task: `${day.topics.map((t) => t.name).join(', ')} - ${day.recommendations}`,
                  completed: false,
                }))
              : generatedStudyDates.map((date, index) => ({
                  day: index + 1,
                  task: `Estudiar temas asignados para ${formatDate(date)}`,
                  completed: false,
                })),
          },
        });

        if (planId) {
          console.log('✅ Plan completo guardado en Firebase con ID:', planId);
        }
      } catch (firebaseError: unknown) {
        console.error('❌ Error guardando plan en Firebase:', firebaseError);
      }

      const newPlan: StudyPlan = {
        id: nextPlanId,
        subjectName: selectedSubject.name,
        eventName: selectedEvent
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        examDate: examDate || '',
        topics: topics.map((t) => ({ id: t.id, title: t.name })),
        studyDays: generatedStudyDates,
        content: studyPlan,
        structuredPlan: structuredPlan,
        progress: 0,
        createdAt: new Date().toISOString(),
        expanded: false,
      };

      setStudyPlans((prevPlans) => [...prevPlans, newPlan]);
      setNextPlanId(nextPlanId + 1);

      console.log('🎉 Plan de estudio generado y guardado exitosamente');
    } catch (error: unknown) {
      console.error('❌ Error generando plan de estudio:', error);
      alert('Error generando el plan de estudio. Inténtalo de nuevo.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const togglePlanExpansion = (planId: string | number) => {
    setStudyPlans((prevPlans) =>
      prevPlans.map((plan) =>
        plan.id === planId ? { ...plan, expanded: !plan.expanded } : plan,
      ),
    );
  };

  const toggleDayCompletion = (planId: string | number, dayIndex: number) => {
    setStudyPlans((prevPlans) =>
      prevPlans.map((plan) => {
        if (plan.id === planId && plan.structuredPlan) {
          const updatedDays = plan.structuredPlan.days.map((day, index) =>
            index === dayIndex ? { ...day, completed: !day.completed } : day,
          );
          const completedDays = updatedDays.filter(
            (day) => day.completed,
          ).length;
          const totalDays = updatedDays.length;
          const newProgress =
            totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
          return {
            ...plan,
            structuredPlan: {
              ...plan.structuredPlan,
              days: updatedDays,
            },
            progress: newProgress,
          };
        }
        return plan;
      }),
    );
  };

  const deletePlan = async (planId: string | number) => {
    try {
      const firebasePlans = await getUserStudyPlans();
      const firebasePlan = firebasePlans.find((plan) => {
        const planIdStr = String(plan.id);
        const localIdStr = String(planId);
        return planIdStr === localIdStr;
      });
      if (firebasePlan && firebasePlan.id) {
        await deleteStudyPlan(firebasePlan.id);
        setStudyPlans((prevPlans) => {
          const filtered = prevPlans.filter(
            (plan) => String(plan.id) !== String(planId),
          );
          return filtered;
        });
      } else {
        alert(
          'El plan no se encontró en la base de datos. Puede que ya haya sido eliminado.',
        );
      }
    } catch (error: unknown) {
      console.error('❌ Error al eliminar plan:', error);
      alert('Error al eliminar el plan. Inténtalo de nuevo.');
    }
  };

  const generateStudyDatesFromWeekDays = (
    examDate: string,
    weekDays: number[],
  ) => {
    const today = new Date();
    const exam = new Date(examDate);
    const studyDates: string[] = [];
    const current = new Date(today);
    current.setDate(current.getDate() + 1);
    while (current <= exam) {
      if (weekDays.includes(current.getDay())) {
        studyDates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }
    return studyDates;
  };

  const normalizeDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toISOString().split('T')[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  return (
    <div className="ai-planner-container">
      <header className="ai-planner-header">
        <h1 className="ai-planner-title">Planificador IA</h1>
        <p className="ai-planner-subtitle">
          Genera un plan de estudio mensual personalizado basado en tus
          objetivos, materias y disponibilidad.
        </p>
      </header>
      <div className="panel">
        <h2>
          <i className="fas fa-calendar-check"></i> Planificación
        </h2>
        {subjects.length === 0 ? (
          <p>Primero debes cargar una materia para poder planificar</p>
        ) : (
          <div>
            <div className="form-group">
              <label>Seleccionar Materia</label>
              <select
                value={selectedSubjectForPlanning?.toString() ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const subjectId = value
                    ? isNaN(Number(value))
                      ? value
                      : Number(value)
                    : null;
                  setSelectedSubjectForPlanning(subjectId);
                  setSelectedEvent(null);
                  setTopics([]);
                  setSelectedWeekDays([]);
                }}
              >
                <option value="">-- Selecciona una materia --</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedSubjectForPlanning && (
              <div>
                <div className="form-group">
                  <label>Seleccionar Evento</label>
                  <select
                    value={selectedEvent ?? ''}
                    onChange={(e) => {
                      setSelectedEvent(e.target.value || null);
                      setTopics([]);
                      setSelectedWeekDays([]);
                    }}
                  >
                    <option value="">-- Selecciona un evento --</option>
                    <option value="primer-parcial">Primer Parcial</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                {selectedEvent && (
                  <div>
                    {extractedTopics.length > 0 && (
                      <div className="form-group">
                        <h4 className="label-heading">
                          🤖 Temas extraídos por IA del PDF (
                          {extractedTopics.length} temas encontrados):
                        </h4>
                        <div className="topic-list-container">
                          {extractedTopics.map((extractedTopic, index) => {
                            const isAlreadyAdded = topics.some(
                              (t) =>
                                t.name.toLowerCase() ===
                                extractedTopic.name.toLowerCase(),
                            );
                            return (
                              <div
                                key={`planning-topic-${extractedTopic.id || index}`}
                                className={`topic-item ${isAlreadyAdded ? 'added' : ''}`}
                                onClick={() => {
                                  if (!isAlreadyAdded) {
                                    const newTopic = {
                                      id: `topic-${selectedSubjectForPlanning}-${topicCounter}`,
                                      name: extractedTopic.name,
                                    };
                                    setTopics([...topics, newTopic]);
                                    setTopicCounter((prev) => prev + 1);
                                  }
                                }}
                              >
                                <div>
                                  <span className="topic-name">
                                    {index + 1}. {extractedTopic.name}
                                  </span>
                                  {extractedTopic.description && (
                                    <div className="topic-description">
                                      {extractedTopic.description}
                                    </div>
                                  )}
                                </div>
                                <button
                                  className={`topic-add-btn ${isAlreadyAdded ? 'added' : ''}`}
                                  disabled={isAlreadyAdded}
                                >
                                  {isAlreadyAdded ? '✓ Agregado' : '+ Agregar'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => {
                            const newTopics = extractedTopics
                              .filter((extractedTopic) => {
                                const isAlreadyAdded = topics.some(
                                  (t) =>
                                    t.name.toLowerCase() ===
                                    extractedTopic.name.toLowerCase(),
                                );
                                return !isAlreadyAdded;
                              })
                              .map((extractedTopic, index) => ({
                                id: `topic-${selectedSubjectForPlanning}-${topicCounter + index}`,
                                name: extractedTopic.name,
                              }));
                            setTopics([...topics, ...newTopics]);
                            setTopicCounter((prev) => prev + newTopics.length);
                          }}
                          className="button-primary"
                        >
                          ✨ Agregar todos los temas de IA
                        </button>
                      </div>
                    )}
                    <div className="form-group">
                      <label>
                        📅 Selecciona los días de la semana que tienes
                        disponibles para estudiar
                      </label>
                      <div className="day-selector-grid">
                        {[
                          { day: 1, name: 'Lunes' },
                          { day: 2, name: 'Martes' },
                          { day: 3, name: 'Miércoles' },
                          { day: 4, name: 'Jueves' },
                          { day: 5, name: 'Viernes' },
                          { day: 6, name: 'Sábado' },
                          { day: 0, name: 'Domingo' },
                        ].map(({ day, name }) => (
                          <div
                            key={day}
                            className={`day-selector-card ${selectedWeekDays.includes(day) ? 'selected-day' : ''}`}
                            onClick={() => {
                              if (selectedWeekDays.includes(day)) {
                                setSelectedWeekDays(
                                  selectedWeekDays.filter((d) => d !== day),
                                );
                              } else {
                                setSelectedWeekDays([...selectedWeekDays, day]);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedWeekDays.includes(day)}
                              onChange={() => {}}
                            />
                            <span>{name}</span>
                          </div>
                        ))}
                      </div>
                      {(() => {
                        const selectedSubject = subjects.find(
                          (s) => s.id === selectedSubjectForPlanning,
                        );
                        if (!selectedSubject) {
                          return (
                            <p className="error-message">
                              ⚠️ No se encontró la materia seleccionada.
                            </p>
                          );
                        }
                        let examDate = '';
                        const importantDates =
                          selectedSubject.importantDates || [];
                        if (selectedEvent === 'primer-parcial') {
                          const primerParcial = importantDates.find(
                            (d) => d.name === 'Primer Parcial',
                          );
                          examDate = primerParcial?.date || '';
                        } else if (selectedEvent === 'final') {
                          const segundoParcial = importantDates.find(
                            (d) => d.name === 'Segundo Parcial',
                          );
                          examDate = segundoParcial?.date || '';
                        }
                        if (!examDate) {
                          const eventName =
                            selectedEvent === 'primer-parcial'
                              ? 'Primer Parcial'
                              : 'Segundo Parcial';
                          return (
                            <p className="info-message">
                              No se encontró la fecha del {eventName} para esta
                              materia.
                            </p>
                          );
                        }
                        const generatedDates =
                          selectedWeekDays.length > 0
                            ? generateStudyDatesFromWeekDays(
                                examDate,
                                selectedWeekDays,
                              )
                            : [];
                        return (
                          <div>
                            {selectedWeekDays.length > 0 && (
                              <div className="summary-box">
                                <div className="summary-title">
                                  📊 Resumen de tu planificación:
                                </div>
                                <ul className="summary-list">
                                  <li>
                                    • Días de la semana seleccionados:{' '}
                                    {selectedWeekDays.length}
                                  </li>
                                  <li>
                                    • Fecha del examen: {formatDate(examDate)}
                                  </li>
                                  <li>
                                    • Sesiones de estudio generadas:{' '}
                                    {generatedDates.length}
                                  </li>
                                  {topics.length > 0 && (
                                    <li>
                                      • Aproximadamente{' '}
                                      {Math.ceil(
                                        generatedDates.length / topics.length,
                                      )}{' '}
                                      sesiones por tema
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                            {selectedWeekDays.length > 0 &&
                              generatedDates.length === 0 && (
                                <div className="warning-box">
                                  ⚠️ No hay fechas disponibles con los días de
                                  la semana seleccionados hasta la fecha del
                                  examen.
                                </div>
                              )}
                            {selectedWeekDays.length === 0 && (
                              <div className="info-box">
                                👆 Selecciona los días de la semana que tienes
                                disponibles para estudiar
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    {topics.length > 0 && (
                      <div>
                        <h4 className="label-heading">
                          📚{' '}
                          {selectedEvent
                            .replace(/-/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
                          ({topics.length} temas):
                        </h4>
                        <div className="topic-list">
                          {topics.map((topic, index) => (
                            <div
                              key={`topic-${topic.id || index}`}
                              className="topic-tag"
                            >
                              <span>{topic.name}</span>
                              <button
                                onClick={() => removeTopic(topic.id)}
                                className="remove-btn"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {topics.length > 0 && selectedWeekDays.length > 0 && (
                      <div className="action-container">
                        <button
                          onClick={generateStudyPlan}
                          disabled={generatingPlan}
                          className="button-primary generate-btn"
                        >
                          {generatingPlan ? (
                            <>
                              <span>🤖</span>
                              Generando plan de estudio...
                            </>
                          ) : (
                            <>
                              <span>📝</span>
                              Plan de estudio
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    {generatedStudyPlan && (
                      <div className="generated-plan-container">
                        <h4 className="generated-plan-title">
                          <span>🎯</span>
                          Plan de Estudio Generado
                        </h4>
                        <div className="generated-plan-content">
                          <pre>{generatedStudyPlan}</pre>
                        </div>
                        <div className="generated-plan-actions">
                          <button
                            onClick={() => setGeneratedStudyPlan('')}
                            className="button-secondary"
                          >
                            Cerrar plan
                          </button>
                          <button
                            onClick={generateStudyPlan}
                            disabled={generatingPlan}
                            className="button-primary"
                          >
                            {generatingPlan
                              ? 'Regenerando...'
                              : 'Regenerar plan'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="panel">
        <h2>
          <i className="fas fa-graduation-cap"></i> Planes de estudio
        </h2>
        {studyPlans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <p>No tienes planes de estudio creados aún.</p>
            <p>
              Crea uno desde la sección "Planificación" seleccionando temas y
              días de estudio.
            </p>
          </div>
        ) : (
          <div className="plans-list">
            {studyPlans.map((plan, index) => (
              <div key={`plan-${plan.id || index}`} className="history-item">
                <div
                  className="history-header"
                  onClick={() => togglePlanExpansion(plan.id)}
                >
                  <div className="plan-info">
                    <h3 className="plan-title-text">
                      <span>📖</span>
                      {plan.subjectName}
                    </h3>
                    <div className="plan-details">
                      <span className="plan-detail">
                        <span>🎯</span> {plan.eventName}
                      </span>
                      {plan.examDate && (
                        <span className="plan-detail">
                          <span>📅</span> {formatDate(plan.examDate)}
                        </span>
                      )}
                      <span className="plan-detail">
                        <span>📚</span> {plan.topics.length} temas
                      </span>
                      <span className="plan-detail">
                        <span>🗓️</span> {plan.studyDays.length} días
                      </span>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            `¿Estás seguro de que quieres eliminar el plan de estudio "${plan.subjectName}"?`,
                          )
                        ) {
                          deletePlan(plan.id);
                        }
                      }}
                      className="button-danger"
                    >
                      🗑️ Eliminar
                    </button>
                    <span
                      className={`toggle-icon ${plan.expanded ? 'expanded' : ''}`}
                    >
                      ▼
                    </span>
                  </div>
                </div>
                <div className="progress-container">
                  <span className="progress-label">Progreso del estudio</span>
                  <span className="progress-value">
                    {plan.progress}%
                    {plan.structuredPlan && (
                      <span className="progress-days">
                        (
                        {
                          plan.structuredPlan.days.filter((d) => d.completed)
                            .length
                        }
                        /{plan.structuredPlan.days.length} días)
                      </span>
                    )}
                  </span>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${plan.progress}%` }}
                    >
                      {plan.progress}%
                    </div>
                  </div>
                </div>
                {plan.expanded && (
                  <div className="expanded-plan-content">
                    {plan.structuredPlan ? (
                      <div>
                        <h4 className="section-title">
                          <span>📅</span> Cronograma de Estudio
                        </h4>
                        {plan.structuredPlan.summary && (
                          <div className="plan-summary">
                            {plan.structuredPlan.summary}
                          </div>
                        )}
                        <div className="day-list">
                          {plan.structuredPlan.days.map((day, dayIndex) => (
                            <div
                              key={dayIndex}
                              className={`study-day-card ${day.completed ? 'completed' : ''}`}
                            >
                              <div className="day-header">
                                <h5 className="day-title">
                                  <span>{day.completed ? '✅' : '📅'}</span> Día{' '}
                                  {day.dayNumber} - {formatDate(day.date)}
                                </h5>
                                <button
                                  onClick={() =>
                                    toggleDayCompletion(plan.id, dayIndex)
                                  }
                                  className={`plan-completion-btn ${day.completed ? 'completed' : ''}`}
                                >
                                  {day.completed
                                    ? '✓ Completado'
                                    : 'Marcar como completado'}
                                </button>
                              </div>
                              <div className="day-info">
                                {day.totalTime && (
                                  <span className="day-time">
                                    ⏱️ {day.totalTime}
                                  </span>
                                )}
                              </div>
                              <div className="day-topics">
                                <h6 className="topics-title">
                                  📚 Temas a estudiar:
                                </h6>
                                <div className="topic-sublist">
                                  {day.topics.map((topic, topicIndex) => (
                                    <div
                                      key={topicIndex}
                                      className="plan-day-topics"
                                    >
                                      <div className="topic-header">
                                        <span className="topic-name">
                                          {topic.name}
                                        </span>
                                        {topic.estimatedTime && (
                                          <span className="topic-time">
                                            {topic.estimatedTime}
                                          </span>
                                        )}
                                      </div>
                                      <p className="topic-summary">
                                        {topic.summary}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {day.recommendations && (
                                <div className="plan-recommendations">
                                  💡 {day.recommendations}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {plan.structuredPlan.finalRecommendations && (
                          <div className="plan-final-tips">
                            <strong>🎯 Consejos finales para el examen:</strong>
                            <p>{plan.structuredPlan.finalRecommendations}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <h4 className="section-title">
                          <span>🎯</span> Plan de Estudio (Formato Texto)
                        </h4>
                        <div className="text-plan-container">
                          <pre>{plan.content}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPlanner;
