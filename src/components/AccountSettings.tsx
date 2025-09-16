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

// Define un tipo para las claves de los planes.
type PlanKey = 'monthly' | 'annual' | 'lifetime';

const plans = {
  monthly: {
    title: 'Plan Mensual',
    price: '$9.99/mes',
    description: 'Ideal para pruebas a corto plazo.',
    benefits: [
      'Acceso a todas las funciones de IA',
      'Analíticas de progreso detalladas',
      'Soporte por correo electrónico',
    ],
  },
  annual: {
    title: 'Plan Anual',
    price: '$99.99/año',
    description: 'Ahorra un 15% en comparación con el plan mensual.',
    benefits: [
      'Todo lo del Plan Mensual',
      'Soporte prioritario',
      'Informes trimestrales de desempeño',
      'Acceso a nuevas funciones en beta',
    ],
  },
  lifetime: {
    title: 'Plan de por Vida',
    price: '$249.99',
    description: 'Acceso completo de por vida. ¡Un único pago!',
    benefits: [
      'Todo lo del Plan Anual',
      'Acceso a eventos exclusivos para miembros',
      'Consultas personalizadas con asesores académicos',
      '¡Nunca más te preocupes por renovaciones!',
    ],
  },
};

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [availability, setAvailability] = useState(initialAvailability);
  // Usa el nuevo tipo para el estado
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const handleAvailabilityChange = (day: string) => {
    setAvailability((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  // Asegúrate de que el argumento también sea de tipo PlanKey
  const handleSelectPlan = (plan: PlanKey) => {
    setSelectedPlan(plan);
    setShowBenefitsModal(true);
  };

  const handleConfirmPlan = () => {
    setShowBenefitsModal(false);
    setShowCheckoutModal(true);
  };

  const closeModal = () => {
    setShowBenefitsModal(false);
    setShowCheckoutModal(false);
    setSelectedPlan(null);
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

      case 'membership':
        return (
          <>
            <div className="settings-section">
              <h3 className="settings-section-title">Membresía Premium</h3>
              <p className="settings-section-subtitle">
                Accede a funciones exclusivas, analíticas avanzadas y soporte
                prioritario.
              </p>
              <div className="membership-plans-container">
                <div className="plan-card">
                  <h4>{plans.monthly.title}</h4>
                  <p className="plan-price">{plans.monthly.price}</p>
                  <p className="plan-description">
                    {plans.monthly.description}
                  </p>
                  <button
                    className="plan-btn"
                    onClick={() => handleSelectPlan('monthly')}
                  >
                    Seleccionar
                  </button>
                </div>
                <div className="plan-card featured-plan">
                  <h4>{plans.annual.title}</h4>
                  <p className="plan-price">{plans.annual.price}</p>
                  <p className="plan-description">{plans.annual.description}</p>
                  <button
                    className="plan-btn"
                    onClick={() => handleSelectPlan('annual')}
                  >
                    Seleccionar
                  </button>
                </div>
                <div className="plan-card">
                  <h4>{plans.lifetime.title}</h4>
                  <p className="plan-price">{plans.lifetime.price}</p>
                  <p className="plan-description">
                    {plans.lifetime.description}
                  </p>
                  <button
                    className="plan-btn"
                    onClick={() => handleSelectPlan('lifetime')}
                  >
                    Seleccionar
                  </button>
                </div>
              </div>
            </div>
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
          <button
            className={`tab-button ${activeTab === 'membership' ? 'active' : ''}`}
            onClick={() => setActiveTab('membership')}
          >
            Membresía Premium
          </button>
        </div>
        <div className="tab-content">{renderContent()}</div>
      </div>

      {showBenefitsModal && selectedPlan && (
        <div className="checkout-overlay">
          <div className="checkout-modal">
            <button className="checkout-close" onClick={closeModal}>
              &times;
            </button>
            <div className="benefits-content">
              <h3>Beneficios del {plans[selectedPlan].title}</h3>
              <p>Precio: {plans[selectedPlan].price}</p>
              <ul>
                {plans[selectedPlan].benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
              <button className="save-btn" onClick={handleConfirmPlan}>
                Continuar con el pago
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckoutModal && (
        <div className="checkout-overlay">
          <div className="checkout-modal">
            <button className="checkout-close" onClick={closeModal}>
              &times;
            </button>
            {/* From Uiverse.io by SSpisso */}
            <div className="container">
              <div className="card cart">
                <label className="title">CHECKOUT</label>
                <div className="steps">
                  <div className="step">
                    <div>
                      <span>SHIPPING</span>
                      <p>221B Baker Street, W1U 8ED</p>
                      <p>London, United Kingdom</p>
                    </div>
                    <hr />
                    <div>
                      <span>PAYMENT METHOD</span>
                      <p>Visa</p>
                      <p>**** **** **** 4243</p>
                    </div>
                    <hr />
                    <div className="promo">
                      <span>HAVE A PROMO CODE?</span>
                      <form className="form">
                        <input
                          type="text"
                          placeholder="Enter a Promo Code"
                          className="input_field"
                        />
                        <button>Apply</button>
                      </form>
                    </div>
                    <hr />
                    <div className="payments">
                      <span>PAYMENT</span>
                      <div className="details">
                        <span>Subtotal:</span>
                        <span>$240.00</span>
                        <span>Shipping:</span>
                        <span>$10.00</span>
                        <span>Tax:</span>
                        <span>$30.40</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card checkout">
                <div className="footer">
                  <label className="price">$280.40</label>
                  <button className="checkout-btn" onClick={closeModal}>
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
