import { useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { TrendingUp, BarChart, PieChart } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Progress.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor: string | string[];
    borderWidth: number;
  }[];
}

const Progress = () => {
  const { theme } = useTheme();

  // Estado para los datos
  const [monthlyGoal] = useState(100);
  const [hoursStudied] = useState(75);
  const [avgSessionTime] = useState(2.5);
  const [taskCompletionRate] = useState(85);
  const [pomodoroCyclesPerDay] = useState(6);

  const progressPercentage = (hoursStudied / monthlyGoal) * 100;

  const chartOptions = useMemo(() => {
    const textColor = theme === 'dark' ? '#e0e0e0' : '#333';
    const gridColor =
      theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    return {
      responsive: true,
      plugins: {
        legend: { position: 'top' as const, labels: { color: textColor } },
        title: { display: false },
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Horas', color: textColor },
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
      },
    };
  }, [theme]);
  // Estado para los datos de los gráficos
  const [weeklyStudyData] = useState<ChartData>({
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Horas Estudiadas',
        data: [4, 5, 3, 6, 4, 2, 1],
        backgroundColor: 'rgba(66, 133, 244, 0.6)',
        borderColor: 'rgba(66, 133, 244, 1)',
        borderWidth: 1,
      },
    ],
  });

  const [subjectDistributionData] = useState<ChartData>({
    labels: ['Matemáticas', 'Física', 'Química', 'Historia'],
    datasets: [
      {
        label: 'Horas',
        data: [20, 15, 25, 15],
        backgroundColor: [
          'hsl(0, 70%, 60%)',
          'hsl(60, 70%, 60%)',
          'hsl(120, 70%, 60%)',
          'hsl(180, 70%, 60%)',
        ],
        borderColor: [
          'hsl(0, 70%, 50%)',
          'hsl(60, 70%, 50%)',
          'hsl(120, 70%, 50%)',
          'hsl(180, 70%, 50%)',
        ],
        borderWidth: 1,
      },
    ],
  });

  return (
    <div className="progress-containers">
      <header className="progress-header">
        <h1 className="progress-title">Mi Progreso</h1>
        <p className="progress-subtitle">
          Analiza tus hábitos de estudio y visualiza tus avances a lo largo del
          tiempo.
        </p>
      </header>

      <div className="progress-main-content">
        <div className="analytics-panel">
          <h2 className="panel-title">
            <BarChart className="panel-icon" />
            Análisis de Estudio
          </h2>
          <div className="chart-wrapper">
            <h3 className="chart-title-text">Tiempo de Estudio Semanal</h3>
            <Bar data={weeklyStudyData} options={chartOptions} />
            <p className="chart-description">
              Distribución de horas estudiadas por día de la semana.
            </p>
          </div>
          <div className="chart-wrapper">
            <h3 className="chart-title-text">Distribución por Materia</h3>
            <Doughnut data={subjectDistributionData} options={chartOptions} />
            <p className="chart-description">
              Porcentaje del tiempo total de estudio dedicado a cada materia.
            </p>
          </div>
        </div>

        <div className="metrics-panel">
          <h2 className="panel-title">
            <TrendingUp className="panel-icon" />
            Métricas Clave
          </h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-value">{avgSessionTime.toFixed(1)}h</span>
              <span className="metric-label">Tiempo promedio por sesión</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">
                {taskCompletionRate.toFixed(0)}%
              </span>
              <span className="metric-label">
                Tasa de finalización de tareas
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-value">
                {pomodoroCyclesPerDay.toFixed(1)}
              </span>
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
                Has estudiado <strong>{hoursStudied.toFixed(1)}</strong> de{' '}
                <strong>{monthlyGoal}</strong> horas este mes.
              </p>
              <span className="progress-percentage">
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${progressPercentage > 100 ? 100 : progressPercentage}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
