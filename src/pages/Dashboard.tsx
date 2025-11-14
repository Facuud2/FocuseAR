import React, { useState, useEffect, useContext } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { AuthContext } from '../hooks/authContext';
import { useNavigate } from 'react-router-dom';
import NotesAndChecklist from '../components/NotesAndChecklist';
import './Dashboard.css';
import { Settings, Plus, BookOpen, Clock, AlertCircle } from 'lucide-react';
import type { Topic } from '../types/studyPlan';
import { type UserEvent as DBUserEvent } from '../services/DatabaseService';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  topics: Topic[];
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
  const { getUserStudyPlans, createUserEvent, getUserEvents } = useDatabase();
  const navigate = useNavigate();
  const [studyPlans, setStudyPlans] = useState<StudyPlanData[]>([]);
  // Toggle para ocultar el panel de "Próximas Tareas" y el botón de añadir evento
  const SHOW_UPCOMING_EVENTS = false;
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

  // Estados para eventos personalizados
  const [userEvents, setUserEvents] = useState<LocalUserEvent[]>([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEventState>({
    title: '',
    type: 'study',
    date: null,
    time: '',
    description: '',
    allDay: true,
  });

  // Interfaces para eventos personalizados
  interface NewEventState {
    title: string;
    type: 'study' | 'exam' | 'task' | 'reminder';
    date: Date | null;
    time: string;
    description?: string;
    allDay?: boolean;
    color?: string;
  }

  interface LocalUserEvent extends Omit<DBUserEvent, 'start' | 'end'> {
    start: string;
    end?: string;
    time: string;
    date: string;
    updatedAt: Timestamp;
  }

  const studyPlanDays: Record<
    string,
    Array<{
      planId: string | number;
      day: StudyPlanDay;
      color?: string;
      isUserEvent?: boolean;
      userEvent?: LocalUserEvent;
    }>
  > = {};

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      try {
        // Load Study Plans
        const studyPlansData = await getUserStudyPlans();
        const convertedPlans = studyPlansData.map((plan, index) => {
          const planId = plan.id || `plan-${Date.now()}-${index}`;
          return {
            id: planId,
            subjectName: plan.generatedPlan?.title || 'Plan de Estudio',
            subjectColor: plan.generatedPlan?.subjectColor || '#4285F4',
            eventName: 'Examen',
            examDate: plan.generatedPlan?.examDate || '',
            topics: Array.isArray(plan.generatedPlan?.topics)
              ? plan.generatedPlan.topics.map((topic) =>
                  typeof topic === 'string'
                    ? {
                        id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        title: topic,
                        description: '',
                      }
                    : topic,
                )
              : [],
            studyDays: plan.generatedPlan?.studyDates || [],
            content: JSON.stringify(plan.generatedPlan?.structuredPlan || {}),
            structuredPlan:
              (plan.generatedPlan
                ?.structuredPlan as StudyPlanData['structuredPlan']) || null,
            progress: 0,
            createdAt: plan.createdAt
              ? typeof plan.createdAt === 'object' && 'toDate' in plan.createdAt
                ? plan.createdAt.toDate().toISOString()
                : typeof plan.createdAt === 'string'
                  ? plan.createdAt
                  : new Date().toISOString()
              : new Date().toISOString(),
            expanded: false,
          };
        });
        setStudyPlans(convertedPlans);

        // Load User Events
        const userEventsData = await getUserEvents();
        const convertedEvents: LocalUserEvent[] = userEventsData.map(
          (event) => {
            const startDate =
              event.start instanceof Date ? event.start : new Date(event.start);
            const startStr = format(startDate, 'yyyy-MM-dd');

            let timeStr = '00:00';
            const eventWithTime = event as DBUserEvent & { time?: string };
            if (eventWithTime.time && typeof eventWithTime.time === 'string') {
              timeStr = eventWithTime.time;
            } else if (event.start instanceof Date) {
              timeStr = format(event.start, 'HH:mm');
            }

            let endStr: string | undefined;
            if (event.end) {
              const endDate =
                event.end instanceof Date ? event.end : new Date(event.end);
              endStr = format(endDate, 'yyyy-MM-dd');
            }

            return {
              ...event,
              id: event.id || '',
              userId: event.userId,
              title: event.title,
              description: event.description || '',
              type: event.type as 'study' | 'exam' | 'task' | 'reminder',
              allDay: event.allDay ?? true,
              color: event.color || '#4285F4',
              start: startStr,
              end: endStr,
              date: startStr,
              time: timeStr,
              createdAt: event.createdAt || Timestamp.now(),
              updatedAt: event.updatedAt || Timestamp.now(),
            };
          },
        );
        setUserEvents(convertedEvents);
      } catch (error: unknown) {
        console.error('Error al cargar datos del usuario:', error);
      }
    };
    loadUserData();
  }, [user, getUserStudyPlans, getUserEvents]);

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
          isUserEvent: false,
        });
      });
    }
  });

  // Agregar eventos de usuario al calendario
  userEvents.forEach((event) => {
    const dateStr = event.start;
    if (!dateStr) return;

    if (!studyPlanDays[dateStr]) studyPlanDays[dateStr] = [];

    // Crear un StudyPlanDay ficticio para el evento de usuario
    const userEventDay: StudyPlanDay = {
      date: dateStr,
      dayNumber: 0,
      topics: [
        {
          name: event.title,
          summary: event.description || '',
          estimatedTime: event.time || '',
        },
      ],
      totalTime: event.time || '',
      recommendations: event.description || '',
      completed: false,
      title: event.title,
    };

    studyPlanDays[dateStr].push({
      planId: `user-event-${event.id}`,
      day: userEventDay,
      color: event.color || '#4285F4',
      isUserEvent: true,
      userEvent: event,
    });
  });

  const renderDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDay = firstDay.getDay();
    if (startDay === 0) startDay = 6;
    else startDay--;

    const today = new Date();
    const days: React.ReactNode[] = [];

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    setNewEvent((prev) => {
      if (type === 'checkbox') {
        const target = e.target as HTMLInputElement;
        return { ...prev, [name]: target.checked };
      }

      if (name === 'allDay') {
        return { ...prev, allDay: (e.target as HTMLInputElement).checked };
      }

      if (
        name === 'type' &&
        ['study', 'exam', 'task', 'reminder'].includes(value)
      ) {
        return {
          ...prev,
          [name]: value as 'study' | 'exam' | 'task' | 'reminder',
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !user) return;

    const dateStr = format(newEvent.date, 'yyyy-MM-dd');
    const timeStr = newEvent.time || '00:00';

    const getEventColor = () => {
      switch (newEvent.type) {
        case 'study':
          return '#4285F4';
        case 'exam':
          return '#EA4335';
        case 'task':
          return '#FBBC05';
        case 'reminder':
        default:
          return '#34A853';
      }
    };

    const now = Timestamp.now();
    const eventToSave: Omit<DBUserEvent, 'id'> = {
      userId: user.uid,
      title: newEvent.title,
      description: newEvent.description || '',
      type: newEvent.type || 'study',
      start: dateStr,
      end: dateStr,
      allDay: newEvent.allDay ?? true,
      color: newEvent.color || getEventColor(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      const eventId = await createUserEvent(eventToSave);
      if (eventId) {
        const newLocalEvent: LocalUserEvent = {
          ...eventToSave,
          id: eventId,
          start: dateStr,
          end: dateStr,
          date: dateStr,
          time: timeStr,
          userId: user.uid,
          title: newEvent.title,
          description: newEvent.description || '',
          type: newEvent.type as 'study' | 'exam' | 'task' | 'reminder',
          allDay: newEvent.allDay ?? true,
          color: newEvent.color || getEventColor(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        setUserEvents((prevEvents) => [...prevEvents, newLocalEvent]);
        setShowAddEventModal(false);
        setNewEvent({
          title: '',
          type: 'study',
          date: null,
          time: '',
          description: '',
          allDay: true,
        });
      }
    } catch (error) {
      console.error('Error al guardar el evento:', error);
    }
  };

  const upcomingEvents = userEvents
    .filter((event) => {
      if (!event.start) return false;
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      return eventDate >= todayDate;
    })
    .sort((a, b) => {
      const dateA = a.start ? new Date(a.start) : new Date(0);
      const dateB = b.start ? new Date(b.start) : new Date(0);
      const dateComparison = dateA.getTime() - dateB.getTime();
      if (dateComparison !== 0) return dateComparison;
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      const [hA, mA] = timeA.split(':').map(Number);
      const [hB, mB] = timeB.split(':').map(Number);
      return hA * 60 + mA - (hB * 60 + mB);
    });

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

      {/* CALENDAR PANEL (col-span-12) */}
      <div className="panel calendar-panel grid-span-12">
        <div className="panel-title-container">
          <h3 className="panel-title">Calendario de Estudio y Eventos</h3>
          {SHOW_UPCOMING_EVENTS && (
            <button
              className="add-event-btn-header"
              onClick={() => setShowAddEventModal(true)}
              title="Añadir evento personalizado"
            >
              <Plus size={20} />
              Añadir Evento
            </button>
          )}
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

      {SHOW_UPCOMING_EVENTS && (
        <div className="panel activity-panel grid-span-6">
          <div className="panel-title-container">
            <h3 className="panel-title">
              <Clock className="panel-icon" /> Próximas Tareas
            </h3>
          </div>
          <div className="activity-content">
            {upcomingEvents.length === 0 ? (
              <p className="empty-state-text">No hay eventos próximos.</p>
            ) : (
              <ul className="upcoming-list">
                {upcomingEvents.slice(0, 5).map((event, index) => (
                  <li key={index} className="upcoming-item">
                    <div className={`item-icon ${event.type}`}>
                      {event.type === 'study' && <BookOpen size={20} />}
                      {event.type === 'exam' && <AlertCircle size={20} />}
                      {event.type === 'task' && <Clock size={20} />}
                      {event.type === 'reminder' && <Clock size={20} />}
                    </div>
                    <div className="item-details">
                      <span className="item-title">{event.title}</span>
                      <span className="item-date">
                        {event.date
                          ? format(
                              new Date(event.date + 'T' + event.time),
                              'EEEE, dd MMMM',
                              { locale: es },
                            )
                          : ''}
                      </span>
                    </div>
                    <span className="item-time">{event.time}h</span>
                  </li>
                ))}
              </ul>
            )}
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
                  className="activity-item"
                  style={{ borderLeftColor: planDetail.color || '#4285F4' }}
                >
                  <h4>{planDetail.day.topics.map((t) => t.name).join(', ')}</h4>
                  <p>{planDetail.day.recommendations}</p>
                  <div className="activity-time">
                    {planDetail.day.totalTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* MODAL para añadir eventos */}
      {showAddEventModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddEventModal(false)}
        >
          <div
            className="modal-content add-event-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowAddEventModal(false)}
            >
              ×
            </button>
            <h3 className="modal-title">
              <Plus className="panel-icon" /> Añadir Nuevo Evento
            </h3>
            <form className="event-form" onSubmit={handleAddEvent}>
              <div className="form-group">
                <label htmlFor="event-title">Título del Evento</label>
                <input
                  type="text"
                  id="event-title"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="event-type">Tipo de Evento</label>
                <select
                  id="event-type"
                  name="type"
                  value={newEvent.type}
                  onChange={handleInputChange}
                >
                  <option value="study">Sesión de Estudio</option>
                  <option value="exam">Examen</option>
                  <option value="task">Tarea/Entrega</option>
                  <option value="reminder">Recordatorio</option>
                </select>
              </div>
              <div className="flex-group">
                <div className="form-group">
                  <label>Fecha</label>
                  <DatePicker
                    selected={newEvent.date}
                    onChange={(date) => setNewEvent({ ...newEvent, date })}
                    dateFormat="dd/MM/yyyy"
                    locale={es}
                    className="full-width-input"
                    placeholderText="Selecciona una fecha"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="event-time">Hora</label>
                  <input
                    type="time"
                    id="event-time"
                    name="time"
                    value={newEvent.time}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="event-description">
                  Descripción (opcional)
                </label>
                <textarea
                  id="event-description"
                  name="description"
                  value={newEvent.description || ''}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Añade una descripción..."
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddEventModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="add-event-btn">
                  <Plus size={18} /> Programar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
