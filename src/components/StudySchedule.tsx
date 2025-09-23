// src/components/StudySchedule.tsx
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
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
import type { Topic } from '../types/studyPlan';
import type { UserEvent as DBUserEvent } from '../services/DatabaseService';
import { Timestamp } from 'firebase/firestore';

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
  topics: Topic[];
  studyDays: string[];
  structuredPlan?: {
    title: string;
    summary: string;
    days: StudyPlanDay[];
    finalRecommendations: string;
  };
}

interface NewEventState {
  title: string;
  type: 'study' | 'exam' | 'task' | 'reminder';
  date: Date | null;
  time: string;
  description?: string;
  allDay?: boolean;
  color?: string;
}

// Extender la interfaz UserEvent con métodos útiles
// Interfaz extendida para los eventos locales
interface LocalUserEvent extends Omit<DBUserEvent, 'start' | 'end'> {
  start: string; // Formato: 'yyyy-MM-dd'
  end?: string; // Formato: 'yyyy-MM-dd'
  time: string; // Hora en formato 'HH:mm'
  date: string; // Alias para start para compatibilidad
  updatedAt: Timestamp; // Aseguramos que siempre esté presente
}

const StudySchedule: React.FC = () => {
  const { user } = useContext(AuthContext);
  const {
    getUserMaterials,
    getUserStudyPlans,
    createUserEvent,
    getUserEvents,
  } = useDatabase();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [localEvents, setLocalEvents] = useState<LocalUserEvent[]>([]);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [newEvent, setNewEvent] = useState<NewEventState>({
    title: '',
    type: 'study',
    date: null,
    time: '',
    description: '',
    allDay: true,
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
        topics: Array.isArray(plan.generatedPlan.topics)
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
        studyDays: plan.generatedPlan.studyDates || [],
        structuredPlan:
          (plan.generatedPlan.structuredPlan as StudyPlan['structuredPlan']) ||
          undefined,
      }));
      setStudyPlans(convertedPlans);

      // Fetch user events and convert to LocalUserEvent
      const userEvents = await getUserEvents();
      const convertedEvents: LocalUserEvent[] = userEvents.map((event) => {
        // Asegurarnos de que start sea un string
        const startDate =
          event.start instanceof Date ? event.start : new Date(event.start);
        const startStr = format(startDate, 'yyyy-MM-dd');

        // Obtener la hora del evento o usar la hora actual
        let timeStr = '00:00';
        const eventWithTime = event as DBUserEvent & { time?: string };
        if (eventWithTime.time && typeof eventWithTime.time === 'string') {
          timeStr = eventWithTime.time;
        } else if (event.start instanceof Date) {
          timeStr = format(event.start, 'HH:mm');
        }

        // Convertir fecha de fin si existe
        let endStr: string | undefined;
        if (event.end) {
          const endDate =
            event.end instanceof Date ? event.end : new Date(event.end);
          endStr = format(endDate, 'yyyy-MM-dd');
        }

        // Crear el objeto de evento local asegurando que los tipos sean correctos
        const localEvent: LocalUserEvent = {
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
          date: startStr, // Alias para compatibilidad
          time: timeStr,
          createdAt: event.createdAt || Timestamp.now(),
          updatedAt: event.updatedAt || Timestamp.now(),
        };

        return localEvent;
      });
      setLocalEvents(convertedEvents);
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    }
  }, [user, getUserMaterials, getUserStudyPlans, getUserEvents]);

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

  const getCombinedEvents = useCallback(
    (userId: string | undefined) => {
      const combinedEvents: { [date: string]: LocalUserEvent[] } = {};

      if (!userId) return combinedEvents;

      // Agregar eventos de planes de estudio
      studyPlans.forEach((plan) => {
        if (plan.structuredPlan?.days) {
          plan.structuredPlan.days.forEach((day) => {
            const dateStr = day.date;
            if (!combinedEvents[dateStr]) combinedEvents[dateStr] = [];

            const subject = subjects.find((s) => s.name === plan.subjectName);

            const newEvent: LocalUserEvent = {
              id: `plan-${plan.id}-${day.dayNumber}`,
              userId: userId,
              title: day.title || plan.subjectName,
              description: day.topics.map((t) => t.name).join(', '),
              type: 'study',
              start: dateStr,
              date: dateStr, // Para compatibilidad
              time: day.totalTime || '',
              allDay: true,
              color: subject?.color || '#1a73e8',
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            };

            combinedEvents[dateStr].push(newEvent);
          });
        }
      });

      // Agregar eventos locales
      localEvents.forEach((event) => {
        const dateStr = event.start; // Usamos start como la fecha principal
        if (!dateStr) return;

        if (!combinedEvents[dateStr]) combinedEvents[dateStr] = [];

        // Asegurarse de que el evento tenga todos los campos requeridos
        const normalizedEvent: LocalUserEvent = {
          ...event,
          date: dateStr, // Mantener compatibilidad
          start: dateStr,
          time: event.time || '',
          allDay: event.allDay ?? true,
          updatedAt: event.updatedAt || Timestamp.now(),
        };

        combinedEvents[dateStr].push(normalizedEvent);
      });

      return combinedEvents;
    },
    [studyPlans, subjects, localEvents],
  );

  // Usar useMemo para evitar recálculos innecesarios
  const combinedEvents = useMemo(() => {
    return getCombinedEvents(user?.uid);
  }, [getCombinedEvents, user?.uid]);

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
          {displayedEvents.map((event: LocalUserEvent, idx: number) => (
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
    const { name, value, type } = e.target;

    setNewEvent((prev) => {
      // Manejar tipos específicos de entrada
      if (type === 'checkbox') {
        const target = e.target as HTMLInputElement;
        return { ...prev, [name]: target.checked };
      }

      // Manejar tipos específicos
      if (name === 'allDay') {
        return { ...prev, allDay: (e.target as HTMLInputElement).checked };
      }

      // Manejar el tipo de evento
      if (
        name === 'type' &&
        ['study', 'exam', 'task', 'reminder'].includes(value)
      ) {
        return {
          ...prev,
          [name]: value as 'study' | 'exam' | 'task' | 'reminder',
        };
      }

      // Para otros campos
      return { ...prev, [name]: value };
    });
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !user) return;

    const dateStr = format(newEvent.date, 'yyyy-MM-dd');
    const timeStr = newEvent.time || '00:00';

    // Determinar el color según el tipo de evento
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
      end: dateStr, // Mismo día por defecto
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
          // Asegurarse de que todos los campos requeridos estén presentes
          userId: user.uid,
          title: newEvent.title,
          description: newEvent.description || '',
          type: newEvent.type as 'study' | 'exam' | 'task' | 'reminder',
          allDay: newEvent.allDay ?? true,
          color:
            newEvent.color ||
            (() => {
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
            })(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        setLocalEvents((prevEvents) => [...prevEvents, newLocalEvent]);

        // Resetear el formulario
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
      // Aquí podrías agregar un manejo de errores más robusto
    }
  };

  const upcomingEvents = localEvents
    .filter((event) => {
      if (!event.start) return false;

      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      return eventDate >= todayDate;
    })
    .sort((a, b) => {
      // Ordenar por fecha de inicio (start)
      const dateA = a.start ? new Date(a.start) : new Date(0);
      const dateB = b.start ? new Date(b.start) : new Date(0);

      const dateComparison = dateA.getTime() - dateB.getTime();
      if (dateComparison !== 0) return dateComparison;

      // Si las fechas son iguales, ordenar por hora si está disponible
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';

      const [hA, mA] = timeA.split(':').map(Number);
      const [hB, mB] = timeB.split(':').map(Number);

      return hA * 60 + mA - (hB * 60 + mB);
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
