import React, { useState, useEffect, type JSX } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { useContext } from 'react';
import { AuthContext } from '../hooks/authContext';
import NotesAndChecklist from './NotesAndChecklist';
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

  // --- Dummy Data for New Panels ---

  const weeklyBarData = [45, 60, 55, 75, 80, 50, 30];

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
          <button className="settings-btn">
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </header>

      {/* STATS PANEL */}
      <div className="panel stats-panel grid-span-3">
        <div className="stat-item">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <span className="stat-value">12</span>
            <span className="stat-label">Materias activas</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <span className="stat-value">3</span>
            <span className="stat-label">Próximos exámenes</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <span className="stat-value">8.5h</span>
            <span className="stat-label">Tiempo de estudio</span>
          </div>
        </div>
      </div>

      {/* CALENDAR PANEL */}
      <div className="panel calendar-panel grid-span-6">
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

      {/* UPCOMING EVENTS */}
      <div className="panel events-panel grid-span-3">
        <div className="panel-title-container">
          <h3 className="panel-title">Próximos eventos</h3>
          <span className="panel-title-stat">3</span>
        </div>
        <div className="events-list">
          <div className="event-item">
            <div className="event-date">15 SEP</div>
            <div className="event-details">
              <div className="event-title">Matemáticas II</div>
              <div className="event-time">09:00 - 11:00</div>
            </div>
            <div className="event-type exam">Examen</div>
          </div>
          <div className="event-item">
            <div className="event-date">18 SEP</div>
            <div className="event-details">
              <div className="event-title">Física I</div>
              <div className="event-time">14:00 - 16:00</div>
            </div>
            <div className="event-type tp">TP</div>
          </div>
          <div className="event-item">
            <div className="event-date">20 SEP</div>
            <div className="event-details">
              <div className="event-title">Programación I</div>
              <div className="event-time">10:00 - 12:00</div>
            </div>
            <div className="event-type exam">Examen</div>
          </div>
        </div>
      </div>

      {/* NOTES PANEL */}
      <div className="panel notes-panel grid-span-6">
        <NotesAndChecklist />
      </div>

      {/* ACTIVITY PANEL */}
      <div className="panel activity-panel grid-span-6">
        <div className="panel-title-container">
          <h3 className="panel-title">Actividad semanal</h3>
          <span className="panel-title-stat">1047 min</span>
        </div>
        <div className="bar-chart-grid">
          {weeklyBarData.map((height, index) => (
            <div
              key={index}
              className="bar-item"
              style={{ height: `${height}%` }}
            ></div>
          ))}
        </div>
        <div className="chart-labels">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <span key={day} className="chart-label">
              {day}
            </span>
          ))}
        </div>
      </div>

      {/* MODAL */}
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
