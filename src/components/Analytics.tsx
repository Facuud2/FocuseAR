import './Analytics.css';
import { LineChart, PieChart, TrendingUp, CheckCircle } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1 className="analytics-title">Análisis de Rendimiento</h1>
        <p className="analytics-subtitle">
          Obtén una visión profunda de tus hábitos de estudio y encuentra
          oportunidades de mejora.
        </p>
      </header>

      <div className="analytics-main-content">
        {/* Panel de Métricas Clave */}
        <div className="metrics-panel">
          <h2 className="panel-title">
            <TrendingUp className="panel-icon" />
            Métricas Clave
          </h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-value">1.8h</span>
              <span className="metric-label">Tiempo promedio por sesión</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">92%</span>
              <span className="metric-label">
                Tasa de finalización de tareas
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-value">4</span>
              <span className="metric-label">Ciclos Pomodoro promedio</span>
            </div>
          </div>
        </div>

        {/* Panel de Gráfico de Progreso */}
        <div className="chart-panel">
          <h2 className="panel-title">
            <LineChart className="panel-icon" />
            Evolución del Progreso
          </h2>
          <div className="line-chart-placeholder">
            {/* Placeholder para el gráfico de líneas */}
          </div>
          <p className="chart-description">
            Tendencia de tus horas de estudio totales por mes.
          </p>
        </div>
      </div>

      <div className="analytics-secondary-content">
        {/* Panel de Distribución por Materia */}
        <div className="chart-panel">
          <h2 className="panel-title">
            <PieChart className="panel-icon" />
            Distribución del Tiempo
          </h2>
          <div className="pie-chart-placeholder">
            {/* Placeholder para el gráfico circular */}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span
                className="legend-color-box"
                style={{ backgroundColor: '#4285f4' }}
              ></span>
              Matemáticas (40%)
            </div>
            <div className="legend-item">
              <span
                className="legend-color-box"
                style={{ backgroundColor: '#34a853' }}
              ></span>
              Física (25%)
            </div>
            <div className="legend-item">
              <span
                className="legend-color-box"
                style={{ backgroundColor: '#fbbc05' }}
              ></span>
              Historia (20%)
            </div>
            <div className="legend-item">
              <span
                className="legend-color-box"
                style={{ backgroundColor: '#ea4335' }}
              ></span>
              Química (15%)
            </div>
          </div>
          <p className="chart-description">
            El tiempo de estudio dedicado a cada materia.
          </p>
        </div>

        {/* Panel de Métricas de Productividad */}
        <div className="productivity-panel">
          <h2 className="panel-title">
            <CheckCircle className="panel-icon" />
            Métricas de Productividad
          </h2>
          <ul className="productivity-list">
            <li>
              <strong>Total de sesiones Pomodoro:</strong> <span>120</span>
            </li>
            <li>
              <strong>Tiempo total enfocado:</strong> <span>50h</span>
            </li>
            <li>
              <strong>Promedio de breaks:</strong> <span>5 minutos</span>
            </li>
            <li>
              <strong>Día más productivo:</strong> <span>Jueves</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
