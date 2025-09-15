import React, { useState, useEffect, type JSX, useContext } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { AuthContext } from '../hooks/authContext';
import { useNavigate } from 'react-router-dom';
import NotesAndChecklist from './NotesAndChecklist';
import './Dashboard.css';
import { Settings } from 'lucide-react';

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

interface StudyPlanData {
  id: string | number;
  subjectName: string;
  eventName: string;
  examDate: string;
  topics: string[];
  studyDays: string[];
  content: string;
  structuredPlan: {
    title: string;
    summary: string;
    days: StudyPlanDay[];
    finalRecommendations: string;
  } | null;
  progress: number;
  createdAt: string;
  expanded: boolean;
  subjectColor?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { getUserStudyPlans } = useDatabase();
  const navigate = useNavigate();
  const [studyPlans, setStudyPlans] = useState<StudyPlanData[]>([]);
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

  const studyPlanDays: Record<
    string,
    Array<{
      planId: string | number;
      day: StudyPlanDay;
      color?: string;
    }>
  > = {};

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      try {
        const studyPlansData = await getUserStudyPlans();
        const convertedPlans = studyPlansData.map((plan, index) => {
          const planId = plan.id || `plan-${Date.now()}-${index}`;
          return {
            id: planId,
            subjectName: plan.generatedPlan?.title || 'Plan de Estudio',
            subjectColor: plan.generatedPlan?.subjectColor || '#4285F4',
            eventName: 'Examen',
            examDate: plan.generatedPlan?.examDate || '',
            topics: plan.generatedPlan?.topics || [],
            studyDays: plan.generatedPlan?.studyDates || [],
            content: JSON.stringify(plan.generatedPlan?.structuredPlan || {}),
            structuredPlan: plan.generatedPlan?.structuredPlan || null,
            progress: 0,
            createdAt:
              plan.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            expanded: false,
          };
        });
        setStudyPlans(convertedPlans);
      } catch (error: unknown) {
        console.error('Error al cargar planes de estudio:', error);
      }
    };
    loadUserData();
  }, [user, getUserStudyPlans]);

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
    let m = currentMonth + dir;
    let y = currentYear;
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
    if (filteredPlanIds.length === 0) return studyPlans;
    return studyPlans.filter((plan) => filteredPlanIds.includes(plan.id));
  };

  const filteredStudyPlans = getFilteredStudyPlans();
  filteredStudyPlans.forEach((plan) => {
    if (plan.structuredPlan?.days) {
      plan.structuredPlan.days.forEach((day) => {
        if (!studyPlanDays[day.date]) studyPlanDays[day.date] = [];
        studyPlanDays[day.date].push({
          planId: plan.id,
          day,
          color: plan.subjectColor || '#10b981',
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
      days.push(
        <div key={`empty-${i}`} className="calendar-cell empty-cell"></div>,
      );
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
                  style={{ background: plan.color || '#8A2BE2' }}
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

      <div className="panel notes-panel grid-span-6">
        <NotesAndChecklist />
      </div>

      <div className="panel activity-panel grid-span-6">
        <div className="panel-title-container">
          <h3 className="panel-title">Actividad reciente</h3>
        </div>
        <div className="activity-content">
          {studyPlans.length === 0 ? (
            <p>No hay planes de estudio recientes</p>
          ) : (
            <ul className="recent-plans">
              {studyPlans.slice(0, 3).map((plan) => (
                <li key={plan.id} className="recent-plan-item">
                  <div
                    className="plan-color"
                    style={{ backgroundColor: plan.subjectColor || '#4285F4' }}
                  ></div>
                  <div className="plan-details">
                    <h4>{plan.subjectName}</h4>
                    <p>Progreso: {plan.progress}%</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showDayModal && selectedDayDetails && (
        <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Actividades para {formatDate(selectedCalendarDate || '')}</h3>
            <div className="day-activities">
              {selectedDayDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="activity-item"
                  style={{ borderLeftColor: detail.color || '#4285F4' }}
                >
                  <h4>{detail.day.topics.map((t) => t.name).join(', ')}</h4>
                  <p>{detail.day.recommendations}</p>
                  <div className="activity-time">{detail.day.totalTime}</div>
                </div>
              ))}
            </div>
            <button
              className="close-modal"
              onClick={() => setShowDayModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
