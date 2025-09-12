import React, { useState } from 'react';
import './AIPlanner.css';
import { Sparkles, Calendar, Search, FileText } from 'lucide-react';

// Datos de ejemplo para planes anteriores
const previousPlans = [
  { id: 1, title: 'Plan de Refuerzo de Matemáticas', date: 'Octubre 2025' },
  { id: 2, title: 'Preparación para Examen Final', date: 'Diciembre 2025' },
];

const AIPlanner = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [formData, setFormData] = useState({
    goal: '',
    subjects: '',
    dateRange: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setPlanGenerated(false);

    // Simula el tiempo de generación del plan
    setTimeout(() => {
      setIsGenerating(false);
      setPlanGenerated(true);
    }, 2000);
  };

  return (
    <div className="ai-planner-container">
      <header className="ai-planner-header">
        <h1 className="ai-planner-title">Planificador IA</h1>
        <p className="ai-planner-subtitle">
          Genera un plan de estudio mensual personalizado basado en tus
          objetivos, materias y disponibilidad.
        </p>
      </header>

      <div className="ai-planner-main-content">
        {/* Panel de Formulario */}
        <div className="planner-form-panel">
          <h2 className="panel-title">
            <Sparkles className="panel-icon" />
            Configura tu Plan
          </h2>
          <form className="planner-form" onSubmit={handleGeneratePlan}>
            <div className="form-group">
              <label htmlFor="goal">Mi objetivo principal es:</label>
              <textarea
                id="goal"
                name="goal"
                rows={3}
                placeholder="Ej: Prepararme para el examen final de física del 20 de septiembre."
                value={formData.goal}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="subjects">Materias a incluir:</label>
              <input
                type="text"
                id="subjects"
                name="subjects"
                placeholder="Ej: Física, Álgebra, Inglés"
                value={formData.subjects}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dateRange">Periodo del plan:</label>
              <input
                type="text"
                id="dateRange"
                name="dateRange"
                placeholder="Ej: Septiembre 2025"
                value={formData.dateRange}
                onChange={handleInputChange}
                required
              />
            </div>
            <button
              type="submit"
              className="generate-plan-btn"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generando...' : 'Generar Plan'}
            </button>
          </form>
        </div>

        {/* Panel de Visualización del Plan */}
        <div className="plan-display-panel">
          <h2 className="panel-title">
            <Calendar className="panel-icon" />
            Plan de Estudio Generado
          </h2>
          <div className="plan-content">
            {isGenerating && (
              <div className="loading-state">
                <div className="loader"></div>
                <p>La IA está creando tu plan...</p>
              </div>
            )}
            {planGenerated && !isGenerating && (
              <div className="generated-plan-details">
                <h3>Plan de Estudio: **Preparación para Examen Final**</h3>
                <p>
                  <strong>Periodo:</strong> Septiembre 2025
                </p>
                <div className="plan-section">
                  <h4>Día 1: **Física**</h4>
                  <ul>
                    <li>**10:00 - 11:30**: Repaso de Mecánica Clásica</li>
                    <li>**11:30 - 12:00**: Ejercicios prácticos</li>
                  </ul>
                </div>
                <div className="plan-section">
                  <h4>Día 2: **Álgebra**</h4>
                  <ul>
                    <li>**14:00 - 15:30**: Teoría de Ecuaciones Lineales</li>
                    <li>**15:30 - 16:00**: Resolución de problemas</li>
                  </ul>
                </div>
              </div>
            )}
            {!isGenerating && !planGenerated && (
              <div className="empty-state">
                <Search size={48} className="empty-state-icon" />
                <p>Tu plan personalizado aparecerá aquí.</p>
                <small>Ingresa tus datos y haz clic en "Generar Plan".</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel de Historial */}
      <div className="plan-history-panel">
        <h2 className="panel-title">
          <FileText className="panel-icon" />
          Historial de Planes
        </h2>
        <ul className="history-list">
          {previousPlans.map((plan) => (
            <li key={plan.id} className="history-item">
              <p className="history-title">{plan.title}</p>
              <span className="history-date">{plan.date}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AIPlanner;
