import React, {
  useState,
  useContext,
  useCallback,
  type JSX,
  useEffect,
} from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { AuthContext } from '../hooks/authContext';
import SelectorDeColor from './SelectorDeColor';
import './Dashboard.css';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';

registerLocale('es', es);

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

  useEffect(() => {
    return () => {
      // Cleanup function
    };
  }, []);

  const handlePlanify = async () => {
    if (!subjectName || !examDate || pdfs.length === 0) {
      // Usar un modal en lugar de alert
      console.log('Completa todos los campos');
      return;
    }

    if (!user) {
      console.log('Debes estar autenticado para crear materias');
      return;
    }

    try {
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
          materialId: materialIds[0],
          title: `Plan de estudio: ${subjectName}`,
          durationDays: Math.min(daysUntilExam, 10),
          dailyTasks,
        });
      }

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

      // Usar un modal en lugar de alert
      console.log(
        'Materia creada exitosamente con plan de estudio en Firestore!',
      );
    } catch (error) {
      console.error('Error al crear materia:', error);
      // Usar un modal en lugar de alert
      console.log(
        'Error al crear la materia. Revisa la consola para más detalles.',
      );
    }
  };

  const removePdf = (id: number) => {
    setPdfs(pdfs.filter((p) => p.id !== id));
  };

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

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={'e' + i} className="calendar-cell"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = events.filter((e) => e.date === dateStr);
      days.push(
        <div
          key={d}
          className={`calendar-cell ${today.getDate() === d && today.getMonth() === currentMonth && today.getFullYear() === currentYear ? 'today' : ''}`}
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
    <div className="dormir">
      <header>
        <div className="logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="FocuseAR Icon" />
          </div>
          <div className="logo-text">
            <img src="Texto.png" alt="FocuseAR" className="focusear-title" />
            <h2>Planificación Automatizada con IA</h2>
          </div>
        </div>
        <div className="user-info">
          <div className="user-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" />
            ) : (
              <div>
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
            <span className="online-dot"></span>
          </div>
          <div className="user-details">
            {user?.displayName ? (
              <>
                <span className="user-name">
                  {user.displayName.split(' ')[0]}
                </span>
                <span className="user-lastname">
                  {user.displayName.split(' ').slice(1).join(' ')}
                </span>
              </>
            ) : (
              <span className="user-email">{user?.email || 'Usuario'}</span>
            )}
          </div>
        </div>
      </header>
      <div className="content">
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
            </div>
            <div className="form-group">
              <label>Fecha de Examen</label>
              <DatePicker
                selected={examDate}
                onChange={(date: Date | null) => setExamDate(date)}
                dateFormat="dd/MM/yyyy"
                locale="es"
                placeholderText="Seleccionar fecha de examen"
                minDate={new Date()}
                className="date-picker-input"
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
                <div className="color-option-picker">
                  <SelectorDeColor
                    color={selectedColor}
                    onChange={setSelectedColor}
                  />
                </div>
              </div>
            </div>
            <div className="pdf-section">
              <h3 className="pdf-title">
                <i className="fas fa-file-pdf"></i> Subida de PDF
              </h3>
              <div
                className={`drag-drop-area ${dragActive ? 'drag-active' : ''}`}
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
                    // Usar un modal en lugar de alert
                    console.log('Máximo 5 archivos PDF permitidos');
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
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Arrastra y suelta PDF aquí o haz clic para seleccionar</p>
                <small>Máximo 5 archivos, 10MB c/u</small>
              </div>
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                multiple
                onChange={handlePdfUpload}
                className="hidden"
              />
              {pdfs.length > 0 && (
                <div className="pdf-list">
                  <p>Archivos seleccionados:</p>
                  {pdfs.map((pdf) => (
                    <div key={pdf.id} className="pdf-item">
                      <div className="pdf-info">
                        <i className="fas fa-file-pdf"></i>
                        <span className="pdf-name">{pdf.name}</span>
                        <span className="pdf-size">({pdf.size})</span>
                      </div>
                      <button
                        onClick={() => removePdf(pdf.id)}
                        className="remove-pdf-btn"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                  <i className="fas fa-robot"></i> Planificar
                </span>
              )}
            </button>
            {dbError && (
              <div className="alert-error">
                <strong>❌ Error en base de datos:</strong> {dbError}
              </div>
            )}
            {user && (
              <div className="alert-success">
                <strong>✅ Conectado como:</strong> {user.email}
              </div>
            )}
          </div>
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
                  const initial = subject.name.charAt(0).toUpperCase();
                  return (
                    <div key={subject.id} className="subject-card">
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
          <div className="panel">
            <h2>
              <i className="fas fa-robot"></i> Asistente IA
            </h2>
            <div className="analysis-content">
              {answers.map((a, i) => (
                <p key={i}>{a}</p>
              ))}
            </div>
            <div className="ai-input-group">
              <input
                type="text"
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
    </div>
  );
};

export default Dashboard;
