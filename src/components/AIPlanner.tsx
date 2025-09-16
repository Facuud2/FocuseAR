import React, { useState, useEffect, useContext } from 'react';
import './AIPlanner.css';
import { Sparkles, Calendar, Search, FileText } from 'lucide-react';
import { AuthContext } from '../hooks/authContext';
import { useDatabase } from '../hooks/useDatabase';
import { type StudyPlanDay } from './Dashboard';
import { usePlanner } from '../context/PlannerContext';
// import { type ExtractedTopic } from '../services/PDFProcessor';

// Datos de ejemplo para planes anteriores
const previousPlans = [
  { id: 1, title: 'Plan de Refuerzo de Matemáticas', date: 'Octubre 2025' },
  { id: 2, title: 'Preparación para Examen Final', date: 'Diciembre 2025' },
];

interface Topic {
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
  topics: string[];
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

  const [isGenerating, setIsGenerating] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [formData, setFormData] = useState({
    goal: '',
    subjects: '',
    dateRange: '',
  });
  const [topicCounter, setTopicCounter] = useState(1);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [selectedSubjectForPlanning, setSelectedSubjectForPlanning] = useState<
    string | number | null
  >(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
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
            topics: plan.generatedPlan.topics || [],
            studyDays: plan.generatedPlan.studyDates || [],
            content: JSON.stringify(structuredPlan || {}),
            structuredPlan: structuredPlan,
            progress: 0,
            createdAt:
              plan.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setPlanGenerated(false);

    // Simula el tiempo de generación del plan
    setTimeout(() => {
      setIsGenerating(false);
      setPlanGenerated(true);
    }, 2000);
  };

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

      const weekDayNames = [
        'domingo',
        'lunes',
        'martes',
        'miércoles',
        'jueves',
        'viernes',
        'sábado',
      ];
      const prompt = `
Eres un asistente especializado en crear planes de estudio personalizados.

DATOS DEL ESTUDIANTE:
- Materia: ${selectedSubject.name}
- Evento de estudio: ${selectedEvent.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
- Fecha del examen: ${examDate ? formatDate(examDate) : 'No especificada'}
- Días disponibles para estudiar: ${generatedStudyDates.length} días
- Días disponibles: ${generatedStudyDates.length} (${selectedWeekDays.map((d) => weekDayNames[d]).join(', ')})

TEMAS A ESTUDIAR:
${topics.map((topic, topicIndex) => `${topicIndex + 1}. ${topic.name}`).join('\n')}

INSTRUCCIONES:
1. Distribuye los ${topics.length} temas entre los ${generatedStudyDates.length} días disponibles de manera equilibrada
2. Para cada día asignado, especifica qué temas estudiar y proporciona un resumen breve de cada tema
3. Incluye recomendaciones de tiempo de estudio por tema
4. Organiza el plan cronológicamente por fechas y distribuye todos los temas entre todos los días disponibles
5. Solo devolvé el JSON

FORMATO DE RESPUESTA REQUERIDO:
Devuelve ÚNICAMENTE un JSON válido con la siguiente estructura exacta:

{
  "title": "Plan de Estudio - [Materia] - [Evento]",
  "summary": "Resumen general del plan de estudio",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayNumber": 1,
      "topics": [
        {
          "name": "Tema",
          "summary": "Resumen breve",
          "estimatedTime": "X horas"
        }
      ],
      "totalTime": "X horas",
      "recommendations": "Breve Recomendación"
    }
  ],
  "finalRecommendations": "Consejos finales para el examen"
}

Genera el JSON del plan de estudio:`;

