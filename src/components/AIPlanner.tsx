import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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

interface UserAvailability {
  availability?: Record<string, boolean>;
  selectedWeekDays?: number[];
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
  subjectColor?: string; // CORREGIDO: Agregar campo para el color de la materia
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
  dailyTasks?: Array<{ day: number; task: string; completed: boolean }>;
}

const AIPlanner = () => {
  const { user } = useContext(AuthContext);
  const { extractedTopics, setExtractedTopics } = usePlanner();
  const navigate = useNavigate();

  const [topicCounter, setTopicCounter] = useState(1);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [selectedSubjectForPlanning, setSelectedSubjectForPlanning] = useState<
    string | number | null
  >(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicLocal[]>([]);
  const [userAvailability, setUserAvailability] =
    useState<UserAvailability | null>(null);
  const [materials, setMaterials] = useState<unknown[]>([]);
  // Contador local para generar IDs temporales para planes creados en sesión
  const [nextPlanId, setNextPlanId] = useState<number>(Date.now());

  const {
    getUserStudyPlans,
    createStudyPlan,
    deleteStudyPlan,
    getUserMaterials,
    getUserAvailability,
  } = useDatabase();

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      try {
        const materialsData = await getUserMaterials();
        setMaterials(materialsData);
        const convertedSubjects: Subject[] = materialsData.map(
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

        // Cargar temas extraídos del primer material si existe
        if (
          materialsData.length > 0 &&
          materialsData[0] &&
          'extractedTopics' in materialsData[0] &&
          materialsData[0].extractedTopics
        ) {
          const firstMaterial = materialsData[0] as {
            extractedTopics: Array<{
              id: string;
              name: string;
              description?: string;
            }>;
          };
          setExtractedTopics(
            firstMaterial.extractedTopics.map((topic, index) => ({
              ...topic,
              order: index + 1,
            })),
          );
        }

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
            subjectColor: plan.generatedPlan.subjectColor || '#4285F4', // CORREGIDO: Agregar el color de la materia
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
  }, [user, getUserStudyPlans, getUserMaterials, setExtractedTopics]);

  // Cargar disponibilidad del usuario por separado
  useEffect(() => {
    const loadAvailability = async () => {
      if (!user) return;
      try {
        const availability = await getUserAvailability(user.uid);
        setUserAvailability(availability || null);
      } catch (err) {
        console.warn('No se pudo cargar la disponibilidad del usuario:', err);
        setUserAvailability(null);
      }
    };
    loadAvailability();
  }, [user, getUserAvailability]);

  const removeTopic = (id: string) => {
    setTopics(topics.filter((t) => t.id !== id));
  };

  const generateStudyPlan = async () => {
    if (!selectedSubjectForPlanning || !selectedEvent || topics.length === 0) {
      alert('Por favor completa todos los campos: materia, evento y temas.');
      return;
    }

    // Leer obligatoriamente la configuración del usuario desde Firestore
    if (!user) {
      alert('Debes iniciar sesión para generar un plan.');
      return;
    }

    let userSettings: UserAvailability | null = null;
    try {
      userSettings = await getUserAvailability(user.uid);
      if (
        !userSettings ||
        !Array.isArray(userSettings.selectedWeekDays) ||
        userSettings.selectedWeekDays.length === 0
      ) {
        alert(
          'Por favor guarda tu disponibilidad en Configuración antes de generar un plan.',
        );
        return;
      }
    } catch (e) {
      console.warn(
        'No se pudieron cargar los días de configuración del usuario:',
        e,
      );
      alert('Error leyendo la configuración del usuario. Inténtalo de nuevo.');
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

      const endpoint = import.meta.env.VITE_GENERATE_PLAN_ENDPOINT;

      const response = await fetch(endpoint, {
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
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en la función Gemini: ${response.status}`);
      }

      const result = await response.json();
      let studyPlan = '';
      let structuredPlan = null;

      if (result.parsed) {
        structuredPlan = result.parsed;
        studyPlan = JSON.stringify(structuredPlan);
      } else if (result.plan) {
        // compatibilidad con variantes antiguas
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
      // Extraer studyDates desde el structuredPlan recibido
      const generatedStudyDates: string[] =
        structuredPlan && Array.isArray(structuredPlan.days)
          ? structuredPlan.days.map((d: StudyPlanDay) => normalizeDate(d.date))
          : [];

      // Construir un título legible para el plan (ej: "Final - Materia")
      const eventTitle = `${selectedEvent
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())} - ${selectedSubject.name}`;

      let savedPlanId: string | undefined = undefined;
      try {
        // Crear un materialId único que incluya la materia y el evento para evitar duplicados
        const uniqueMaterialId = `${selectedSubject.id}_${selectedEvent}_${examDate.replace(/-/g, '')}`;

        const planId = await createStudyPlan({
          materialId: uniqueMaterialId,
          generatedPlan: {
            title: eventTitle,
            summary:
              structuredPlan?.summary || 'Plan de estudio generado con IA',
            durationDays: generatedStudyDates.length,
            examDate: examDate,
            selectedWeekDays: userSettings.selectedWeekDays,
            topics: topics.map((t) => ({ id: t.id, title: t.name })),
            studyDates: generatedStudyDates,
            subjectColor: selectedSubject.color, // CORREGIDO: Agregar el color de la materia
            structuredPlan: structuredPlan ?? undefined,
            dailyTasks: structuredPlan?.days
              ? structuredPlan.days.map((day: StudyPlanDay, index: number) => ({
                  day: index + 1,
                  task: `${day.topics.map((t: { name: string }) => t.name).join(', ')} - ${day.recommendations}`,
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
          savedPlanId = planId;
          console.log('✅ Plan completo guardado en Firebase con ID:', planId);
          toast.success('Plan guardado correctamente');
          // After saving successfully, reload plans from Firebase
          const studyPlans = await getUserStudyPlans();
          const convertedPlans = studyPlans.map((plan, index) => {
            const planId = plan.id || `plan-${Date.now()}-${index}`;
            return {
              id: planId,
              subjectName: plan.generatedPlan.title || 'Plan de Estudio',
              eventName: plan.generatedPlan.title.split(' - ')[0] || 'Examen',
              examDate: plan.generatedPlan.examDate || '',
              topics: Array.isArray(plan.generatedPlan.topics)
                ? plan.generatedPlan.topics.map((topic) =>
                    typeof topic === 'string'
                      ? {
                          id: `topic-${planId}`,
                          title: topic,
                          description: '',
                        }
                      : topic,
                  )
                : [],
              studyDays: plan.generatedPlan.studyDates || [],
              content: JSON.stringify(plan.generatedPlan.structuredPlan || {}),
              subjectColor: plan.generatedPlan.subjectColor || '#4285F4', // CORREGIDO: Agregar el color de la materia
              structuredPlan: plan.generatedPlan.structuredPlan || null,
              progress: 0,
              createdAt: plan.createdAt
                ? typeof plan.createdAt === 'object' &&
                  'toDate' in plan.createdAt
                  ? plan.createdAt.toDate().toISOString()
                  : typeof plan.createdAt === 'string'
                    ? plan.createdAt
                    : new Date().toISOString()
                : new Date().toISOString(),
              expanded: false,
            };
          });
          setStudyPlans(convertedPlans);
        } else {
          // If we couldn't get a planId from the backend, notify the user
          toast('Plan creado en la sesión (no guardado en servidor)', {
            icon: 'ℹ️',
          });
        }
      } catch (firebaseError: unknown) {
        console.error('❌ Error guardando plan en Firebase:', firebaseError);
        toast.error('Error guardando plan en Firebase');
      }

      const newPlan: StudyPlan = {
        id: savedPlanId || nextPlanId,
        subjectName: selectedSubject.name,
        eventName: selectedEvent
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        examDate: examDate || '',
        topics: topics.map((t) => ({ id: t.id, title: t.name })),
        studyDays: generatedStudyDates,
        content: studyPlan,
        subjectColor: selectedSubject.color, // CORREGIDO: Agregar el color de la materia
        structuredPlan: structuredPlan,
        progress: 0,
        createdAt: new Date().toISOString(),
        expanded: false,
      };

      // Si el plan ya fue guardado en Firebase (savedPlanId), entonces
      // ya recargamos la lista `studyPlans` desde el servidor y no
      // debemos volver a agregarlo localmente (provoca claves duplicadas).
      if (!savedPlanId) {
        setStudyPlans((prevPlans) => [...prevPlans, newPlan]);
        setNextPlanId((prev) => prev + 1);
      } else {
        // No incrementamos nextPlanId ni agregamos el plan localmente
        // porque la lista ya fue actualizada desde Firebase.
      }

      // Reset para tener que elegir una nueva materia
      setSelectedSubjectForPlanning(null);
      setSelectedEvent(null);
      setTopics([]);
      setExtractedTopics([]);
      setTopicCounter(1);

      console.log('🎉 Plan de estudio generado y guardado exitosamente');
    } catch (error: unknown) {
      console.error('❌ Error generando plan de estudio:', error);
      toast.error('Error generando el plan de estudio. Inténtalo de nuevo.');
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

  const formatWeekDays = (weekDays: number[] | undefined | null) => {
    if (!Array.isArray(weekDays) || weekDays.length === 0) return '';
    const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return weekDays
      .sort((a, b) => a - b)
      .map((d) => names[d] || String(d))
      .join(', ');
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
                  // availability is read from server; no local weekday selection

                  // Cargar temas extraídos de la materia seleccionada
                  const selectedMaterial = materials.find((m: unknown) => {
                    const material = m as { id?: string };
                    return material.id === subjectId;
                  });
                  if (
                    selectedMaterial &&
                    typeof selectedMaterial === 'object' &&
                    selectedMaterial !== null &&
                    'extractedTopics' in selectedMaterial
                  ) {
                    const materialWithTopics = selectedMaterial as {
                      extractedTopics: Array<{
                        id: string;
                        name: string;
                        description?: string;
                      }>;
                    };
                    if (materialWithTopics.extractedTopics) {
                      setExtractedTopics(
                        materialWithTopics.extractedTopics.map(
                          (topic, index) => ({
                            ...topic,
                            order: index + 1,
                          }),
                        ),
                      );
                    } else {
                      setExtractedTopics([]);
                    }
                  } else {
                    setExtractedTopics([]);
                  }
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
                          Temas extraídos por IA del PDF (
                          {extractedTopics.length} temas encontrados):
                        </h4>
                        <div className="topic-list-container">
                          {extractedTopics.map((extractedTopic, index) => {
                            const isAlreadyAdded = topics.some(
                              (t) =>
                                t.name.toLowerCase() ===
                                extractedTopic.name.toLowerCase(),
                            );
                            // Key única por tema: combina id de materia, id del tema (o índice) y nombre estandar.
                            const safeTopicId = extractedTopic.id
                              ? String(extractedTopic.id)
                              : `idx-${index}`;
                            const subjectKeyPart = selectedSubjectForPlanning
                              ? String(selectedSubjectForPlanning)
                              : 'no-subject';
                            const sanitizedName = String(extractedTopic.name)
                              .replace(/\s+/g, '-')
                              .replace(/[^a-zA-Z0-9-_]/g, '')
                              .slice(0, 40);

                            const itemKey = `planning-topic-${subjectKeyPart}-${safeTopicId}-${sanitizedName}`;

                            return (
                              <div
                                key={itemKey}
                                className={`topic-item ${isAlreadyAdded ? 'added' : ''}`}
                                onClick={() => {
                                  if (!isAlreadyAdded) {
                                    const newTopic = {
                                      // id único por materia + contador local
                                      id: `topic-${selectedSubjectForPlanning}-${Date.now()}-${topicCounter}`,
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
                            const timestamp = Date.now();
                            const newTopics = extractedTopics
                              .filter((extractedTopic) => {
                                const isAlreadyAdded = topics.some(
                                  (t) =>
                                    t.name.toLowerCase() ===
                                    extractedTopic.name.toLowerCase(),
                                );
                                return !isAlreadyAdded;
                              })
                              .map((extractedTopic, idx) => ({
                                // id único con timestamp para evitar colisiones
                                id: `topic-${selectedSubjectForPlanning}-${timestamp}-${topicCounter + idx}`,
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
                      <label>📅 Días de estudio</label>
                      <div className="info-box">
                        Los días de estudio se tomarán desde tu configuración de
                        cuenta.
                      </div>
                      {userAvailability &&
                      Array.isArray(userAvailability.selectedWeekDays) &&
                      userAvailability.selectedWeekDays.length > 0 ? (
                        <div className="saved-days-box">
                          <strong>Días guardados:</strong>{' '}
                          {formatWeekDays(userAvailability.selectedWeekDays)}
                        </div>
                      ) : (
                        <div className="warning-box">
                          Aún no configuraste tu disponibilidad. Ve a
                          <strong> Configuración de cuenta</strong> y guarda tus
                          días de estudio antes de generar un plan.
                        </div>
                      )}
                      <button
                        className="button-secondary"
                        onClick={() => {
                          navigate('/settings');
                          // Usar setTimeout para asegurar que la navegación se complete antes de cambiar la pestaña
                          setTimeout(() => {
                            // Buscar el botón de la pestaña 'planner' y hacer clic en él
                            const plannerTab = document.querySelector(
                              '[data-tab="planner"]',
                            ) as HTMLButtonElement;
                            if (plannerTab) {
                              plannerTab.click();
                            } else {
                              // Fallback: buscar por texto del botón
                              const buttons =
                                document.querySelectorAll('button');
                              const plannerButton = Array.from(buttons).find(
                                (btn) =>
                                  btn.textContent?.includes('Planificador IA'),
                              ) as HTMLButtonElement;
                              if (plannerButton) {
                                plannerButton.click();
                              }
                            }
                          }, 100);
                        }}
                        style={{ marginTop: '8px' }}
                      >
                        Editar en Configuración
                      </button>
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
                              // Usar el id del topic si existe (es estable), sino
                              // un fallback con índice y nombre para mantener unicidad
                              key={
                                topic.id
                                  ? String(topic.id)
                                  : `topic-fallback-${index}-${String(topic.name).replace(/\s+/g, '-')}`
                              }
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
                    {topics.length > 0 &&
                      userAvailability &&
                      Array.isArray(userAvailability.selectedWeekDays) &&
                      userAvailability.selectedWeekDays.length > 0 && (
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
