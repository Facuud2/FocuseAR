import React, { useState, type JSX /* useEffect */ } from 'react';
import DatabaseTester from './components/DatabaseTester';
import { useDatabase } from './hooks/useDatabase';
import { useContext } from 'react';
import { AuthContext } from './context/authContext';
import { PDFProcessor, type ExtractedTopic } from './services/PDFProcessor';

interface Pdf {
  id: number;
  name: string;
  size: string;
}

interface Subject {
  id: number;
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

interface Event {
  id: number;
  subjectId: number;
  subject: string;
  type: 'exam' | 'study' | 'task';
  date: string;
  title: string;
  color: string;
}

interface Topic {
  id: number;
  name: string;
}

const Dashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { loading: dbLoading, error: dbError } = useDatabase();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events] = useState<Event[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4285F4');

  // Estados para el formulario de fechas
  const [firstPartialDate, setFirstPartialDate] = useState('');
  const [secondPartialDate, setSecondPartialDate] = useState('');
  const [tpDate, setTpDate] = useState('');
  const [otherDates, setOtherDates] = useState<
    { id: number; name: string; date: string }[]
  >([]);

  // Estados para la planificación
  const [selectedSubjectForPlanning, setSelectedSubjectForPlanning] = useState<
    number | null
  >(null);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [extractedTopics, setExtractedTopics] = useState<ExtractedTopic[]>([]);
  const [processingPDF, setProcessingPDF] = useState(false);
  const [selectedStudyDays, setSelectedStudyDays] = useState<string[]>([]);
  const [generatedStudyPlan, setGeneratedStudyPlan] = useState<string>('');
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // Estados para planes de estudio guardados
  const [studyPlans, setStudyPlans] = useState<
    Array<{
      id: number;
      subjectName: string;
      eventName: string;
      examDate: string;
      topics: string[];
      studyDays: string[];
      content: string;
      structuredPlan: {
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
      } | null;
      progress: number;
      createdAt: string;
      expanded: boolean;
    }>
  >([]);
  const [nextPlanId, setNextPlanId] = useState(1);

  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dragActive, setDragActive] = React.useState(false);

  // === LOGICA DE MATERIAS ===
  const handlePlanify = async () => {
    // Recopilar todas las fechas importantes
    const importantDates: {
      name: string;
      date: string;
      type: 'exam' | 'tp' | 'other';
    }[] = [];
    if (firstPartialDate)
      importantDates.push({
        name: 'Primer Parcial',
        date: firstPartialDate,
        type: 'exam',
      });
    if (secondPartialDate)
      importantDates.push({
        name: 'Segundo Parcial',
        date: secondPartialDate,
        type: 'exam',
      });
    if (tpDate)
      importantDates.push({
        name: 'Trabajo Práctico',
        date: tpDate,
        type: 'tp',
      });
    otherDates.forEach((d) => {
      if (d.name && d.date)
        importantDates.push({ name: d.name, date: d.date, type: 'other' });
    });

    if (!subjectName || pdfs.length === 0 || importantDates.length === 0) {
      alert('Completa el nombre, sube un PDF y añade al menos una fecha.');
      return;
    }

    // Crear materia local (sin Firestore por ahora)
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

    // Limpiar el formulario
    setSubjectName('');
    setPdfs([]);
    setFirstPartialDate('');
    setSecondPartialDate('');
    setTpDate('');
    setOtherDates([]);
    // NO limpiar extractedTopics para mantener los temas disponibles en Planificación

    alert('Materia añadida exitosamente a "Mis materias"!');
  };

  // === LOGICA DE FECHAS DINÁMICAS ===
  const addOtherDate = () => {
    const newDate = {
      id: Date.now(),
      name: '',
      date: '',
    };
    setOtherDates([...otherDates, newDate]);
  };

  const updateOtherDate = (
    id: number,
    field: 'name' | 'date',
    value: string,
  ) => {
    setOtherDates(
      otherDates.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  const removeOtherDate = (id: number) => {
    setOtherDates(otherDates.filter((d) => d.id !== id));
  };

  // === LOGICA DE PLANIFICACIÓN ===

  // Función para calcular días disponibles entre hoy y la fecha del examen
  const calculateAvailableDays = (examDate: string) => {
    const today = new Date();
    const exam = new Date(examDate);
    const days: string[] = [];

    // Empezar desde mañana
    const current = new Date(today);
    current.setDate(current.getDate() + 1);

    while (current <= exam) {
      days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Función para formatear fecha legible
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const removeTopic = (id: number) => {
    setTopics(topics.filter((t) => t.id !== id));
  };

  // Función para generar plan de estudio con IA
  const generateStudyPlan = async () => {
    if (
      !selectedSubjectForPlanning ||
      !selectedEvent ||
      topics.length === 0 ||
      selectedStudyDays.length === 0
    ) {
      alert(
        'Por favor completa todos los campos: materia, evento, temas y días de estudio.',
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
      console.log('🚀 GENERANDO PLAN DE ESTUDIO CON IA');

      // Obtener fecha del evento
      const importantDates = selectedSubject.importantDates || [];
      let examDate = '';
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

      // Crear prompt para el plan de estudio
      const prompt = `
Eres un asistente especializado en crear planes de estudio personalizados.

DATOS DEL ESTUDIANTE:
- Materia: ${selectedSubject.name}
- Evento de estudio: ${selectedEvent.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
- Fecha del examen: ${examDate ? formatDate(examDate) : 'No especificada'}
- Días disponibles para estudiar: ${selectedStudyDays.length} días
- Fechas de estudio: ${selectedStudyDays.map((day) => formatDate(day)).join(', ')}

TEMAS A ESTUDIAR:
${topics.map((topic, topicIndex) => `${topicIndex + 1}. ${topic.name}`).join('\n')}

INSTRUCCIONES:
1. Distribuye los ${topics.length} temas entre los ${selectedStudyDays.length} días disponibles de manera equilibrada
2. Para cada día asignado, especifica qué temas estudiar y proporciona un resumen breve de cada tema
3. Incluye recomendaciones de tiempo de estudio por tema
4. Organiza el plan cronológicamente por fechas

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
          "name": "Nombre del tema",
          "summary": "Resumen breve de qué estudiar en este tema",
          "estimatedTime": "X horas"
        }
      ],
      "totalTime": "X horas",
      "recommendations": "Recomendaciones específicas para este día"
    }
  ],
  "finalRecommendations": "Consejos finales para el examen"
}

IMPORTANTE: 
- Devuelve SOLO el JSON, sin texto adicional, sin markdown, sin explicaciones
- Asegúrate de que el JSON sea válido
- Usa las fechas exactas: ${selectedStudyDays.map((day) => formatDate(day)).join(', ')}
- Distribuye todos los temas entre todos los días disponibles

Genera el JSON del plan de estudio:`;

      console.log('📝 Enviando prompt a Gemini AI...');

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
      console.log('✅ Respuesta recibida de Gemini AI');

      // Procesar respuesta
      let studyPlan = '';
      if (result.raw_response) {
        studyPlan = result.raw_response;
      } else if (typeof result === 'string') {
        studyPlan = result;
      } else if (result.response) {
        studyPlan = result.response;
      } else if (result.summary) {
        // La respuesta viene en el campo summary
        studyPlan = result.summary;
      } else {
        studyPlan = JSON.stringify(result);
      }

      // Limpiar markdown si es necesario
      studyPlan = studyPlan
        .replace(/```markdown/g, '')
        .replace(/```/g, '')
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      setGeneratedStudyPlan(studyPlan);

      // Intentar parsear como JSON estructurado
      let structuredPlan = null;
      try {
        // Si la respuesta comienza con "json\n", extraer solo el JSON
        let jsonContent = studyPlan;
        if (studyPlan.startsWith('json\n')) {
          jsonContent = studyPlan.substring(5).trim();
        }

        // Limpiar posibles caracteres extra antes y después del JSON
        const cleanedPlan = jsonContent
          .replace(/^[^{]*/, '')
          .replace(/[^}]*$/, '');
        const parsedPlan = JSON.parse(cleanedPlan);

        // Agregar campo 'completed' a cada día si no existe
        if (parsedPlan.days && Array.isArray(parsedPlan.days)) {
          parsedPlan.days = parsedPlan.days.map(
            (day: {
              date: string;
              dayNumber: number;
              topics: Array<{
                name: string;
                summary: string;
                estimatedTime: string;
              }>;
              totalTime: string;
              recommendations: string;
            }) => ({
              ...day,
              completed: false,
            }),
          );
          structuredPlan = parsedPlan;
          console.log('✅ JSON parseado correctamente:', structuredPlan);
        }
      } catch (error) {
        console.log(
          '⚠️ No se pudo parsear como JSON, usando formato texto:',
          error,
        );
      }

      // Guardar el plan en la lista de planes de estudio
      const newPlan = {
        id: nextPlanId,
        subjectName: selectedSubject.name,
        eventName: selectedEvent
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        examDate: examDate || '',
        topics: topics.map((t) => t.name),
        studyDays: selectedStudyDays,
        content: studyPlan,
        structuredPlan: structuredPlan,
        progress: 0,
        createdAt: new Date().toISOString(),
        expanded: false,
      };

      setStudyPlans((prevPlans) => [...prevPlans, newPlan]);
      setNextPlanId(nextPlanId + 1);

      console.log('🎉 Plan de estudio generado y guardado exitosamente');
    } catch (error) {
      console.error('❌ Error generando plan de estudio:', error);
      alert('Error generando el plan de estudio. Inténtalo de nuevo.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Funciones para manejar planes de estudio
  const togglePlanExpansion = (planId: number) => {
    setStudyPlans((prevPlans) =>
      prevPlans.map((plan) =>
        plan.id === planId ? { ...plan, expanded: !plan.expanded } : plan,
      ),
    );
  };

  const toggleDayCompletion = (planId: number, dayIndex: number) => {
    setStudyPlans((prevPlans) =>
      prevPlans.map((plan) => {
        if (plan.id === planId && plan.structuredPlan) {
          const updatedDays = plan.structuredPlan.days.map((day, index) =>
            index === dayIndex ? { ...day, completed: !day.completed } : day,
          );

          // Calcular nuevo progreso basado en días completados
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

  const deletePlan = (planId: number) => {
    setStudyPlans((prevPlans) =>
      prevPlans.filter((plan) => plan.id !== planId),
    );
  };

  // === LOGICA DE PDFs ===
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 EVENTO DE CARGA DE PDF DETECTADO');

    if (!e.target.files) {
      console.log('❌ No se seleccionaron archivos');
      return;
    }

    const files = Array.from(e.target.files);
    console.log(`📄 Archivos seleccionados: ${files.length}`);
    files.forEach((file, i) => {
      console.log(
        `   ${i + 1}. ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      );
    });

    if (pdfs.length + files.length > 5) {
      console.log('⚠️ Límite de archivos excedido');
      alert('Máximo 5 PDF');
      return;
    }

    console.log('💾 Guardando PDFs en el estado...');
    const newPdfs = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
    }));
    setPdfs([...pdfs, ...newPdfs]);
    console.log('✅ PDFs guardados en el estado');

    // Procesar el primer PDF con Gemini para extraer temas
    if (files.length > 0 && subjectName.trim()) {
      console.log('🚀 Iniciando procesamiento automático del primer PDF...');
      await processPDFWithGemini(files[0]);
    } else if (!subjectName.trim()) {
      console.log('⚠️ No se puede procesar: falta el nombre de la materia');
    }
  };

  const processPDFWithGemini = async (file: File) => {
    if (!subjectName.trim()) {
      console.log('⚠️ ADVERTENCIA: No se ingresó nombre de materia');
      alert('Por favor ingresa el nombre de la materia antes de subir el PDF');
      return;
    }

    console.log('🎯 INICIANDO PROCESAMIENTO EN DASHBOARD');
    console.log(`📋 Materia seleccionada: "${subjectName}"`);
    console.log(`📄 Archivo a procesar: ${file.name}`);

    setProcessingPDF(true);
    try {
      console.log('🔄 Llamando a PDFProcessor.processPDFWithGemini...');
      const result = await PDFProcessor.processPDFWithGemini(file, subjectName);

      console.log('📥 RESULTADO RECIBIDO DEL PROCESADOR:');
      console.log('✨ Éxito:', result.success);
      console.log('📊 Número de temas:', result.topics?.length || 0);
      console.log('📝 Resumen:', result.summary);
      if (result.error) console.log('❌ Error:', result.error);

      if (result.success) {
        console.log('🎉 PROCESAMIENTO EXITOSO - GUARDANDO TEMAS EN ESTADO');
        setExtractedTopics(result.topics);

        console.log('📚 TEMAS GUARDADOS EN EL ESTADO:');
        result.topics.forEach((topic, index) => {
          console.log(
            `   ${index + 1}. ID: ${topic.id} | Nombre: "${topic.name}"`,
          );
          if (topic.description) {
            console.log(`      📝 Descripción: "${topic.description}"`);
          }
        });

        console.log(
          '✅ Los temas ahora están disponibles en la sección de Planificación',
        );
        alert(
          `¡Éxito! Se extrajeron ${result.topics.length} temas del PDF. Puedes verlos en la sección de Planificación.`,
        );
      } else {
        console.error('❌ PROCESAMIENTO FALLÓ');
        console.error('🔍 Detalles del error:', result.error);
        alert(`Error procesando PDF: ${result.error}`);
      }
    } catch (error) {
      console.error('💥 EXCEPCIÓN EN PROCESAMIENTO:');
      console.error('🔍 Tipo de error:', typeof error);
      console.error(
        '📄 Mensaje:',
        error instanceof Error ? error.message : String(error),
      );
      console.error(
        '🔗 Stack trace:',
        error instanceof Error ? error.stack : 'No disponible',
      );
      alert('Error procesando el PDF. Inténtalo de nuevo.');
    } finally {
      console.log('🏁 FINALIZANDO PROCESAMIENTO - Cambiando estado de carga');
      setProcessingPDF(false);
    }
  };

  const removePdf = (id: number) => {
    setPdfs(pdfs.filter((p) => p.id !== id));
  };

  // === LOGICA DEL CALENDARIO ===
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const changeMonth = (dir: number) => {
    let m = currentMonth + dir,
      y = currentYear;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const renderDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDay = firstDay.getDay();
    if (startDay === 0) startDay = 6;
    else startDay--;

    const today = new Date();
    const days: JSX.Element[] = [];

    for (let i = 0; i < startDay; i++)
      days.push(<div key={'e' + i} className="calendar-cell"></div>);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = events.filter((e) => e.date === dateStr);
      days.push(
        <div
          key={d}
          className={`calendar-cell ${today.getDate() === d && today.getMonth() === currentMonth ? 'today' : ''}`}
        >
          <div className="day-number">{d}</div>
          {dayEvents.map((ev) => (
            <div
              key={ev.id}
              className={`event event-${ev.type}`}
              style={{ backgroundColor: ev.color }}
            >
              {ev.title}
            </div>
          ))}
        </div>,
      );
    }
    return days;
  };

  // === LOGICA DE ASISTENTE ===
  const askAI = () => {
    if (!question) return;
    setAnswers([
      ...answers,
      `Pregunta: ${question}`,
      'Respuesta IA: repasa cada 3 días 🚀',
    ]);
    setQuestion('');
  };

  return (
    <div className="container">
      {/* HEADER */}
      <header>
        <div className="logo">
          <div className="logo-icon">
            <img
              src="/logo.png"
              alt="FocuseAR Icon"
              className="w-[110px] h-[110px] object-cover rounded-full"
            />
          </div>
          <div className="logo-text">
            <img src="Texto.png" alt="FocuseAR" className="focusear-title" />
            <h2>Planificación Automatizada con IA</h2>
          </div>
        </div>
        <div className="user-info">
          <div className="user-avatar">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #4285F4',
                }}
              />
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#4285F4',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  border: '2px solid #4285F4',
                }}
              >
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div
            style={{
              marginLeft: '12px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {user?.displayName ? (
              <>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '1.2',
                  }}
                >
                  {user.displayName.split(' ')[0]}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    lineHeight: '1.2',
                    color: '#666',
                  }}
                >
                  {user.displayName.split(' ').slice(1).join(' ')}
                </span>
              </>
            ) : (
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                {user?.email || 'Usuario'}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="content">
        {/* PANEL IZQUIERDO */}
        <div className="left-panel">
          <div className="panel">
            <h2>
              <i className="fas fa-book"></i> Nueva Materia
            </h2>

            <div className="form-group">
              <label>Nombre</label>
              <input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </div>

            {/* Fechas siempre visibles */}
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
                  <input
                    type="date"
                    value={firstPartialDate}
                    onChange={(e) => setFirstPartialDate(e.target.value)}
                  />
                </div>

                {otherDates.map((otherDate) => (
                  <div
                    key={otherDate.id}
                    className="form-group"
                    style={{ display: 'flex', gap: '10px', alignItems: 'end' }}
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
                      <input
                        type="date"
                        value={otherDate.date}
                        onChange={(e) =>
                          updateOtherDate(otherDate.id, 'date', e.target.value)
                        }
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
              <div className="color-options">
                {['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#9b59b6'].map(
                  (c) => (
                    <div
                      key={c}
                      className={`color-option ${selectedColor === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setSelectedColor(c)}
                    />
                  ),
                )}
              </div>
            </div>

            {/* PDFs */}
            <div className="pdf-section">
              <h3>
                <i className="fas fa-file-pdf"></i> Programa de la materia (PDF)
              </h3>
              <div
                className={`upload-area${dragActive ? ' dragover' : ''}`}
                onClick={() => {
                  if (!processingPDF) {
                    document.getElementById('pdf-upload')?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!processingPDF) {
                    setDragActive(true);
                  }
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (processingPDF) return;

                  const files = Array.from(e.dataTransfer.files).filter(
                    (f) => f.type === 'application/pdf',
                  );
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

                  // Procesar con Gemini
                  if (files.length > 0 && subjectName.trim()) {
                    await processPDFWithGemini(files[0]);
                  }
                }}
                style={{
                  cursor: processingPDF ? 'wait' : 'pointer',
                  opacity: processingPDF ? 0.7 : 1,
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
                      color: processingPDF ? '#f59e0b' : '#4285F4',
                      fontWeight: '500',
                      fontSize: '15px',
                      textAlign: 'center',
                    }}
                  >
                    {processingPDF
                      ? '🤖 Procesando PDF con IA...'
                      : 'Haz click o arrastra el contenido de la materia'}
                  </span>
                </div>
              </div>
              <div className="pdf-list">
                {pdfs.length === 0 ? (
                  <p>No hay PDFs</p>
                ) : (
                  pdfs.map((p) => (
                    <div key={p.id} className="pdf-item">
                      <span>
                        {p.name} ({p.size})
                      </span>
                      <button onClick={() => removePdf(p.id)}>X</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              className="planify-btn"
              onClick={handlePlanify}
              disabled={dbLoading}
            >
              {dbLoading ? (
                <span>⏳ Guardando en Firestore...</span>
              ) : (
                <span>
                  <i className="fas fa-upload"></i> Cargar materia
                </span>
              )}
            </button>

            {/* Mostrar errores de base de datos */}
            {processingPDF && (
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
                  📊 Revisa la consola del navegador para ver el progreso
                  detallado
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

            {/* Mostrar estado de conexión */}
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

            {/* Debug info para temas extraídos */}
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
                    <div key={topic.id} style={{ marginBottom: '2px' }}>
                      {i + 1}. {topic.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lista de materias */}
          <div className="panel">
            <h2>
              <i className="fas fa-list"></i> Mis Materias
            </h2>
            {subjects.length === 0 ? (
              <p>No hay materias</p>
            ) : (
              subjects.map((s) => (
                <div key={s.id}>
                  {s.name} ({s.examDate})
                </div>
              ))
            )}
          </div>

          {/* Nueva sección de Planificación */}
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
                        value={selectedEvent}
                        onChange={(e) => {
                          setSelectedEvent(e.target.value);
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
                        {/* Mostrar temas extraídos por IA */}
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
                                    key={extractedTopic.id}
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
                                            id: Date.now(),
                                            name: extractedTopic.name,
                                          };
                                          setTopics([...topics, newTopic]);
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
                                      {isAlreadyAdded
                                        ? '✓ Agregado'
                                        : '+ Agregar'}
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
                                  .map((extractedTopic) => ({
                                    id: Date.now() + Math.random(),
                                    name: extractedTopic.name,
                                  }));

                                setTopics([...topics, ...newTopics]);
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

                        {/* Selección de días de estudio disponibles */}
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
                            📅 Selecciona los días que tienes disponibles para
                            estudiar
                          </label>
                          {(() => {
                            // Obtener la materia seleccionada y sus fechas
                            const selectedSubject = subjects.find(
                              (s) => s.id === selectedSubjectForPlanning,
                            );
                            if (!selectedSubject) {
                              return (
                                <p
                                  style={{ color: '#ef4444', fontSize: '14px' }}
                                >
                                  ⚠️ No se encontró la materia seleccionada.
                                </p>
                              );
                            }

                            // Calcular días disponibles basado en la fecha del evento seleccionado
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
                                  No se encontró la fecha del {eventName} para
                                  esta materia. Asegúrate de haber configurado
                                  esta fecha cuando creaste la materia.
                                </p>
                              );
                            }

                            const availableDays =
                              calculateAvailableDays(examDate);

                            if (availableDays.length === 0) {
                              return (
                                <p
                                  style={{ color: '#ef4444', fontSize: '14px' }}
                                >
                                  ⚠️ La fecha del examen ya pasó o es hoy. No
                                  hay días disponibles para estudiar.
                                </p>
                              );
                            }

                            return (
                              <div>
                                <p
                                  style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    marginBottom: '10px',
                                  }}
                                >
                                  Tienes {availableDays.length} días disponibles
                                  hasta el {formatDate(examDate)}
                                </p>
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
                                  {availableDays.map((day) => (
                                    <div
                                      key={day}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px',
                                        cursor: 'pointer',
                                        borderRadius: '6px',
                                        marginBottom: '6px',
                                        backgroundColor:
                                          selectedStudyDays.includes(day)
                                            ? '#dbeafe'
                                            : 'white',
                                        border: selectedStudyDays.includes(day)
                                          ? '2px solid #3b82f6'
                                          : '1px solid #e5e7eb',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!selectedStudyDays.includes(day)) {
                                          e.currentTarget.style.backgroundColor =
                                            '#f8fafc';
                                          e.currentTarget.style.borderColor =
                                            '#cbd5e1';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!selectedStudyDays.includes(day)) {
                                          e.currentTarget.style.backgroundColor =
                                            'white';
                                          e.currentTarget.style.borderColor =
                                            '#e5e7eb';
                                        }
                                      }}
                                      onClick={() => {
                                        if (selectedStudyDays.includes(day)) {
                                          setSelectedStudyDays(
                                            selectedStudyDays.filter(
                                              (d) => d !== day,
                                            ),
                                          );
                                        } else {
                                          setSelectedStudyDays([
                                            ...selectedStudyDays,
                                            day,
                                          ]);
                                        }
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedStudyDays.includes(
                                          day,
                                        )}
                                        onChange={() => {}} // Manejado por el onClick del div
                                        style={{
                                          marginRight: '12px',
                                          width: '16px',
                                          height: '16px',
                                          cursor: 'pointer',
                                        }}
                                      />
                                      <span
                                        style={{
                                          fontSize: '14px',
                                          fontWeight: '500',
                                          color: selectedStudyDays.includes(day)
                                            ? '#1e40af'
                                            : '#374151',
                                          flex: 1,
                                        }}
                                      >
                                        {formatDate(day)}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {selectedStudyDays.length > 0 && (
                                  <div
                                    style={{
                                      marginTop: '10px',
                                      padding: '10px',
                                      backgroundColor: '#ecfdf5',
                                      border: '1px solid #bbf7d0',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                    }}
                                  >
                                    <strong>
                                      ✅ Días seleccionados para estudiar:{' '}
                                      {selectedStudyDays.length}
                                    </strong>
                                    <div
                                      style={{
                                        fontSize: '12px',
                                        marginTop: '5px',
                                        color: '#047857',
                                      }}
                                    >
                                      Esto te dará aproximadamente{' '}
                                      {Math.floor(
                                        selectedStudyDays.length /
                                          (topics.length || 1),
                                      )}{' '}
                                      días por tema
                                    </div>
                                  </div>
                                )}

                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '10px',
                                    marginTop: '10px',
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      setSelectedStudyDays(availableDays)
                                    }
                                    style={{
                                      backgroundColor: '#3b82f6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '6px 12px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                    }}
                                  >
                                    Seleccionar todos
                                  </button>
                                  <button
                                    onClick={() => setSelectedStudyDays([])}
                                    style={{
                                      backgroundColor: '#6b7280',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '6px 12px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                    }}
                                  >
                                    Limpiar selección
                                  </button>
                                </div>
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
                            <div
                              style={{ maxHeight: '150px', overflowY: 'auto' }}
                            >
                              {topics.map((topic) => (
                                <div
                                  key={topic.id}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px',
                                    backgroundColor: '#f3f4f6',
                                    borderRadius: '4px',
                                    marginBottom: '5px',
                                  }}
                                >
                                  <span>{topic.name}</span>
                                  <button
                                    onClick={() => {
                                      console.log(
                                        `🗑️ ELIMINANDO tema: "${topic.name}"`,
                                      );
                                      removeTopic(topic.id);
                                      console.log(
                                        '✅ Tema eliminado de la lista',
                                      );
                                    }}
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

                        {/* Botón para generar plan de estudio */}
                        {topics.length > 0 && selectedStudyDays.length > 0 && (
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
                                cursor: generatingPlan
                                  ? 'not-allowed'
                                  : 'pointer',
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
                                  e.currentTarget.style.backgroundColor =
                                    '#059669';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!generatingPlan) {
                                  e.currentTarget.style.backgroundColor =
                                    '#10b981';
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

                        {/* Mostrar plan de estudio generado */}
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

          {/* Sección de Planes de Estudio */}
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
                  Crea uno desde la sección "Planificar" seleccionando temas y
                  días de estudio.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {studyPlans.map((plan) => (
                  <div
                    key={plan.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Header de la tarjeta */}
                    <div
                      style={{
                        padding: '20px',
                        cursor: 'pointer',
                        borderBottom: plan.expanded
                          ? '1px solid #e5e7eb'
                          : 'none',
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
                              fontSize: '18px',
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
                              deletePlan(plan.id);
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

                      {/* Barra de progreso */}
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
                              <span
                                style={{ color: '#6b7280', marginLeft: '4px' }}
                              >
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
                            height: '8px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${plan.progress}%`,
                              height: '100%',
                              backgroundColor:
                                plan.progress === 100 ? '#10b981' : '#3b82f6',
                              borderRadius: '4px',
                              transition: 'all 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contenido expandible - Sub-tarjetas de días */}
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

                            {/* Resumen del plan */}
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

                            {/* Sub-tarjetas de días */}
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
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  {/* Header del día */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
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
                                          margin: 0,
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
                                        <span>
                                          {day.completed ? '✅' : '📅'}
                                        </span>
                                        Día {day.dayNumber} -{' '}
                                        {formatDate(day.date)}
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

                                  {/* Temas del día */}
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

                                  {/* Recomendaciones del día */}
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

                            {/* Recomendaciones finales */}
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
                                <strong>
                                  🎯 Consejos finales para el examen:
                                </strong>
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
                          /* Fallback para planes sin estructura JSON */
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

          {/* Probador de Base de Datos */}
          <div className="panel">
            <DatabaseTester />
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="right-panel">
          <div className="panel">
            <h2>
              <i className="fas fa-calendar-alt"></i> Calendario
            </h2>
            <div className="calendar-header">
              <button onClick={() => changeMonth(-1)}>{'<'}</button>
              <h3>
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <button onClick={() => changeMonth(1)}>{'>'}</button>
            </div>
            <div className="calendar-grid">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                <div key={d} className="weekday-header">
                  {d}
                </div>
              ))}
              {renderDays()}
            </div>
          </div>

          {/* Asistente */}
          <div className="panel">
            <h2>
              <i className="fas fa-robot"></i> Asistente IA
            </h2>
            <div className="analysis-content">
              {answers.map((a, i) => (
                <p key={i}>{a}</p>
              ))}
            </div>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Pregunta algo..."
            />
            <button onClick={askAI}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
