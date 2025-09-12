// src/components/AccountSettings.tsx

import { useState } from 'react';
import './AccountSettings.css';

// Mueve la definición del estado inicial fuera del componente.
const initialAvailability: { [key: string]: boolean } = {
  lunes: false,
  martes: true,
  miércoles: false,
  jueves: true,
  viernes: true,
  sábado: false,
  domingo: false,
};

// Array con los nombres de los días en español.
const diasSemana = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [availability, setAvailability] = useState(initialAvailability);

  const handleAvailabilityChange = (day: string) => {
    setAvailability((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <>
            <div className="settings-section">
              <h3 className="settings-section-title">Información del Perfil</h3>
              <p className="settings-section-subtitle">
                Edita tu nombre, correo electrónico y otros datos personales.
              </p>
              <form>
                <div className="flex-group">
                  <div className="form-group">
                    <label htmlFor="name">Nombre</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Tu Nombre"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastname">Apellido</label>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      placeholder="Tu Apellido"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="email">Correo Electrónico</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="tu.correo@ejemplo.com"
                  />
                </div>
                <button type="submit" className="save-btn">
                  Guardar Cambios
                </button>
              </form>
            </div>
            <div className="settings-section">
              <h3 className="settings-section-title">Cambiar Contraseña</h3>
              <p className="settings-section-subtitle">
                Actualiza tu contraseña para mantener tu cuenta segura.
              </p>
              <form>
                <div className="form-group">
                  <label htmlFor="current-password">Contraseña Actual</label>
                  <input
                    type="password"
                    id="current-password"
                    name="current-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-password">Nueva Contraseña</label>
                  <input
                    type="password"
                    id="new-password"
                    name="new-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-password">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    name="confirm-password"
                  />
                </div>
                <button type="submit" className="save-btn">
                  Actualizar Contraseña
                </button>
              </form>
            </div>
            <div className="settings-section">
              <h3 className="settings-section-title">Eliminar Cuenta</h3>
              <p className="settings-section-subtitle">
                Esto eliminará permanentemente tu cuenta y todos tus datos. Esta
                acción no se puede deshacer.
              </p>
              <button className="delete-account-btn">Eliminar Cuenta</button>
            </div>
          </>
        );

      case 'planner':
        return (
          <>
            <div className="settings-section">
              <h3 className="settings-section-title">
                Días de Estudio Disponibles
              </h3>
              <p className="settings-section-subtitle">
                Selecciona los días en los que la IA puede programar sesiones de
                estudio para ti.
              </p>
              <div className="availability-grid">
                {/* Iteramos sobre el nuevo array 'diasSemana' */}
                {diasSemana.map((day) => (
                  <button
                    key={day}
                    className={`day-button ${availability[day] ? 'active' : ''}`}
                    onClick={() => handleAvailabilityChange(day)}
                  >
                    {/* El nombre completo del día */}
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-section">
              <h3 className="settings-section-title">
                Preferencias de Estudio
              </h3>
              <p className="settings-section-subtitle">
                Indica a la IA cómo optimizar tus sesiones.
              </p>
              <div className="form-group">
                <label htmlFor="study-hours">
                  Horas de estudio diarias ideales
                </label>
                <input
                  type="number"
                  id="study-hours"
                  name="study-hours"
                  min="1"
                  max="12"
                  placeholder="Ej: 3"
                />
              </div>
              <div className="form-group">
                <label htmlFor="focus-level">Nivel de Concentración</label>
                <select id="focus-level" name="focus-level">
                  <option value="high">Alto (sesiones más largas)</option>
                  <option value="medium">
                    Medio (intervalos equilibrados)
                  </option>
                  <option value="low">
                    Bajo (sesiones cortas tipo Pomodoro)
                  </option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="prioritization">Prioridad del Plan</label>
                <select id="prioritization" name="prioritization">
                  <option value="due-dates">
                    Fecha de Entrega (se enfoca en lo más urgente)
                  </option>
                  <option value="weak-subjects">
                    Materias Débiles (más tiempo en lo que necesitas mejorar)
                  </option>
                  <option value="equal-distribution">
                    Distribución Equitativa (reparte el tiempo por igual)
                  </option>
                </select>
              </div>
            </div>
            <div className="settings-section">
              <h3 className="settings-section-title">Objetivos Académicos</h3>
              <p className="settings-section-subtitle">
                Establece tus metas para que la IA sepa qué priorizar.
              </p>
              <div className="form-group">
                <label htmlFor="target-gpa">
                  Objetivo de Calificación General (GPA)
                </label>
                <input
                  type="number"
                  id="target-gpa"
                  name="target-gpa"
                  min="1"
                  max="10"
                  step="0.1"
                  placeholder="Ej: 8.5"
                />
              </div>
              <div className="form-group">
                <label htmlFor="exam-prep">Preparación para Exámenes</label>
                <textarea
                  id="exam-prep"
                  name="exam-prep"
                  rows={3}
                  placeholder="Ej: 'Necesito reforzar álgebra y física para mi examen final del 20 de diciembre.'"
                  className="form-control" // Añade esta clase
                />
              </div>
            </div>
            <button
              className="save-btn"
              onClick={() => alert('Configuración guardada!')}
            >
              Guardar Configuración del Planificador
            </button>
          </>
        );

      case 'notifications':
        return (
          <>
            <div className="settings-section">
              <h3 className="settings-section-title">Notificaciones</h3>
              <p className="settings-section-subtitle">
                Elige cómo y cuándo quieres recibir recordatorios.
              </p>
              <div className="notification-options">
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      defaultChecked
                    />
                    Notificaciones del navegador
                  </label>
                  <p className="toggle-description">
                    Recordatorios de sesiones de estudio, próximos exámenes y
                    tareas.
                  </p>
                </div>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input type="checkbox" className="toggle-input" />
                    Alertas por correo electrónico
                  </label>
                  <p className="toggle-description">
                    Recibe resúmenes semanales de tu progreso y tareas
                    pendientes.
                  </p>
                </div>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      defaultChecked
                    />
                    Sonidos de notificación
                  </label>
                  <p className="toggle-description">
                    Reproducir un sonido cuando un temporizador finalice.
                  </p>
                </div>
              </div>
            </div>
            <button className="save-btn">
              Guardar Preferencias de Notificación
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <div className="settings-card-header">
          <h2>Configuración de la Cuenta</h2>
          <p>Gestiona la información de tu perfil, preferencias y seguridad.</p>
        </div>
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Perfil y Seguridad
          </button>
          <button
            className={`tab-button ${activeTab === 'planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('planner')}
          >
            Planificador IA
          </button>
          <button
            className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notificaciones
          </button>
        </div>
        <div className="tab-content">{renderContent()}</div>
      </div>
    </div>
  );
};

export default AccountSettings;
