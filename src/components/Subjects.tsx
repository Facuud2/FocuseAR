import React, { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { useContext } from 'react';
import { AuthContext } from '../hooks/authContext';
import { PDFProcessor, type ExtractedTopic } from '../services/PDFProcessor';
import { extractTextFromPDF } from '../services/PDFTextExtractor';
import SelectorDeColor from './SelectorDeColor';
import { AnalysisModal } from './AnalysisModal';
import 'react-datepicker/dist/react-datepicker.css';
import './Dashboard.css';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { type StudyPlanDay } from './Dashboard';

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

interface Topic {
  id: string;
  name: string;
}

interface AnalysisState {
  isAnalyzing: boolean;
  progress: number;
  statusMessage: string;
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

const Subjects: React.FC = () => {
  const { user } = useContext(AuthContext);
  const {
    loading: dbLoading,
    error: dbError,
    getUserMaterials,
    getUserStudyPlans,
    createMaterial,
    createStudyPlan,
    deleteStudyPlan,
    deleteMaterialAndPlans,
  } = useDatabase();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4285F4');
  const [firstPartialDate, setFirstPartialDate] = useState<Date | null>(null);
  const [secondPartialDate, setSecondPartialDate] = useState<Date | null>(null);
  const [tpDate, setTpDate] = useState<Date | null>(null);
  const [otherDates, setOtherDates] = useState<
    { id: number; name: string; date: Date | null }[]
  >([]);

  const [selectedSubjectForPlanning, setSelectedSubjectForPlanning] = useState<
    number | null
  >(null);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [extractedTopics, setExtractedTopics] = useState<ExtractedTopic[]>([]);
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
  const [generatedStudyPlan, setGeneratedStudyPlan] = useState<string>('');
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [nextPlanId, setNextPlanId] = useState(1);

  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [dragActive, setDragActive] = React.useState(false);

  const [analysisStatus, setAnalysisStatus] = useState<AnalysisState>({
    isAnalyzing: false,
    progress: 0,
    statusMessage: '',
  });

  const [topicCounter, setTopicCounter] = useState(1);

  const updateAnalysisStatus = (status: Partial<AnalysisState>) => {
    setAnalysisStatus((prev) => ({ ...prev, ...status }));
  };

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
              name: material.fileName.replace(/\.(pdf|docx|doc)$/i, ''),
              examDate: '',
              color: '#4285F4',
              pdfs: [
                {
                  id: 1,
                  name: material.fileName,
                  size: '0 MB',
                },
              ],
              importantDates: [],
            };
          },
        );
        setSubjects(convertedSubjects);

        const studyPlans = await getUserStudyPlans();
        const convertedPlans = studyPlans.map((plan, index) => {
          const planId = plan.id || `plan-${Date.now()}-${index}`;
          return {
            id: planId,
            subjectName: plan.generatedPlan.title || 'Plan de Estudio',
            eventName: 'Examen',
            examDate: plan.generatedPlan.examDate || '',
            topics: plan.generatedPlan.topics || [],
            studyDays: plan.generatedPlan.studyDates || [],
            content: JSON.stringify(plan.generatedPlan.structuredPlan || {}),
            structuredPlan: plan.generatedPlan.structuredPlan,
            progress: 0,
            createdAt:
              plan.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            expanded: false,
          };
        });
        setStudyPlans(convertedPlans);
        if (
          studyPlans.length > 0 &&
          studyPlans[0].generatedPlan.selectedWeekDays
        ) {
          setSelectedWeekDays(studyPlans[0].generatedPlan.selectedWeekDays);
        }
      } catch (error: unknown) {
        console.error('Error al cargar datos del usuario:', error);
      }
    };
    loadUserData();
  }, [user, getUserMaterials, getUserStudyPlans]);

  const handlePlanify = async () => {
    const importantDates: {
      name: string;
      date: string;
      type: 'exam' | 'tp' | 'other';
    }[] = [];
    if (firstPartialDate)
      importantDates.push({
        name: 'Primer Parcial',
        date: format(firstPartialDate, 'yyyy-MM-dd'),
        type: 'exam',
      });
    if (secondPartialDate)
      importantDates.push({
        name: 'Segundo Parcial',
        date: format(secondPartialDate, 'yyyy-MM-dd'),
        type: 'exam',
      });
    if (tpDate)
      importantDates.push({
        name: 'Trabajo Práctico',
        date: format(tpDate, 'yyyy-MM-dd'),
        type: 'tp',
      });
    otherDates.forEach((d) => {
      if (d.name && d.date)
        importantDates.push({
          name: d.name,
          date: format(d.date, 'yyyy-MM-dd'),
          type: 'other',
        });
    });

    if (!subjectName || pdfs.length === 0 || importantDates.length === 0) {
      alert('Completa el nombre, sube un PDF y añade al menos una fecha.');
      return;
    }

    try {
      if (pdfs.length > 0) {
        const materialId = await createMaterial({
          fileName: pdfs[0].name,
          storagePath: `materials/${user?.uid}/${pdfs[0].name}`,
          fileType: 'pdf',
        });

        if (materialId) {
          const newSubject: Subject = {
            id: Date.now(),
            name: subjectName,
            examDate:
              importantDates.length > 0
                ? importantDates.map((d) => d.date).sort()[0]
                : '',
            color: selectedColor,
            pdfs,
            importantDates,
          };

          setSubjects([...subjects, newSubject]);
          setSubjectName('');
          setPdfs([]);
          setFirstPartialDate(null);
          setSecondPartialDate(null);
          setTpDate(null);
          setOtherDates([]);
          alert('Materia añadida exitosamente y guardada en Firebase!');
        }
      }
    } catch (error: unknown) {
      console.error('Error al guardar materia en Firebase:', error);
      alert('Error al guardar la materia. Inténtalo de nuevo.');
    }
  };

  const addOtherDate = () => {
    const newDate = {
      id: Date.now(),
      name: '',
      date: null,
    };
    setOtherDates([...otherDates, newDate]);
  };

  const updateOtherDate = (
    id: number,
    field: 'name' | 'date',
    value: string | Date | null,
  ) => {
    setOtherDates(
      otherDates.map((d) => {
        if (d.id === id) {
          return { ...d, [field]: value };
        }
        return d;
      }),
    );
  };

  const removeOtherDate = (id: number) => {
    setOtherDates(otherDates.filter((d) => d.id !== id));
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

  const deleteSubject = async (subjectId: string | number) => {
    try {
      const materials = await getUserMaterials();
      const firebaseMaterial = materials.find((material) => {
        return material.id === subjectId || material.id === String(subjectId);
      });
      if (firebaseMaterial && firebaseMaterial.id) {
        await deleteMaterialAndPlans(firebaseMaterial.id);
      }
      const subjectToDelete = subjects.find((s) => s.id === subjectId);
      const subjectName = subjectToDelete?.name;
      setSubjects((prevSubjects) => {
        const newSubjects = prevSubjects.filter(
          (subject) => subject.id !== subjectId,
        );
        return newSubjects;
      });
      setStudyPlans((prevPlans) => {
        const newPlans = prevPlans.filter((plan) => {
          const matches =
            plan.subjectName === subjectName ||
            plan.subjectName.includes(subjectName || '') ||
            (subjectName && subjectName.includes(plan.subjectName));
          return !matches;
        });
        return newPlans;
      });
    } catch (error: unknown) {
      console.error('❌ Error al eliminar materia:', error);
      alert('Error al eliminar la materia. Inténtalo de nuevo.');
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    const files = Array.from(e.target.files);
    if (pdfs.length + files.length > 5) {
      alert('Máximo 5 PDF');
      return;
    }
    const newPdfs = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
    }));
    setPdfs([...pdfs, ...newPdfs]);
    if (files.length > 0 && subjectName.trim()) {
      await processPDFWithGemini(files[0]);
    } else if (!subjectName.trim()) {
      console.log('⚠️ No se puede procesar: falta el nombre de la materia');
    }
  };

  const processPDFWithGemini = async (file: File) => {
    if (!subjectName.trim()) {
      alert('Por favor ingresa el nombre de la materia antes de subir el PDF');
      return;
    }
    updateAnalysisStatus({
      isAnalyzing: true,
      progress: 10,
      statusMessage: 'Extrayendo texto del PDF...',
    });
    try {
      const text = await extractTextFromPDF(file);
      updateAnalysisStatus({
        progress: 40,
        statusMessage: 'Enviando texto a la IA...',
      });
      const result = await PDFProcessor.processPDFTextWithGemini(
        text,
        subjectName,
      );
      if (result.success) {
        updateAnalysisStatus({
          progress: 100,
          statusMessage: '¡Análisis completado!',
        });
        await new Promise((resolve) => setTimeout(resolve, 0));
        setExtractedTopics(result.topics);
        alert(
          `¡Éxito! Se extrajeron ${result.topics.length} temas del PDF. Puedes verlos en la sección de Planificación.`,
        );
      } else {
        alert(`Error procesando PDF: ${result.error}`);
      }
    } catch {
      alert('Error procesando el PDF. Inténtalo de nuevo.');
    } finally {
      setTimeout(() => {
        updateAnalysisStatus({
          isAnalyzing: false,
          progress: 0,
          statusMessage: '',
        });
      }, 500);
    }
  };

  const removePdf = (id: number) => {
    setPdfs(pdfs.filter((p) => p.id !== id));
  };

  return (
    <div className="left-panel">
      <div className="panel">
        <h2>
          <i className="fas fa-book"></i> Nueva Materia
        </h2>
        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="Ej: Álgebra Lineal"
          />
          {
            <div className="dates-section">
              <h4
                style={{
                  marginBottom: '15px',
                  color: '#333',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                Fechas Importantes
              </h4>
              <div className="form-group">
                <label>Fecha Primer Parcial</label>
                <DatePicker
                  selected={firstPartialDate}
                  onChange={(date: Date | null) => setFirstPartialDate(date)}
                  dateFormat="P"
                  locale={es}
                  className="w-full p-2 border rounded"
                  placeholderText="Selecciona una fecha"
                  minDate={new Date()}
                />
              </div>
              {otherDates.map((otherDate, index) => (
                <div
                  key={`other-date-${otherDate.id || index}`}
                  className="form-group"
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'end',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label>Nombre del Evento</label>
                    <input
                      type="text"
                      placeholder="ej: Entrega Proyecto Final"
                      value={otherDate.name}
                      onChange={(e) =>
                        updateOtherDate(otherDate.id, 'name', e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Fecha</label>
                    <DatePicker
                      selected={otherDate.date}
                      onChange={(date: Date | null) =>
                        updateOtherDate(otherDate.id, 'date', date)
                      }
                      dateFormat="P"
                      locale={es}
                      className="w-full p-2 border rounded"
                      placeholderText="Selecciona una fecha"
                      minDate={new Date()}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOtherDate(otherDate.id)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOtherDate}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginTop: '10px',
                }}
              >
                + Agregar OTROS
              </button>
            </div>
          }
          <div className="form-group">
            <label>Color</label>
            <div
              className="color-options"
              style={{ display: 'flex', gap: '8px' }}
            >
              {['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#9b59b6'].map(
                (c) => (
                  <div
                    key={c}
                    className={`color-option ${selectedColor === c ? 'selected' : ''}`}
                    style={{
                      backgroundColor: c,
                      width: '36px',
                      height: '36px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border:
                        selectedColor === c
                          ? '2px solid #000'
                          : '1px solid #ccc',
                    }}
                    onClick={() => setSelectedColor(c)}
                  />
                ),
              )}
              <div style={{ position: 'relative' }}>
                <SelectorDeColor
                  color={selectedColor}
                  onChange={setSelectedColor}
                />
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '36px',
                  height: '36px',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
                title="Elegir color"
              >
                ...
              </div>
            </div>
          </div>
        </div>
        <div className="pdf-section">
          <h3>
            <i className="fas fa-file-pdf"></i> Programa de la materia (PDF)
          </h3>
          <div
            className={`upload-area${dragActive ? ' dragover' : ''}`}
            onClick={() => {
              if (!analysisStatus.isAnalyzing) {
                document.getElementById('pdf-upload')?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!analysisStatus.isAnalyzing) {
                setDragActive(true);
              }
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setDragActive(false);
              if (analysisStatus.isAnalyzing) return;
              const files = Array.from(e.dataTransfer.files).filter(
                (f) => f.type === 'application/pdf',
              );
              if (pdfs.length + files.length > 5) {
                console.log('Máximo 5 archivos PDF permitidos');
                return;
              }
              const newPdfs = files.map((file) => ({
                id: Date.now() + Math.random(),
                name: file.name,
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
              }));
              setPdfs([...pdfs, ...newPdfs]);
              if (files.length > 0 && subjectName.trim()) {
                await processPDFWithGemini(files[0]);
              }
            }}
            style={{
              cursor: analysisStatus.isAnalyzing ? 'wait' : 'pointer',
              opacity: analysisStatus.isAnalyzing ? 0.7 : 1,
              position: 'relative',
            }}
          >
            <input
              id="pdf-upload"
              type="file"
              multiple
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={handlePdfUpload}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                <path
                  d="M24 32V18M24 18L18 24M24 18L30 24"
                  stroke="#4285F4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M36 36H12C8.68629 36 6 33.3137 6 30C6 26.6863 8.68629 24 12 24H14.5C15.3284 24 16 23.3284 16 22.5C16 19.4624 18.4624 17 21.5 17C23.9853 17 26 19.0147 26 21.5V22.5C26 23.3284 26.6716 24 27.5 24H36C39.3137 24 42 26.6863 42 30C42 33.3137 39.3137 36 36 36Z"
                  stroke="#4285F4"
                  strokeWidth="2"
                />
              </svg>
              <span
                style={{
                  marginTop: '10px',
                  color: analysisStatus.isAnalyzing ? '#f59e0b' : '#4285F4',
                  fontWeight: '500',
                  fontSize: '15px',
                  textAlign: 'center',
                }}
              >
                {analysisStatus.isAnalyzing
                  ? '🤖 Procesando PDF con IA...'
                  : 'Haz click o arrastra el contenido de la materia'}
              </span>
            </div>
            {pdfs.length > 0 && (
              <div style={{ width: '100%', marginTop: '15px' }}>
                <h4
                  style={{
                    margin: '10px 0',
                    fontSize: '14px',
                    color: '#4B5563',
                  }}
                >
                  Archivos cargados:
                </h4>
                <div
                  style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '8px',
                  }}
                >
                  {pdfs.map((pdf, index) => (
                    <div
                      key={`pdf-${pdf.id || index}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        backgroundColor: '#F9FAFB',
                        marginBottom: '6px',
                        borderRadius: '4px',
                        borderLeft: '3px solid #3B82F6',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                            fill="#EF4444"
                          />
                          <path d="M14 2V8H20" fill="#FECACA" />
                          <path d="M14 2L20 8H14V2Z" fill="#FCA5A5" />
                        </svg>
                        <span style={{ fontSize: '13px' }}>{pdf.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#6B7280',
                            marginRight: '8px',
                          }}
                        >
                          {pdf.size}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePdf(pdf.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = '#FEE2E2')
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              'transparent')
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          className="planify-btn"
          onClick={handlePlanify}
          disabled={dbLoading || !user}
        >
          {dbLoading ? (
            <span>⏳ Guardando...</span>
          ) : (
            <span>
              <i className="fas fa-upload"></i> Cargar materia
            </span>
          )}
        </button>
      </div>
      {analysisStatus.isAnalyzing && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: '6px',
            padding: '15px',
            marginTop: '15px',
            color: '#92400E',
            textAlign: 'center',
          }}
        >
          <strong>🤖 Procesando PDF con IA...</strong>
          <div style={{ fontSize: '12px', marginTop: '5px' }}>
            Por favor espera mientras Gemini analiza el contenido
          </div>
          <div
            style={{
              fontSize: '11px',
              marginTop: '8px',
              fontStyle: 'italic',
            }}
          >
            📊 Revisa la consola del navegador para ver el progreso detallado
          </div>
        </div>
      )}
      {dbError && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '6px',
            padding: '15px',
            marginTop: '15px',
            color: '#DC2626',
          }}
        >
          <strong>❌ Error en base de datos:</strong> {dbError}
        </div>
      )}
      {user && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #BBF7D0',
            borderRadius: '6px',
            padding: '10px',
            marginTop: '15px',
            color: '#047857',
            fontSize: '14px',
          }}
        >
          <strong>✅ Conectado a Firestore como:</strong> {user.email}
        </div>
      )}
      {extractedTopics.length > 0 && (
        <div
          style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '6px',
            padding: '10px',
            marginTop: '10px',
            fontSize: '12px',
          }}
        >
          <strong>🔍 DEBUG - Temas extraídos por IA:</strong>
          <div>Total: {extractedTopics.length} temas</div>
          <div
            style={{
              maxHeight: '100px',
              overflowY: 'auto',
              marginTop: '5px',
            }}
          >
            {extractedTopics.map((topic, i) => (
              <div
                key={`extracted-topic-${topic.id || i}`}
                style={{ marginBottom: '2px' }}
              >
                {i + 1}. {topic.name}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="panel">
        <h2>
          <i className="fas fa-list"></i> Mis Materias
        </h2>
        {subjects.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-book-open"></i>
            <p>No hay materias planificadas</p>
            <small>Agrega tu primera materia arriba</small>
          </div>
        ) : (
          <div className="subjects-grid">
            {subjects.map((subject, index) => {
              const initial = subject.name.charAt(0).toUpperCase();
              return (
                <div
                  key={`subject-${subject.id || index}`}
                  className="subject-card"
                >
                  <div className="subject-header">
                    <div
                      className="subject-icon"
                      style={{ backgroundColor: subject.color }}
                    >
                      <span>{initial}</span>
                    </div>
                    <div className="subject-info">
                      <h3 className="subject-name">{subject.name}</h3>
                      <p className="subject-date">
                        <i className="fas fa-calendar-alt"></i>
                        {subject.examDate && subject.examDate !== ''
                          ? new Date(subject.examDate).toLocaleDateString(
                              'es-ES',
                            )
                          : 'Fecha no definida'}
                      </p>
                    </div>
                  </div>
                  <div className="subject-footer">
                    <span className="pdf-count">
                      <i className="fas fa-file-pdf"></i>
                      {subject.pdfs.length} PDF(s)
                    </span>
                    <div className="subject-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(100, (subject.pdfs.length / 5) * 100)}%`,
                            backgroundColor: subject.color,
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {subject.pdfs.length}/5
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            `¿Estás seguro de que quieres eliminar la materia "${subject.name}" y todos sus planes de estudio asociados?`,
                          )
                        ) {
                          deleteSubject(subject.id);
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '8px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef4444';
                      }}
                    >
                      <i className="fas fa-trash"></i>
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                value={selectedSubjectForPlanning || ''}
                onChange={(e) => {
                  const subjectId = e.target.value
                    ? parseInt(e.target.value)
                    : null;
                  setSelectedSubjectForPlanning(subjectId);
                  setSelectedEvent('');
                  setTopics([]);
                  setSelectedWeekDays([]);
                }}
              >
                <option value="">-- Selecciona una materia --</option>
                {subjects.map((subject, index) => (
                  <option
                    key={`option-${subject.id || index}`}
                    value={subject.id || ''}
                  >
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
                    value={selectedEvent}
                    onChange={(e) => {
                      setSelectedEvent(e.target.value);
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
                                  style={{ fontSize: '13px', color: '#0369a1' }}
                                >
                                  • Días de la semana seleccionados:{' '}
                                  {selectedWeekDays.length}
                                </div>
                                <div
                                  style={{ fontSize: '13px', color: '#0369a1' }}
                                >
                                  • Fecha del examen: {formatDate(examDate)}
                                </div>
                                <div
                                  style={{ fontSize: '13px', color: '#0369a1' }}
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
                              style={{ margin: '8px 0 0 0', lineHeight: '1.5' }}
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
      <AnalysisModal
        isAnalyzing={analysisStatus.isAnalyzing}
        progress={analysisStatus.progress}
        statusMessage={analysisStatus.statusMessage}
      />
    </div>
  );
};

export default Subjects;
