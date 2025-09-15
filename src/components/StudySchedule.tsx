// src/components/StudySchedule.tsx
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  type JSX,
} from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { AuthContext } from '../hooks/authContext';
import { Plus, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './StudySchedule.css';

// Tipado para los eventos del calendario
interface CalendarEvent {
  type: 'study' | 'exam' | 'task';
  title: string;
  time: string;
  date: string;
  color?: string;
}

// Tipado para los datos de la base de datos
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

// CORRECCIÓN: Nuevo tipo para Pdf
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
  pdfs: Pdf[]; // CORRECCIÓN: Tipo ahora es Pdf[]
  importantDates: {
    name: string;
    date: string;
    type: 'exam' | 'tp' | 'other';
  }[];
}

interface StudyPlan {
  id?: string;
  subjectName: string;
  eventName: string;
  examDate: string;
  topics: string[];
  studyDays: string[];
  structuredPlan?: {
    title: string;
    summary: string;
    days: StudyPlanDay[];
    finalRecommendations: string;
  };
}

const StudySchedule: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { getUserMaterials, getUserStudyPlans } = useDatabase();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [newEvent, setNewEvent] = useState<{
    title: string;
    type: 'study' | 'exam' | 'task';
    date: Date | null;
    time: string;
  }>({
    title: '',
    type: 'study',
    date: null,
    time: '',
  });

  // CORRECCIÓN: Envolvemos loadUserData en useCallback para evitar el warning
  const loadUserData = useCallback(async () => {
    if (!user) return;
    try {
      const materials = await getUserMaterials();
      const convertedSubjects: Subject[] = materials.map((material, index) => ({
        id: material.id || `subject-${Date.now()}-${index}`,
        name: material.fileName.replace(/\.(pdf|docx|doc)$/i, ''),
        examDate: '',
        color: '#4285F4',
        pdfs: [],
        importantDates: [],
      }));
      setSubjects(convertedSubjects);

      const plans = await getUserStudyPlans();
      const convertedPlans: StudyPlan[] = plans.map((plan) => ({
        id: plan.id,
        subjectName: plan.generatedPlan.title || 'Plan de Estudio',
        eventName: 'Examen',
        examDate: plan.generatedPlan.examDate || '',
        topics: plan.generatedPlan.topics || [],
        studyDays: plan.generatedPlan.studyDates || [],
        structuredPlan: plan.generatedPlan.structuredPlan || undefined,
      }));
      setStudyPlans(convertedPlans);
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    }
  }, [user, getUserMaterials, getUserStudyPlans]);

  // CORRECCIÓN: El array de dependencias ahora solo incluye loadUserData
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

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

  const getCombinedEvents = () => {
    const combinedEvents: { [date: string]: CalendarEvent[] } = {};

    studyPlans.forEach((plan) => {
      if (plan.structuredPlan?.days) {
        plan.structuredPlan.days.forEach((day) => {
          const dateStr = day.date;
          if (!combinedEvents[dateStr]) combinedEvents[dateStr] = [];

          const subject = subjects.find((s) => s.name === plan.subjectName);
          combinedEvents[dateStr].push({
            type: 'study',
            title: day.title || plan.subjectName,
            time: day.totalTime || '',
            date: dateStr,
            color: subject?.color || '#1a73e8',
          });
        });
      }
    });

    localEvents.forEach((event) => {
      const dateStr = event.date;
      if (!combinedEvents[dateStr]) combinedEvents[dateStr] = [];
      combinedEvents[dateStr].push(event);
    });

    return combinedEvents;
  };

  const combinedEvents = getCombinedEvents();

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
        <div key={'empty-' + i} className="calendar-cell empty-cell"></div>,
      );
    }

    const MAX_EVENTS_PER_CELL = 2;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const dateStr = format(date, 'yyyy-MM-dd');
      const isToday =
        today.getDate() === d &&
        today.getMonth() === currentMonth &&
        today.getFullYear() === currentYear;
      const eventsForDay = combinedEvents[dateStr] || [];

      const displayedEvents = eventsForDay.slice(0, MAX_EVENTS_PER_CELL);
      const remainingEventsCount = eventsForDay.length - displayedEvents.length;

      days.push(
        <div key={d} className={`calendar-cell ${isToday ? 'today' : ''}`}>
          <div className="day-number">{d}</div>
          {displayedEvents.map((event, idx) => (
            <div
              key={idx}
              className={`event event-${event.type}`}
              style={{ backgroundColor: event.color }}
              title={event.title + (event.time ? ` (${event.time}h)` : '')}
            >
              <span className="event-title">{event.title}</span>
            </div>
          ))}
          {remainingEventsCount > 0 && (
            <div className="more-events-indicator">
              +{remainingEventsCount} más
            </div>
          )}
        </div>,
      );
    }
    return days;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === 'type' && ['study', 'exam', 'task'].includes(value)) {
      setNewEvent({ ...newEvent, [name]: value as 'study' | 'exam' | 'task' });
    } else {
      setNewEvent({ ...newEvent, [name]: value as string | null });
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEvent.title && newEvent.date) {
      const dateStr = format(newEvent.date, 'yyyy-MM-dd');
      const newLocalEvent: CalendarEvent = {
        title: newEvent.title,
        type: newEvent.type,
        date: dateStr,
        time: newEvent.time,
        color:
          newEvent.type === 'study'
            ? '#4285F4'
            : newEvent.type === 'exam'
              ? '#EA4335'
              : '#FBBC05',
      };
      setLocalEvents([...localEvents, newLocalEvent]);
      setNewEvent({ title: '', type: 'study', date: null, time: '' });
    }
  };

  const upcomingEvents = localEvents
    .filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      return eventDate >= todayDate;
    })
    .sort((a, b) => {
      const dateComparison =
        new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      if (a.time && b.time) {
        const [hA, mA] = a.time.split(':').map(Number);
        const [hB, mB] = b.time.split(':').map(Number);
        return hA * 60 + mA - (hB * 60 + mB);
      }
      return 0;
    });

  return (
    <div className="schedule-container">
      <header className="schedule-header">
        <h1 className="schedule-title">Mi Horario de Estudio</h1>
        <p className="schedule-subtitle">
          Organiza tus sesiones, tareas y exámenes en un solo lugar.
        </p>
      </header>

      <div className="schedule-main-content">
        <div className="schedule-calendar-panel">
          <div className="calendar-header">
            <button
              className="calendar-nav-btn"
              onClick={() => changeMonth(-1)}
            >
              &lt;
            </button>
            <h3 className="calendar-month-year">
              {format(new Date(currentYear, currentMonth), 'MMMM yyyy', {
                locale: es,
              })}
            </h3>
            <button className="calendar-nav-btn" onClick={() => changeMonth(1)}>
              &gt;
            </button>
          </div>
          <div className="calendar-grid">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
              <div key={day} className="weekday-header">
                {day}
              </div>
            ))}
            {renderDays()}
          </div>
        </div>

        <div className="schedule-sidebar">
          <div className="add-event-panel panel">
            <h2 className="panel-title">
              <Plus className="panel-icon" /> Añadir Nuevo Evento
            </h2>
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
              <button type="submit" className="add-event-btn">
                <Plus size={18} /> Programar Evento
              </button>
            </form>
          </div>

          <div className="upcoming-panel panel">
            <h2 className="panel-title">
              <Clock className="panel-icon" /> Próximas Tareas
            </h2>
            <ul className="upcoming-list">
              {upcomingEvents.length === 0 ? (
                <p className="empty-state-text">No hay eventos próximos.</p>
              ) : (
                upcomingEvents.map((event, index) => (
                  <li key={index} className="upcoming-item">
                    <div className={`item-icon ${event.type}`}>
                      {event.type === 'study' && <BookOpen size={20} />}
                      {event.type === 'exam' && <AlertCircle size={20} />}
                      {event.type === 'task' && <Clock size={20} />}
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
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudySchedule;
