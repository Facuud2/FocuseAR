import './Progress.css';
import { TrendingUp, BarChart, PieChart } from 'lucide-react';

const Progress = () => {
  // Datos de ejemplo para los gráficos y métricas
  const monthlyGoal = 100; // Horas objetivo
  const hoursStudied = 45;
  const progressPercentage = (hoursStudied / monthlyGoal) * 100;

  return (
    <div className="progress-container">
      <header className="progress-header">
        <h1 className="progress-title">Mi Progreso</h1>
        <p className="progress-subtitle">
          Analiza tus hábitos de estudio y visualiza tus avances a lo largo del
          tiempo.
        </p>
      </header>

      <div className="progress-main-content">
        {/* Sección de Analíticas y Gráficos */}
        <div className="analytics-panel">
          <h2 className="panel-title">
            <BarChart className="panel-icon" />
            Análisis de Estudio
          </h2>
          <div className="chart-wrapper">
            <h3 className="chart-title-text">Tiempo de Estudio Semanal</h3>
            <div className="bar-chart-placeholder">
              {/* Placeholder para el gráfico de barras */}
              <div className="bar-placeholder">Lun</div>
              <div className="bar-placeholder">Mar</div>
              <div className="bar-placeholder">Mié</div>
              <div className="bar-placeholder">Jue</div>
              <div className="bar-placeholder">Vie</div>
              <div className="bar-placeholder">Sáb</div>
              <div className="bar-placeholder">Dom</div>
            </div>
            <p className="chart-description">
              Distribución de horas estudiadas por día de la semana.
            </p>
          </div>
          <div className="chart-wrapper">
            <h3 className="chart-title-text">Distribución por Materia</h3>
            <div className="pie-chart-placeholder">
              {/* Placeholder para el gráfico circular */}
            </div>
            <p className="chart-description">
              Porcentaje del tiempo total de estudio dedicado a cada materia.
            </p>
          </div>
        </div>

        {/* Sección de Métricas y Objetivos */}
        <div className="metrics-panel">
          <h2 className="panel-title">
            <TrendingUp className="panel-icon" />
            Métricas Clave
          </h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-value">1.5h</span>
              <span className="metric-label">Tiempo promedio por sesión</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">85%</span>
              <span className="metric-label">
                Tasa de finalización de tareas
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-value">3</span>
              <span className="metric-label">Ciclos Pomodoro por día</span>
            </div>
          </div>

          <h2 className="panel-title progress-goal-title">
            <PieChart className="panel-icon" />
            Mi Objetivo Mensual
          </h2>
          <div className="progress-goal-card">
            <div className="progress-info">
              <p>
                Has estudiado **{hoursStudied} de {monthlyGoal} horas** este
                mes.
              </p>
              <span className="progress-percentage">
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