      const response = await fetch(
        'https://us-central1-proyecto-final-universitario.cloudfunctions.net/geminiResponse',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: prompt,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Error en la función Gemini: ${response.status}`);
      }

      const result = await response.json();
      let studyPlan = '';
      if (result.raw_response) {
        studyPlan = result.raw_response;
      } else if (typeof result === 'string') {
        studyPlan = result;
      } else if (result.response) {
        studyPlan = result.response;
      } else if (result.summary) {
        studyPlan = result.summary;
      } else {
        studyPlan = JSON.stringify(result);
      }

      studyPlan = studyPlan
        .replace(/```markdown/g, '')
        .replace(/```/g, '')
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      setGeneratedStudyPlan(studyPlan);

      let structuredPlan = null;
      try {
        let jsonContent = studyPlan;
        if (studyPlan.startsWith('json\n')) {
          jsonContent = studyPlan.substring(5).trim();
        }
        const cleanedPlan = jsonContent
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
            topics: topics.map((t) => t.name),
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
        topics: topics.map((t) => t.name),
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

      <div className="ai-planner-main-content">
        {/* Panel de Formulario */}
        <div className="planner-form-panel">
          <h2 className="panel-title">
            <Sparkles className="panel-icon" />
            Configura tu Plan
          </h2>
          <form className="planner-form" onSubmit={handleGeneratePlan}>
            <div className="form-group">
              <label htmlFor="goal">Mi objetivo principal es:</label>
              <textarea
                id="goal"
                name="goal"
                rows={3}
                placeholder="Ej: Prepararme para el examen final de física del 20 de septiembre."
                value={formData.goal}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="subjects">Materias a incluir:</label>
              <input
                type="text"
                id="subjects"
                name="subjects"
                placeholder="Ej: Física, Álgebra, Inglés"
                value={formData.subjects}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dateRange">Periodo del plan:</label>
              <input
                type="text"
                id="dateRange"
                name="dateRange"
                placeholder="Ej: Septiembre 2025"
                value={formData.dateRange}
                onChange={handleInputChange}
                required
              />
            </div>
            <button
              type="submit"
              className="generate-plan-btn"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generando...' : 'Generar Plan'}
            </button>
          </form>
        </div>

        {/* Panel de Visualización del Plan */}
        <div className="plan-display-panel">
          <h2 className="panel-title">
            <Calendar className="panel-icon" />
            Plan de Estudio Generado
          </h2>
          <div className="plan-content">
            {isGenerating && (
              <div className="loading-state">
                <div className="loader"></div>
                <p>La IA está creando tu plan...</p>
              </div>
            )}
            {planGenerated && !isGenerating && (
              <div className="generated-plan-details">
                <h3>Plan de Estudio: **Preparación para Examen Final**</h3>
                <p>
                  <strong>Periodo:</strong> Septiembre 2025
                </p>
                <div className="plan-section">
                  <h4>Día 1: **Física**</h4>
                  <ul>
                    <li>**10:00 - 11:30**: Repaso de Mecánica Clásica</li>
                    <li>**11:30 - 12:00**: Ejercicios prácticos</li>
                  </ul>
                </div>
                <div className="plan-section">
                  <h4>Día 2: **Álgebra**</h4>
                  <ul>
                    <li>**14:00 - 15:30**: Teoría de Ecuaciones Lineales</li>
                    <li>**15:30 - 16:00**: Resolución de problemas</li>
                  </ul>
                </div>
              </div>
            )}
            {!isGenerating && !planGenerated && (
              <div className="empty-state">
                <Search size={48} className="empty-state-icon" />
                <p>Tu plan personalizado aparecerá aquí.</p>
                <small>Ingresa tus datos y haz clic en "Generar Plan".</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel de Historial */}
      <div className="plan-history-panel">
        <h2 className="panel-title">
          <FileText className="panel-icon" />
          Historial de Planes
        </h2>
        <ul className="history-list">
          {previousPlans.map((plan) => (
            <li key={plan.id} className="history-item">
              <p className="history-title">{plan.title}</p>
              <span className="history-date">{plan.date}</span>
            </li>
          ))}
        </ul>
      </div>

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
                      <div style={{ marginBottom: '20px' }}>
                        <h4
                          style={{
                            marginBottom: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#4285F4',
                          }}
                        >
                          🤖 Temas extraídos por IA del PDF (
                          {extractedTopics.length} temas encontrados):
                        </h4>
                        <div
                          style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '10px',
                            backgroundColor: '#f9fafb',
                          }}
                        >
                          {extractedTopics.map((extractedTopic, index) => {
                            const isAlreadyAdded = topics.some(
                              (t) =>
                                t.name.toLowerCase() ===
                                extractedTopic.name.toLowerCase(),
                            );
                            return (
                              <div
                                key={`planning-topic-${extractedTopic.id || index}`}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px',
                                  backgroundColor: isAlreadyAdded
                                    ? '#dcfce7'
                                    : 'white',
                                  borderRadius: '4px',
                                  marginBottom: '5px',
                                  border: isAlreadyAdded
                                    ? '1px solid #16a34a'
                                    : '1px solid #e5e7eb',
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: '500' }}>
                                    {index + 1}. {extractedTopic.name}
                                  </span>
                                  {extractedTopic.description && (
                                    <div
                                      style={{
                                        fontSize: '12px',
                                        color: '#666',
                                        marginTop: '2px',
                                      }}
                                    >
                                      {extractedTopic.description}
                                    </div>
                                  )}
                                </div>
                                <button
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
                                  disabled={isAlreadyAdded}
                                  style={{
                                    backgroundColor: isAlreadyAdded
                                      ? '#16a34a'
                                      : '#4285F4',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '6px 12px',
                                    cursor: isAlreadyAdded
                                      ? 'default'
                                      : 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                  }}
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
                          style={{
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginTop: '10px',
                            width: '100%',
                          }}
                        >
                          ✨ Agregar todos los temas de IA
                        </button>
                      </div>
                    )}
                    <div
                      className="form-group"
                      style={{ marginBottom: '20px' }}
                    >
                      <label
                        style={{
                          fontWeight: '600',
                          marginBottom: '10px',
                          display: 'block',
                        }}
                      >
                        📅 Selecciona los días de la semana que tienes
                        disponibles para estudiar
                      </label>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: '10px',
                          marginBottom: '15px',
                        }}
                      >
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
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px',
                              cursor: 'pointer',
                              borderRadius: '8px',
                              backgroundColor: selectedWeekDays.includes(day)
                                ? '#dbeafe'
                                : 'white',
                              border: selectedWeekDays.includes(day)
                                ? '2px solid #3b82f6'
                                : '1px solid #e5e7eb',
                              transition: 'all 0.2s ease',
                            }}
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
                              style={{
                                marginRight: '8px',
                                width: '16px',
                                height: '16px',
                                cursor: 'pointer',
                              }}
                            />
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: selectedWeekDays.includes(day)
                                  ? '#1e40af'
                                  : '#374151',
                              }}
                            >
                              {name}
                            </span>
                          </div>
                        ))}
                      </div>
                      {(() => {
                        const selectedSubject = subjects.find(
                          (s) => s.id === selectedSubjectForPlanning,
                        );
                        if (!selectedSubject) {
                          return (
                            <p style={{ color: '#ef4444', fontSize: '14px' }}>
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
                            <p style={{ color: '#666', fontSize: '14px' }}>
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
                              <div
                                style={{
                                  marginTop: '15px',
                                  padding: '15px',
                                  backgroundColor: '#f0f9ff',
                                  border: '1px solid #0ea5e9',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: '600',
                                    marginBottom: '8px',
                                  }}
                                >
                                  📊 Resumen de tu planificación:
                                </div>
                                <div
                                  style={{
                                    fontSize: '13px',
                                    color: '#0369a1',
                                  }}
                                >
                                  • Días de la semana seleccionados:{' '}
                                  {selectedWeekDays.length}
                                </div>
                                <div
                                  style={{
                                    fontSize: '13px',
                                    color: '#0369a1',
                                  }}
                                >
                                  • Fecha del examen: {formatDate(examDate)}
                                </div>
                                <div
                                  style={{
                                    fontSize: '13px',
                                    color: '#0369a1',
                                  }}
                                >
                                  • Sesiones de estudio generadas:{' '}
                                  {generatedDates.length}
                                </div>
                                {topics.length > 0 && (
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      color: '#0369a1',
                                    }}
                                  >
                                    • Aproximadamente{' '}
                                    {Math.ceil(
                                      generatedDates.length / topics.length,
                                    )}{' '}
                                    sesiones por tema
                                  </div>
                                )}
                              </div>
                            )}
                            {selectedWeekDays.length > 0 &&
                              generatedDates.length === 0 && (
                                <div
                                  style={{
                                    marginTop: '15px',
                                    padding: '15px',
                                    backgroundColor: '#fef3c7',
                                    border: '1px solid #f59e0b',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: '#92400e',
                                  }}
                                >
                                  ⚠️ No hay fechas disponibles con los días de
                                  la semana seleccionados hasta la fecha del
                                  examen.
                                </div>
                              )}
                            {selectedWeekDays.length === 0 && (
                              <div
                                style={{
                                  marginTop: '15px',
                                  padding: '15px',
                                  backgroundColor: '#f3f4f6',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  color: '#6b7280',
                                  textAlign: 'center',
                                }}
                              >
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
                        <h4
                          style={{
                            marginBottom: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                          }}
                        >
                          📚{' '}
                          {selectedEvent
                            .replace(/-/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
                          ({topics.length} temas):
                        </h4>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {topics.map((topic, index) => (
                            <div
                              key={`topic-${topic.id || index}`}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                padding: '8px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '4px',
                                marginBottom: '5px',
                              }}
                            >
                              <span>{topic.name}</span>
                              <button
                                onClick={() => removeTopic(topic.id)}
                                style={{
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {topics.length > 0 && selectedWeekDays.length > 0 && (
                      <div style={{ marginTop: '20px' }}>
                        <button
                          onClick={generateStudyPlan}
                          disabled={generatingPlan}
                          style={{
                            backgroundColor: generatingPlan
                              ? '#9ca3af'
                              : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            cursor: generatingPlan ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: '600',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!generatingPlan) {
                              e.currentTarget.style.backgroundColor = '#059669';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!generatingPlan) {
                              e.currentTarget.style.backgroundColor = '#10b981';
                            }
                          }}
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
                      <div style={{ marginTop: '20px' }}>
                        <h4
                          style={{
                            marginBottom: '15px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>🎯</span>
                          Plan de Estudio Generado
                        </h4>
                        <div
                          style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '20px',
                            maxHeight: '500px',
                            overflowY: 'auto',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {generatedStudyPlan}
                        </div>
                        <div
                          style={{
                            marginTop: '10px',
                            display: 'flex',
                            gap: '10px',
                          }}
                        >
                          <button
                            onClick={() => setGeneratedStudyPlan('')}
                            style={{
                              backgroundColor: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            Cerrar plan
                          </button>
                          <button
                            onClick={generateStudyPlan}
                            disabled={generatingPlan}
                            style={{
                              backgroundColor: generatingPlan
                                ? '#9ca3af'
                                : '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              cursor: generatingPlan
                                ? 'not-allowed'
                                : 'pointer',
                              fontSize: '14px',
                            }}
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
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <p>No tienes planes de estudio creados aún.</p>
            <p>
              Crea uno desde la sección "Planificar" seleccionando temas y días
              de estudio.
            </p>
          </div>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {studyPlans.map((plan, index) => (
              <div
                key={`plan-${plan.id || index}`}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    borderBottom: plan.expanded ? '1px solid #e5e7eb' : 'none',
                  }}
                  onClick={() => togglePlanExpansion(plan.id)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>📖</span>
                        {plan.subjectName}
                      </h3>
                      <div
                        style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>🎯</span>
                          {plan.eventName}
                        </span>
                        {plan.examDate && (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>📅</span>
                            {formatDate(plan.examDate)}
                          </span>
                        )}
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>📚</span>
                          {plan.topics.length} temas
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>🗓️</span>
                          {plan.studyDays.length} días
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
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
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                      <span
                        style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          transform: plan.expanded
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        ▼
                      </span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          fontWeight: '500',
                        }}
                      >
                        Progreso del estudio
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#059669',
                          fontWeight: '600',
                        }}
                      >
                        {plan.progress}%
                        {plan.structuredPlan && (
                          <span style={{ color: '#6b7280', marginLeft: '4px' }}>
                            (
                            {
                              plan.structuredPlan.days.filter(
                                (d) => d.completed,
                              ).length
                            }
                            /{plan.structuredPlan.days.length} días)
                          </span>
                        )}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '10px',
                        margin: '20px 0',
                        height: '20px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${plan.progress}%`,
                          height: '100%',
                          backgroundColor:
                            plan.progress === 100 ? '#10b981' : '#3b82f6',
                          borderRadius: '10px',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {plan.progress}%
                      </div>
                    </div>
                  </div>
                </div>
                {plan.expanded && (
                  <div
                    style={{
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderTop: '1px solid #e5e7eb',
                    }}
                  >
                    {plan.structuredPlan ? (
                      <div>
                        <h4
                          style={{
                            margin: '0 0 16px 0',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>📅</span>
                          Cronograma de Estudio
                        </h4>
                        {plan.structuredPlan.summary && (
                          <div
                            style={{
                              backgroundColor: '#dbeafe',
                              border: '1px solid #93c5fd',
                              borderRadius: '8px',
                              padding: '12px',
                              marginBottom: '16px',
                              fontSize: '14px',
                              color: '#1e40af',
                            }}
                          >
                            <strong>📋 Resumen:</strong>{' '}
                            {plan.structuredPlan.summary}
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                          }}
                        >
                          {plan.structuredPlan.days.map((day, dayIndex) => (
                            <div
                              key={dayIndex}
                              style={{
                                backgroundColor: day.completed
                                  ? '#f0fdf4'
                                  : 'white',
                                border: day.completed
                                  ? '2px solid #22c55e'
                                  : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '16px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  marginBottom: '12px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                  }}
                                >
                                  <h5
                                    style={{
                                      margin: '0 0 8px 0',
                                      fontSize: '16px',
                                      fontWeight: '600',
                                      color: day.completed
                                        ? '#15803d'
                                        : '#374151',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                    }}
                                  >
                                    <span>{day.completed ? '✅' : '📅'}</span>
                                    Día {day.dayNumber} - {formatDate(day.date)}
                                  </h5>
                                  {day.totalTime && (
                                    <span
                                      style={{
                                        backgroundColor: day.completed
                                          ? '#dcfce7'
                                          : '#f3f4f6',
                                        color: day.completed
                                          ? '#15803d'
                                          : '#6b7280',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                      }}
                                    >
                                      ⏱️ {day.totalTime}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    toggleDayCompletion(plan.id, dayIndex)
                                  }
                                  style={{
                                    backgroundColor: day.completed
                                      ? '#22c55e'
                                      : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  {day.completed
                                    ? '✓ Completado'
                                    : 'Marcar como completado'}
                                </button>
                              </div>
                              <div style={{ marginBottom: '12px' }}>
                                <h6
                                  style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151',
                                  }}
                                >
                                  📚 Temas a estudiar:
                                </h6>
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                  }}
                                >
                                  {day.topics.map((topic, topicIndex) => (
                                    <div
                                      key={topicIndex}
                                      style={{
                                        backgroundColor: day.completed
                                          ? '#ecfdf5'
                                          : '#f9fafb',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        padding: '12px',
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'flex-start',
                                          marginBottom: '6px',
                                        }}
                                      >
                                        <span
                                          style={{
                                            margin: 0,
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#1f2937',
                                          }}
                                        >
                                          {topic.name}
                                        </span>
                                        {topic.estimatedTime && (
                                          <span
                                            style={{
                                              backgroundColor: '#e0e7ff',
                                              color: '#3730a3',
                                              padding: '2px 6px',
                                              borderRadius: '3px',
                                              fontSize: '11px',
                                              fontWeight: '500',
                                            }}
                                          >
                                            {topic.estimatedTime}
                                          </span>
                                        )}
                                      </div>
                                      <p
                                        style={{
                                          margin: 0,
                                          fontSize: '13px',
                                          color: '#6b7280',
                                          lineHeight: '1.4',
                                        }}
                                      >
                                        {topic.summary}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {day.recommendations && (
                                <div
                                  style={{
                                    backgroundColor: day.completed
                                      ? '#fef3c7'
                                      : '#fef7cd',
                                    border: '1px solid #fbbf24',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    fontSize: '13px',
                                    color: '#92400e',
                                  }}
                                >
                                  <strong>💡 Recomendaciones:</strong>{' '}
                                  {day.recommendations}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {plan.structuredPlan.finalRecommendations && (
                          <div
                            style={{
                              marginTop: '16px',
                              backgroundColor: '#ecfdf5',
                              border: '1px solid #bbf7d0',
                              borderRadius: '8px',
                              padding: '12px',
                              fontSize: '14px',
                              color: '#047857',
                            }}
                          >
                            <strong>🎯 Consejos finales para el examen:</strong>
                            <p
                              style={{
                                margin: '8px 0 0 0',
                                lineHeight: '1.5',
                              }}
                            >
                              {plan.structuredPlan.finalRecommendations}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <h4
                          style={{
                            margin: '0 0 16px 0',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>🎯</span>
                          Plan de Estudio (Formato Texto)
                        </h4>
                        <div
                          style={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '16px',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'inherit',
                          }}
                        >
                          {plan.content}
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
