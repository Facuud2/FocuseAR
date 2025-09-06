import React, {
  useState,
  useContext,
  useCallback,
  type JSX,
  useEffect,
} from 'react';
import { useDatabase } from './hooks/useDatabase';
import { AuthContext } from './context/authContext';
import SelectorDeColor from './SelectorDeColor';
import './App.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  const [examDate, setExamDate] = useState<Date | null>(new Date());
  const [selectedColor, setSelectedColor] = useState('#4285F4');
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dragActive, setDragActive] = useState(false);

  // Wrap handlePdfUpload in useCallback to prevent unnecessary re-renders
  const handlePdfUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const files = Array.from(e.target.files);
      if (pdfs.length + files.length > 5) {
        alert('Máximo 5 archivos PDF permitidos');
        return;
      }
      const newPdfs = files.map((file) => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      }));
      setPdfs((prevPdfs) => [...prevPdfs, ...newPdfs]);
    },
    [pdfs.length],
  );

  // Wrap generateEvents in useCallback to prevent unnecessary re-renders
  const generateEvents = useCallback((subject: Subject) => {
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

    setEvents((prevEvents) => [...prevEvents, ...newEvents]);
  }, []);

  // Add cleanup for any potential subscriptions or timeouts
  useEffect(() => {
    return () => {
      // Cleanup function
    };
  }, []);

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
          title: `Plan de estudio: ${subjectName}`,
          durationDays: Math.min(daysUntilExam, 10),
          dailyTasks,
        });
      }

      // Crear materia local
      const newSubject: Subject = {
        id: Date.now(),
        name: subjectName,
        examDate: examDate.toISOString().split('T')[0],
        color: selectedColor,
        pdfs,
      };

      setSubjects([...subjects, newSubject]);
      generateEvents(newSubject);

      setSubjectName('');
      setExamDate(new Date());
      setPdfs([]);

      alert('Materia creada exitosamente con plan de estudio en Firestore!');
    } catch (error) {
      console.error('Error al crear materia:', error);
      alert('Error al crear la materia. Revisa la consola para más detalles.');
    }
  };

  // === LOGICA DE PDFs ===
  // const removePdf = (id: number) => {
  //   setPdfs(pdfs.filter((p) => p.id !== id));
  // };

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
    // El div raíz del Dashboard ahora toma el 100% del ancho y alto de su contenedor padre
    // para que el layout en App.tsx lo posicione correctamente.
    // La clase 'dormir' se mantiene si tiene estilos específicos que no entran en conflicto.
    <div className="dormir h-full w-full p-4 md:p-8">
      {' '}
      {/* Añadido padding aquí, o puedes mantenerlo en App.tsx */}
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
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Examen
              </label>
              <DatePicker
                selected={examDate}
                onChange={(date: Date | null) => setExamDate(date)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         disabled:bg-gray-100 disabled:cursor-not-allowed"
                dateFormat="dd/MM/yyyy"
                locale="es"
                placeholderText="Seleccionar fecha de examen"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                isClearable
                minDate={new Date()}
                todayButton="Hoy"
                popperPlacement="bottom-start"
              />
            </div>
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

                {/* Sexto botón: selector de color */}
                <div style={{ position: 'relative' }}>
                  <SelectorDeColor
                    color={selectedColor}
                    onChange={setSelectedColor}
                  />
                  {/* Overlay para indicar que se puede clickear */}
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
                      pointerEvents: 'none', // para que el click llegue al SelectorDeColor
                    }}
                    title="Elegir color"
                  >
                    ...
                  </div>
                </div>
              </div>
            </div>

            {/* PDFs */}
            <div className="pdf-section mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-file-pdf mr-2"></i>
                Subida de PDF (Programa o cronograma de la asignatura)
              </h3>

              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
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
                    alert('Máximo 5 archivos PDF permitidos');
                    return;
                  }
                  const newPdfs = files.map((file) => ({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                  }));
                  setPdfs([...pdfs, ...newPdfs]);
                }}
              >
                <div className="flex flex-col items-center justify-center py-4">
                  <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                  <p className="text-sm text-gray-600">
                    Arrastra y suelta archivos PDF aquí o haz clic para
                    seleccionar
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tamaño máximo por archivo: 10MB
                  </p>
                </div>
              </div>
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                multiple
                onChange={handlePdfUpload}
                className="hidden"
              />

              {/* Lista de PDFs seleccionados */}
              {pdfs.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Archivos seleccionados:
                  </p>
                  <div className="space-y-2">
                    {pdfs.map((pdf) => (
                      <div
                        key={pdf.id}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                      >
                        <div className="flex items-center">
                          <i className="fas fa-file-pdf text-red-500 mr-2"></i>
                          <span className="text-sm text-gray-700 truncate max-w-xs">
                            {pdf.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {pdf.size}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setPdfs(pdfs.filter((p) => p.id !== pdf.id))
                          }
                          className="text-gray-400 hover:text-red-500"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* Lista de materias MEJORADA */}
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
                {subjects.map((subject) => {
                  // Generar ícono basado en la inicial de la materia
                  const initial = subject.name.charAt(0).toUpperCase();
                  return (
                    <div
                      key={subject.id}
                      className="subject-card"
                      style={{ borderLeft: `4px solid ${subject.color}` }}
                    >
                      <div className="subject-header">
                        <div
                          className="subject-icon"
                          style={{ backgroundColor: subject.color }}
                        >
                          <span className="subject-initial">{initial}</span>
                        </div>
                        <div className="subject-info">
                          <h3 className="subject-name">{subject.name}</h3>
                          <p className="subject-date">
                            <i className="fas fa-calendar-alt"></i>
                            {new Date(subject.examDate).toLocaleDateString(
                              'es-ES',
                            )}
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
