// src/components/Dashboard.tsx
import React, { useState, useEffect, type JSX } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { useContext } from 'react';
import { AuthContext } from '../hooks/authContext';
import NotesAndChecklist from './NotesAndChecklist';
import './Dashboard.css';

// Tipado para los datos compartidos
type StudyPlanDay = {
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

  // Estados locales para el calendario
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

  const loadUserData = async () => {
    if (!user) return;
    try {
      const materials = await getUserMaterials();
      const convertedSubjects: Subject[] = materials.map((material, index) => {
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
      });
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

  useEffect(() => {
    loadUserData();
  }, [user, getUserMaterials, getUserStudyPlans]);

  const studyPlanDays: {
    [date: string]: Array<{
      planId: string | number;
      day: StudyPlanDay;
      color?: string;
    }>;
  } = {};
  studyPlans.forEach((plan) => {
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
      const isToday =
        today.getDate() === d &&
        today.getMonth() === currentMonth &&
        today.getFullYear() === currentYear;
      const plansForDay = studyPlanDays[dateStr] || [];
      days.push(
        <div
          key={d}
          className={`calendar-cell${isToday ? ' today' : ''}`}
          style={{
            cursor: plansForDay.length > 0 ? 'pointer' : 'default',
            position: 'relative',
          }}
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
            <div
              style={{
                display: 'flex',
                gap: 2,
                position: 'absolute',
                top: 4,
                right: 4,
              }}
            >
              {plansForDay.map((plan, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: plan.color || '#10b981',
                    border: '1px solid #fff',
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

  return (
    <div className="dashboard-container">
      {/* HEADER, ahora con ancho completo */}
      <header className="full-width-header">
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

      {/* Contenedor principal con grid para el calendario y el anotador */}
      <div className="main-content-layout">
        {/* PANEL CALENDARIO */}
        <div className="calendar-panel">
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
          {/* Modal de detalles del día */}
          {showDayModal &&
            selectedDayDetails &&
            Array.isArray(selectedDayDetails) && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  background: 'rgba(0,0,0,0.3)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setShowDayModal(false)}
              >
                <div
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: 32,
                    minWidth: 320,
                    maxWidth: 420,
                    boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
                    position: 'relative',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: 'none',
                      border: 'none',
                      fontSize: 22,
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowDayModal(false)}
                  >
                    ×
                  </button>
                  <h3 style={{ marginBottom: 12, color: '#10b981' }}>
                    {formatDate(selectedCalendarDate || '')}
                  </h3>
                  {selectedDayDetails.map((planDetail, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: 24,
                        borderLeft: `4px solid ${planDetail.color || '#10b981'}`,
                        paddingLeft: 12,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: planDetail.color || '#10b981',
                          marginBottom: 4,
                        }}
                      >
                        {planDetail.day.title || `Plan #${planDetail.planId}`}
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <strong>Día {planDetail.day.dayNumber}</strong>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <strong>Temas:</strong>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {planDetail.day.topics.map((topic, idx2: number) => (
                            <li key={idx2} style={{ marginBottom: 6 }}>
                              <span style={{ fontWeight: '500' }}>
                                {topic.name}
                              </span>
                              {topic.estimatedTime && (
                                <span style={{ color: '#666', marginLeft: 6 }}>
                                  ({topic.estimatedTime})
                                </span>
                              )}
                              <div style={{ fontSize: 13, color: '#666' }}>
                                {topic.summary}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {planDetail.day.recommendations && (
                        <div
                          style={{
                            background: '#fef7cd',
                            borderRadius: 6,
                            padding: 10,
                            color: '#92400e',
                            fontSize: 14,
                          }}
                        >
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
        {/* PANEL DEL ANOTADOR */}
        <NotesAndChecklist />
      </div>
    </div>
  );
};

export default Dashboard;
