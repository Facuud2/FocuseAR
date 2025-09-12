import React, { useState, useEffect, type JSX } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { useContext } from 'react';
import { AuthContext } from '../hooks/authContext';
import StudyPlanFilter from './StudyPlanFilter';
import './Dashboard.css';

// Interface and types for data remain the same
export type StudyPlanDay = {
  date: string;
  dayNumber: number;
  topics: {
    name: string;
    summary: string;
    estimatedTime: string;
  }[];
  totalTime: string;
  recommendations: string;
  completed: boolean;
  title?: string;
};

interface Subject {
  id: string | number;
  name: string;
  examDate: string;
  color: string;
  pdfs: { id: number; name: string; size: string }[];
  importantDates: {
    name: string;
    date: string;
    type: 'exam' | 'tp' | 'other';
  }[];
}

const Dashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { getUserMaterials, getUserStudyPlans } = useDatabase();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyPlans, setStudyPlans] = useState<
    Array<{
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
            days: Array<StudyPlanDay>;
            finalRecommendations: string;
          }
        | null
        | undefined;
      progress: number;
      createdAt: string;
      expanded: boolean;
    }>
  >([]);
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | null
  >(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState<Array<{
    planId: string | number;
    day: StudyPlanDay;
    color?: string;
  }> | null>(null);
  const [filteredPlanIds, setFilteredPlanIds] = useState<(string | number)[]>(
    [],
  );

  // New state for the notes/checklist
  const [notes, setNotes] = useState<string>('Escribe tus notas aquí...');
  const [checklist, setChecklist] = useState<
    { id: number; text: string; completed: boolean }[]
  >([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Function to load data from the database
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
      } catch (error: unknown) {
        console.error('Error al cargar datos del usuario:', error);
      }
    };
    loadUserData();
  }, [user, getUserMaterials, getUserStudyPlans]);

  // Utility function to format dates
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

  const handleFilterChange = React.useCallback(
    (newFilteredPlanIds: (string | number)[]) => {
      setFilteredPlanIds(newFilteredPlanIds);
    },
    [],
  );

  const getFilteredStudyPlans = () => {
    if (filteredPlanIds.length === 0) {
      return studyPlans;
    }
    return studyPlans.filter((plan) => filteredPlanIds.includes(plan.id));
  };

  const studyPlanDays: {
    [date: string]: Array<{
      planId: string | number;
      day: StudyPlanDay;
      color?: string;
    }>;
  } = {};

  const filteredStudyPlans = getFilteredStudyPlans();
  filteredStudyPlans.forEach((plan) => {
    if (plan.structuredPlan && Array.isArray(plan.structuredPlan.days)) {
      plan.structuredPlan.days.forEach((day: StudyPlanDay) => {
        if (!studyPlanDays[day.date]) studyPlanDays[day.date] = [];
        const subject = subjects.find((s) => s.name === plan.subjectName);
        studyPlanDays[day.date].push({
          planId: plan.id,
          day,
          color: subject?.color,
        });
      });
    }
  });

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
      days.push(<div key={'e' + i} className="calendar-cell empty-cell"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday =
        today.getDate() === d &&
        today.getMonth() === currentMonth &&
        today.getFullYear() === currentYear;
      const plansForDay = studyPlanDays[dateStr] || [];
      days.push(
        <div
          key={d}
          className={`calendar-cell${isToday ? ' today' : ''}`}
          onClick={() => {
            if (plansForDay.length > 0) {
              setSelectedCalendarDate(dateStr);
              setSelectedDayDetails(plansForDay);
              setShowDayModal(true);
            }
          }}
        >
          <div className="day-number">{d}</div>
          {plansForDay.length > 0 && (
            <div className="day-dots-container">
              {plansForDay.map((plan, idx) => (
                <div
                  key={idx}
                  className="day-dot"
                  style={{
                    background: plan.color || '#10b981',
                  }}
                />
              ))}
            </div>
          )}
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

  // Notes/Checklist functions
  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim() !== '') {
      setChecklist([
        ...checklist,
        { id: Date.now(), text: newChecklistItem, completed: false },
      ]);
      setNewChecklistItem('');
    }
  };

  const handleToggleChecklistItem = (id: number) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const handleRemoveChecklistItem = (id: number) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="full-width-header">
        <div className="logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="FocuseAR Icon" />
          </div>
          <div className="logo-text">
            <img src="Texto.png" alt="FocuseAR" className="focusear-title" />
            <h2 className="title-subtitle">
              Planificación Automatizada con IA
            </h2>
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

      {/* Main content with a two-column grid */}
      <div className="main-content-layout">
        {/* Left panel is now for notes and checklist */}
        <div className="left-panel">
          <div className="panel notes-panel">
            <h2 className="panel-title">
              <i className="fas fa-sticky-note"></i> Notas y Tareas
            </h2>
            <div className="note-section">
              <h3 className="section-title">Notas</h3>
              <textarea
                className="notes-textarea"
                placeholder="Escribe tus notas aquí..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
            <div className="checklist-section">
              <h3 className="section-title">Lista de Tareas</h3>
              <div className="checklist-input-group">
                <input
                  type="text"
                  className="checklist-input"
                  placeholder="Añadir una nueva tarea..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' && handleAddChecklistItem()
                  }
                />
                <button
                  className="add-task-btn"
                  onClick={handleAddChecklistItem}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <ul className="checklist-list">
                {checklist.map((item) => (
                  <li
                    key={item.id}
                    className={`checklist-item ${item.completed ? 'completed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklistItem(item.id)}
                    />
                    <span className="checklist-text">{item.text}</span>
                    <button
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="remove-task-btn"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right panel for the calendar and AI assistant */}
        <div className="right-panel">
          <div className="panel calendar-panel">
            <h2 className="panel-title">
              <i className="fas fa-calendar-alt"></i> Calendario
            </h2>
            <div className="calendar-header">
              <button className="nav-button" onClick={() => changeMonth(-1)}>
                {'<'}
              </button>
              <h3 className="calendar-title">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <button className="nav-button" onClick={() => changeMonth(1)}>
                {'>'}
              </button>
            </div>
            <div className="calendar-grid">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                <div key={d} className="weekday-header">
                  {d}
                </div>
              ))}
              {renderDays()}
            </div>
            <StudyPlanFilter
              studyPlans={studyPlans}
              subjects={subjects}
              onFilterChange={handleFilterChange}
            />
          </div>
          {showDayModal &&
            selectedDayDetails &&
            Array.isArray(selectedDayDetails) && (
              <div
                className="modal-overlay"
                onClick={() => setShowDayModal(false)}
              >
                <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="modal-close-btn"
                    onClick={() => setShowDayModal(false)}
                  >
                    ×
                  </button>
                  <h3 className="modal-title">
                    {formatDate(selectedCalendarDate || '')}
                  </h3>
                  {selectedDayDetails.map((planDetail, idx: number) => (
                    <div
                      key={idx}
                      className="day-detail-card"
                      style={{
                        borderLeftColor: planDetail.color || '#10b981',
                      }}
                    >
                      <div
                        className="day-detail-header"
                        style={{
                          color: planDetail.color || '#10b981',
                        }}
                      >
                        {planDetail.day.title || `Plan #${planDetail.planId}`}
                      </div>
                      <div className="day-detail-meta">
                        <strong>Día {planDetail.day.dayNumber}</strong>
                      </div>
                      <div className="day-detail-topics">
                        <strong>Temas:</strong>
                        <ul>
                          {planDetail.day.topics.map((topic, idx2: number) => (
                            <li key={idx2}>
                              <span className="topic-name">{topic.name}</span>
                              {topic.estimatedTime && (
                                <span className="topic-time">
                                  ({topic.estimatedTime})
                                </span>
                              )}
                              <p className="topic-summary">{topic.summary}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {planDetail.day.recommendations && (
                        <div className="day-detail-recommendations">
                          <strong>💡 Recomendaciones:</strong>{' '}
                          {planDetail.day.recommendations}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          <div className="panel assistant-panel">
            <h2 className="panel-title">
              <i className="fas fa-robot"></i> Asistente IA
            </h2>
            <div className="assistant-answers">
              {answers.map((a, i) => (
                <p key={i} className="assistant-answer">
                  {a}
                </p>
              ))}
            </div>
            <div className="assistant-input-group">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pregunta algo..."
                className="assistant-input"
                onKeyPress={(e) => e.key === 'Enter' && askAI()}
              />
              <button onClick={askAI} className="assistant-send-btn">
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
