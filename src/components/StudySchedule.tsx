// src/components/StudySchedule.tsx

import { useState } from 'react';
import './StudySchedule.css';
import { Plus, BookOpen, Clock, AlertCircle } from 'lucide-react';

// Define el tipo para un evento
interface Event {
  type: 'study' | 'exam' | 'task';
  title: string;
  time: string;
}

// Define el tipo para el objeto de eventos, permitiendo cualquier clave de string
interface Events {
  [key: string]: Event[];
}

// Datos de ejemplo para el calendario
const initialEvents: Events = {
  '2025-09-09': [
    { type: 'study', title: 'Matemáticas Avanzadas', time: '10:00 - 12:00' },
    { type: 'exam', title: 'Examen de Física', time: '14:00' },
  ],
  '2025-09-12': [
    { type: 'study', title: 'Historia de España', time: '09:00 - 10:30' },
  ],
  '2025-09-15': [
    { type: 'task', title: 'Entregar ensayo de Química', time: '18:00' },
  ],
};

const StudySchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events] = useState(initialEvents);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday...
    const days = [];

    // Fill with empty days from the previous month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // Fill with days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const daysInMonth = getDaysInMonth(currentDate);

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="schedule-container">
      <header className="schedule-header">
        <h1 className="schedule-title">Mi Horario de Estudio</h1>
        <p className="schedule-subtitle">
          Organiza tus sesiones, tareas y exámenes para un mes productivo.
        </p>
      </header>

      <div className="schedule-main-content">
        {/* Calendar Section */}
        <div className="schedule-calendar-panel">
          <div className="calendar-header">
            <button className="calendar-nav-btn" onClick={handlePrevMonth}>
              &lt;
            </button>
            <h3 className="calendar-month-year">
              {currentDate.toLocaleString('es-ES', {
                month: 'long',
                year: 'numeric',
              })}
            </h3>
            <button className="calendar-nav-btn" onClick={handleNextMonth}>
              &gt;
            </button>
          </div>
          <div className="calendar-grid">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="weekday-header">
                {day}
              </div>
            ))}
            {daysInMonth.map((day, index) => (
              <div
                key={index}
                className={`calendar-cell ${day && day.toISOString().split('T')[0] === today ? 'today' : ''}`}
              >
                {day && (
                  <>
                    <span className="day-number">{day.getDate()}</span>
                    {(events[day.toISOString().split('T')[0]] || []).map(
                      (event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={`event event-${event.type}`}
                        >
                          {event.title}
                        </div>
                      ),
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form to add events */}
        <div className="add-event-panel">
          <h2 className="panel-title">
            <Plus className="panel-icon" /> Añadir Nuevo Evento
          </h2>
          <form className="event-form">
            <div className="form-group">
              <label htmlFor="event-title">Título del Evento</label>
              <input type="text" id="event-title" name="title" required />
            </div>
            <div className="form-group">
              <label htmlFor="event-type">Tipo de Evento</label>
              <select id="event-type" name="type">
                <option value="study">Sesión de Estudio</option>
                <option value="exam">Examen</option>
                <option value="task">Tarea/Entrega</option>
              </select>
            </div>
            <div className="flex-group">
              <div className="form-group">
                <label htmlFor="event-date">Fecha</label>
                <input type="date" id="event-date" name="date" required />
              </div>
              <div className="form-group">
                <label htmlFor="event-time">Hora</label>
                <input type="time" id="event-time" name="time" />
              </div>
            </div>
            <button type="submit" className="add-event-btn">
              <Plus size={18} />
              Programar Evento
            </button>
          </form>
        </div>

        {/* Upcoming Tasks List */}
        <div className="upcoming-panel">
          <h2 className="panel-title">
            <Clock className="panel-icon" /> Próximas Tareas
          </h2>
          <ul className="upcoming-list">
            <li className="upcoming-item">
              <div className="item-icon task">
                <AlertCircle size={20} />
              </div>
              <div className="item-details">
                <span className="item-title">Entregar ensayo de Química</span>
                <span className="item-date">lunes, 15 de septiembre</span>
              </div>
              <span className="item-time">18:00h</span>
            </li>
            <li className="upcoming-item">
              <div className="item-icon study">
                <BookOpen size={20} />
              </div>
              <div className="item-details">
                <span className="item-title">Estudiar Historia de España</span>
                <span className="item-date">jueves, 12 de septiembre</span>
              </div>
              <span className="item-time">09:00h</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudySchedule;
