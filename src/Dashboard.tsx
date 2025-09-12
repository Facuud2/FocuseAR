import React, { useState, type JSX /* useEffect */ } from 'react';
import DatabaseTester from './components/DatabaseTester';
import ChatExample from './components/ChatExample';
import ChatHistoryExample from './components/ChatHistoryExample';
import CompleteChat from './components/CompleteChat';
import TypingIndicatorExample from './components/TypingIndicatorExample';
import { useDatabase } from './hooks/useDatabase';
import { useContext } from 'react';
import { AuthContext } from './hooks/authContext';
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

const Dashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const {
    createMaterial,
    createStudyPlan,
    loading: dbLoading,
    error: dbError,
  } = useDatabase();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4285F4');
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dragActive, setDragActive] = React.useState(false);
  
  // Estados para análisis de IA
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [extractedTopics, setExtractedTopics] = useState<any[]>([]);

  // === FUNCIONES DE PROCESAMIENTO DE PDF ===
  
  // Simula la extracción de texto de un PDF
  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Contenido simulado del PDF "${file.name}":
        
Tema 1: Introducción a la materia
Tema 2: Conceptos fundamentales  
Tema 3: Aplicaciones prácticas
Tema 4: Ejercicios y problemas
Tema 5: Evaluación final

Este es un texto de prueba que simula el contenido extraído de un PDF.
La IA analizará este contenido para generar un plan de estudio personalizado.`);
      }, 1000);
    });
  };

  // Simula el procesamiento con IA
  const processPDFTextWithAI = async (text: string, subjectName: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`Procesando ${text.length} caracteres para ${subjectName}`);
    
    return {
      topics: [
        { id: 'tema_1', name: 'Introducción a la materia', description: 'Conceptos básicos', order: 1 },
        { id: 'tema_2', name: 'Conceptos fundamentales', description: 'Principios teóricos', order: 2 },
        { id: 'tema_3', name: 'Aplicaciones prácticas', description: 'Casos de uso reales', order: 3 },
        { id: 'tema_4', name: 'Ejercicios y problemas', description: 'Práctica', order: 4 },
        { id: 'tema_5', name: 'Evaluación final', description: 'Preparación exámenes', order: 5 }
      ],
      summary: `Se han identificado 5 temas principales en el material de ${subjectName}.`,
      success: true
    };
  };

  // === FUNCIÓN DE ANÁLISIS DE IA ===
  const analyzePDFWithAI = async (file: File) => {
    if (!subjectName.trim()) {
      setAnalysisError('Por favor, ingresa el nombre de la materia antes de analizar el PDF');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisComplete(false);

    try {
      console.log('📄 Iniciando análisis de PDF:', file.name);
      
      // 1. Extraer texto del PDF
      const text = await extractTextFromPDF(file);
      console.log('✅ Texto extraído del PDF');
      
      // 2. Procesar texto con IA
      const result = await processPDFTextWithAI(text, subjectName);
      
      if (result.success) {
        setExtractedTopics(result.topics);
        setAnalysisComplete(true);
        console.log('🎉 Análisis completado:', result.topics.length, 'temas encontrados');
      } else {
        setAnalysisError('Error procesando el PDF');
      }
      
    } catch (error) {
      console.error('❌ Error en análisis:', error);
      setAnalysisError('Error analizando el PDF. Inténtalo de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Función para resetear el análisis cuando se cambian los PDFs
  const resetAnalysis = () => {
    setAnalysisComplete(false);
    setAnalysisError(null);
    setExtractedTopics([]);
  };

  // === LOGICA DE MATERIAS Y PLANIFICACIÓN ===
  const handlePlanify = async () => {
    if (!subjectName || !examDate || pdfs.length === 0) {
      alert('Completa todos los campos');
      return;
    }

    if (!user) {
      alert('Debes estar autenticado para crear materias');
      return;
    }

    try {
      // Crear materiales en Firestore
      const materialIds: string[] = [];
      for (const pdf of pdfs) {
        const materialId = await createMaterial({
          fileName: pdf.name,
          storagePath: `users/${user.uid}/materials/${pdf.name}`,
          fileType: 'pdf',
        });
        if (materialId) {
          materialIds.push(materialId);
        }
      }

      // Crear plan de estudio en Firestore
      if (materialIds.length > 0) {
        const examDateObj = new Date(examDate);
        const today = new Date();
        const daysUntilExam = Math.ceil(
          (examDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24),
        );

        const dailyTasks = [];
        for (let day = 1; day <= Math.min(daysUntilExam, 10); day++) {
          dailyTasks.push({
            day,
            task: `Estudiar ${subjectName} - Día ${day}`,
          });
        }

        await createStudyPlan({
          materialId: materialIds[0], // Usar el primer material
          generatedPlan: {
            title: `Plan de estudio: ${subjectName}`,
            durationDays: Math.min(daysUntilExam, 10),
            dailyTasks,
          },
        });
      }

      // Crear materia local
      const newSubject: Subject = {
        id: Date.now(),
        name: subjectName,
        examDate,
        color: selectedColor,
        pdfs,
      };

      setSubjects([...subjects, newSubject]);
      generateEvents(newSubject);

      setSubjectName('');
      setExamDate('');
      setPdfs([]);

      alert('Materia creada exitosamente con plan de estudio en Firestore!');
    } catch (error) {
      console.error('Error al crear materia:', error);
      alert('Error al crear la materia. Revisa la consola para más detalles.');
    }
  };

  const generateEvents = (subject: Subject) => {
    const examDate = new Date(subject.examDate);
    const today = new Date();
    const daysUntilExam = Math.ceil(
      (examDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
    );

    const newEvents: Event[] = [];

    // Examen
    newEvents.push({
      id: Date.now(),
      subjectId: subject.id,
      subject: subject.name,
      type: 'exam',
      date: subject.examDate,
      title: `Examen: ${subject.name}`,
      color: subject.color,
    });

    // Estudio
    const studySessions = Math.min((daysUntilExam * 3) / 7, 15);
    for (let i = 1; i <= studySessions; i++) {
      const studyDate = new Date(today);
      studyDate.setDate(
        today.getDate() + Math.floor((i * daysUntilExam) / (studySessions + 1)),
      );
      newEvents.push({
        id: Date.now() + i,
        subjectId: subject.id,
        subject: subject.name,
        type: 'study',
        date: studyDate.toISOString().split('T')[0],
        title: `Estudio: ${subject.name}`,
        color: subject.color,
      });
    }

    // Repaso
    if (daysUntilExam > 7) {
      const reviewDate = new Date(examDate);
      reviewDate.setDate(reviewDate.getDate() - 2);
      newEvents.push({
        id: Date.now() + 999,
        subjectId: subject.id,
        subject: subject.name,
        type: 'task',
        date: reviewDate.toISOString().split('T')[0],
        title: `Repaso: ${subject.name}`,
        color: subject.color,
      });
    }

    setEvents((prev) => [...prev, ...newEvents]);
  };

  // === LOGICA DE PDFs ===
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (pdfs.length + files.length > 5) {
      alert('Máximo 5 PDF');
      return;
    }

    // Resetear estado de análisis anterior
    resetAnalysis();

    const newPdfs = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
    }));
    setPdfs([...pdfs, ...newPdfs]);

    // Analizar automáticamente el primer PDF subido con IA
    if (files.length > 0) {
      await analyzePDFWithAI(files[0]);
    }
  };

  const removePdf = (id: number) => {
    setPdfs(pdfs.filter((p) => p.id !== id));
    // Si se elimina un PDF, resetear el análisis
    resetAnalysis();
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
          <div className="user-avatar">A</div>
          <span>usuario@ejemplo.com</span>
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
            <div className="form-group">
              <label>Fecha de Examen</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
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
                <i className="fas fa-file-pdf"></i> Material (PDF)
              </h3>
              <div
                className={`upload-area${dragActive ? ' dragover' : ''}`}
                onClick={() => document.getElementById('pdf-upload')?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
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
                }}
                style={{ cursor: 'pointer' }}
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
                      color: '#4285F4',
                      fontWeight: '500',
                      fontSize: '15px',
                      textAlign: 'center',
                    }}
                  >
                    Haz click o arrastra el contenido de la materia
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

            {/* === SECCIÓN DE ANÁLISIS DE IA === */}
            {pdfs.length > 0 && (
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '2px solid',
                borderColor: isAnalyzing ? '#F59E0B' : analysisComplete ? '#10B981' : analysisError ? '#EF4444' : '#E5E7EB',
                backgroundColor: isAnalyzing ? '#FEF3C7' : analysisComplete ? '#D1FAE5' : analysisError ? '#FEE2E2' : '#F9FAFB'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px', marginRight: '8px' }}>
                    {isAnalyzing ? '🤖' : analysisComplete ? '✅' : analysisError ? '❌' : '⏳'}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    Análisis de IA
                  </h3>
                </div>
                
                {isAnalyzing && (
                  <p style={{ margin: 0, color: '#92400E' }}>
                    Analizando el contenido del PDF con inteligencia artificial...
                  </p>
                )}
                
                {analysisComplete && (
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#065F46' }}>
                      ¡Análisis completado! Se identificaron {extractedTopics.length} temas.
                    </p>
                    <details style={{ color: '#065F46' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: '500' }}>
                        Ver temas encontrados
                      </summary>
                      <ul style={{ margin: '8px 0 0 16px' }}>
                        {extractedTopics.map((topic, index) => (
                          <li key={topic.id || index} style={{ marginBottom: '4px' }}>
                            {topic.name}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
                
                {analysisError && (
                  <p style={{ margin: 0, color: '#991B1B' }}>
                    Error: {analysisError}
                  </p>
                )}
                
                {!isAnalyzing && !analysisComplete && !analysisError && (
                  <p style={{ margin: 0, color: '#6B7280' }}>
                    El PDF será analizado automáticamente cuando subas el archivo.
                  </p>
                )}
              </div>
            )}

            <button
              className="planify-btn"
              onClick={handlePlanify}
              disabled={dbLoading || isAnalyzing || (pdfs.length > 0 && !analysisComplete)}
            >
              {dbLoading ? (
                <span>⏳ Guardando en Firestore...</span>
              ) : isAnalyzing ? (
                <span>🤖 Analizando PDF con IA...</span>
              ) : pdfs.length > 0 && !analysisComplete ? (
                <span>⚠️ Esperando análisis de IA</span>
              ) : (
                <span>
                  <i className="fas fa-robot"></i> Planificar
                </span>
              )}
            </button>

            {/* Mostrar errores de base de datos */}
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

          {/* Ejemplo de Chat Component */}
          <div className="panel">
            <ChatExample />
          </div>

          {/* Ejemplo de Chat History */}
          <div className="panel">
            <ChatHistoryExample />
          </div>

          {/* Chat Completo con Formulario de Envío */}
          <div className="panel">
            <CompleteChat />
          </div>

          {/* Ejemplo de Indicadores de Escritura */}
          <div className="panel">
            <TypingIndicatorExample />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
