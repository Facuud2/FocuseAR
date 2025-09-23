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
import { TrendingUp, BarChart, PieChart, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Analytics.css';

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

const Analytics = () => {
  const { theme } = useTheme();

  // Estado para las métricas
  const [avgSessionTime] = useState(2.5);
  const [taskCompletionRate] = useState(85);
  const [pomodoroCyclesPerDay] = useState(6);
  const [totalPomodoroCycles] = useState(42);
  const [totalFocusedTime] = useState(75.5);
  const [mostProductiveDay] = useState('Martes');

  // Estado para los datos de los gráficos
  const [weeklyStudyData] = useState<ChartData>({
    labels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    datasets: [
      {
        label: 'Horas Estudiadas',
        data: [2, 4, 6, 4, 5, 3, 2],
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
              <span className="metric-label">Ciclos Pomodoro promedio</span>
            </div>
          </div>
        </div>

        <div className="chart-panel">
          <h2 className="panel-title">
            <BarChart className="panel-icon" />
            Evolución del Progreso
          </h2>
          <div className="chart-wrapper">
            <Bar data={weeklyStudyData} options={chartOptions} />
          </div>
          <p className="chart-description">
            Tendencia de tus horas de estudio totales por día de la semana.
          </p>
        </div>
      </div>

      <div className="analytics-secondary-content">
        <div className="chart-panel">
          <h2 className="panel-title">
            <PieChart className="panel-icon" />
            Distribución del Tiempo
          </h2>
          <div className="chart-wrapper">
            <Doughnut
              data={subjectDistributionData}
              options={{ ...chartOptions, scales: {} }}
            />
          </div>
          <p className="chart-description">
            El tiempo de estudio dedicado a cada materia.
          </p>
        </div>

        <div className="productivity-panel">
          <h2 className="panel-title">
            <CheckCircle className="panel-icon" />
            Métricas de Productividad
          </h2>
          <ul className="productivity-list">
            <li>
              <strong>Total de sesiones Pomodoro:</strong>{' '}
              <span>{totalPomodoroCycles}</span>
            </li>
            <li>
              <strong>Tiempo total enfocado:</strong>{' '}
              <span>{totalFocusedTime.toFixed(1)}h</span>
            </li>
            <li>
              <strong>Día más productivo:</strong>{' '}
              <span>{mostProductiveDay}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
