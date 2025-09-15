import React, { useState, useEffect, type JSX, useContext } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { AuthContext } from '../hooks/authContext';
import { useNavigate } from 'react-router-dom';
import NotesAndChecklist from './NotesAndChecklist';
import AssistantIA from './AssistantIA';
import './Dashboard.css';
import { Settings, MessageSquare, X } from 'lucide-react';

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
  const navigate = useNavigate();

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
  const [filteredPlanIds] = useState<(string | number)[]>([]);
  const [showChatModal, setShowChatModal] = useState(false);

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
                    background: plan.color || '#8A2BE2',
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

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="grid-span-12">
        <div className="logo-container">
          <div className="logo-circle">
            <img src="/logo.png" alt="FocuseAR Icon" />
          </div>
          <h1 className="logo-title rgb-text">FOCUSEAR</h1>
        </div>
        <div className="user-info">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="user-avatar" />
          ) : (
            <div className="user-avatar placeholder">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
          )}
          <span className="user-name">
            {user?.displayName || user?.email || 'Usuario'}
          </span>
          <button className="settings-btn" onClick={handleSettingsClick}>
            <Settings size={24} />
          </button>
        </div>
      </header>

      {/* CALENDAR PANEL (col-span-12) */}
      <div className="panel calendar-panel grid-span-12">
        <div className="panel-title-container">
          <h3 className="panel-title">Calendario de Estudio</h3>
          <div className="calendar-header">
            <button
              className="calendar-nav-btn"
              onClick={() => changeMonth(-1)}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <h4 className="calendar-title">
              {monthNames[currentMonth]} {currentYear}
            </h4>
            <button className="calendar-nav-btn" onClick={() => changeMonth(1)}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
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

      {/* NOTES PANEL (col-span-6) */}
      <div className="panel notes-panel grid-span-6">
        <NotesAndChecklist />
      </div>

      {/* BUTTON TO OPEN CHAT MODAL */}
      <div
        className="panel grid-span-6 panel-title-container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--surface-color)',
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 className="panel-title">Asistente de IA</h3>
        <button
          className="start-chat-btn"
          onClick={() => setShowChatModal(true)}
          style={{
            background: 'var(--primary-neon-color)',
            color: 'var(--text-inverted)',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'var(--transition-ease)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <MessageSquare size={20} />
          <span>Iniciar Nueva Conversación</span>
        </button>
      </div>

      {/* CHAT MODAL */}
      {showChatModal && (
        <div className="modal-overlay" onClick={() => setShowChatModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="panel-title-container">
              <h3 className="modal-title">Asistente de IA</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowChatModal(false)}
              >
                <X size={32} />
              </button>
            </div>
            <AssistantIA />
          </div>
        </div>
      )}

      {/* MODAL for day details */}
      {showDayModal &&
        selectedDayDetails &&
        Array.isArray(selectedDayDetails) && (
          <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                    borderLeftColor: planDetail.color || '#8A2BE2',
                  }}
                >
                  <div
                    className="day-detail-header"
                    style={{
                      color: planDetail.color || '#8A2BE2',
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
    </div>
  );
};

export default Dashboard;
