import { useState, useEffect, useMemo } from 'react';
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
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';
import type { StudyPlan } from '../services/DatabaseService';
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
  const { user } = useAuth();
  const {
    getUserStudyPlans,
    loading: dbLoading,
    error: dbError,
  } = useDatabase();
  const { theme } = useTheme();

  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [weeklyStudyData, setWeeklyStudyData] = useState<ChartData>({
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Horas Estudiadas',
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(66, 133, 244, 0.6)',
        borderColor: 'rgba(66, 133, 244, 1)',
        borderWidth: 1,
      },
    ],
  });
  const [subjectDistributionData, setSubjectDistributionData] =
    useState<ChartData>({
      labels: [],
      datasets: [
        {
          label: 'Horas',
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1,
        },
      ],
    });
  const [avgSessionTime, setAvgSessionTime] = useState(0);
  const [taskCompletionRate, setTaskCompletionRate] = useState(0);
  const [pomodoroCyclesPerDay, setPomodoroCyclesPerDay] = useState(0);
  const [totalPomodoroCycles, setTotalPomodoroCycles] = useState(0);
  const [totalFocusedTime, setTotalFocusedTime] = useState(0);
  const [mostProductiveDay, setMostProductiveDay] = useState('');

  useEffect(() => {
    const fetchStudyData = async () => {
      if (user) {
        const plans = await getUserStudyPlans();
        if (plans) {
          setStudyPlans(plans);
        }
      }
    };
    fetchStudyData();
  }, [user, getUserStudyPlans]);

  useEffect(() => {
    if (studyPlans.length > 0) {
      processStudyPlans(studyPlans);
    }
  }, [studyPlans]);

  const processStudyPlans = (plans: StudyPlan[]) => {
    let totalHoursStudied = 0;
    const weeklyHours: { [key: number]: number } = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };
    const subjectHours: { [key: string]: number } = {};
    let totalTasks = 0;
    let completedTasks = 0;
    let totalSessions = 0;
    let pomodoroCycles = 0;
    const completedDays: Set<string> = new Set();
    const dailyHours: { [key: string]: number } = {};

    plans.forEach((plan) => {
      const titleParts = plan.generatedPlan?.title?.split(' - ');
      const subjectName =
        titleParts && titleParts.length > 1
          ? titleParts[1].trim()
          : 'Materia Desconocida';

      if (plan.generatedPlan?.structuredPlan?.days) {
        plan.generatedPlan.structuredPlan.days.forEach((day) => {
          if (day.completed) {
            const timeMatch = day.totalTime.match(/(\d+(\.\d+)?)\s*horas?/i);
            if (timeMatch && timeMatch[1]) {
              const hours = parseFloat(timeMatch[1]);
              totalHoursStudied += hours;
              const date = new Date(day.date);
              const dayOfWeek = date.getDay();
              weeklyHours[dayOfWeek] = (weeklyHours[dayOfWeek] || 0) + hours;

              const dayString = date.toLocaleDateString('es-ES', {
                weekday: 'long',
              });
              dailyHours[dayString] = (dailyHours[dayString] || 0) + hours;
            }
          }

          if (subjectName && day.completed) {
            const timeMatch = day.totalTime.match(/(\d+(\.\d+)?)\s*horas?/i);
            if (timeMatch && timeMatch[1]) {
              const hours = parseFloat(timeMatch[1]);
              subjectHours[subjectName] =
                (subjectHours[subjectName] || 0) + hours;
            }
          }

          if (plan.generatedPlan.dailyTasks) {
            plan.generatedPlan.dailyTasks.forEach((task) => {
              totalTasks++;
              if (task.completed) {
                completedTasks++;
                pomodoroCycles++;
                completedDays.add(new Date(day.date).toDateString());
              }
            });
          }
          totalSessions++;
        });
      }
    });

    setTotalFocusedTime(totalHoursStudied);
    setTotalPomodoroCycles(pomodoroCycles);

    if (Object.keys(dailyHours).length > 0) {
      const mostProductive = Object.entries(dailyHours).reduce((a, b) =>
        a[1] > b[1] ? a : b,
      )[0];
      setMostProductiveDay(mostProductive);
    }

    setWeeklyStudyData({
      labels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      datasets: [
        {
          label: 'Horas Estudiadas',
          data: [
            weeklyHours[0],
            weeklyHours[1],
            weeklyHours[2],
            weeklyHours[3],
            weeklyHours[4],
            weeklyHours[5],
            weeklyHours[6],
          ],
          backgroundColor: 'rgba(66, 133, 244, 0.6)',
          borderColor: 'rgba(66, 133, 244, 1)',
          borderWidth: 1,
        },
      ],
    });

    const subjectLabels = Object.keys(subjectHours);
    const subjectData = Object.values(subjectHours);
    const backgroundColors = subjectLabels.map(
      (_, index) => `hsl(${index * 60}, 70%, 60%)`,
    );
    const borderColors = subjectLabels.map(
      (_, index) => `hsl(${index * 60}, 70%, 50%)`,
    );

    setSubjectDistributionData({
      labels: subjectLabels,
      datasets: [
        {
          label: 'Horas',
          data: subjectData,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    });

    setAvgSessionTime(
      totalSessions > 0 ? totalHoursStudied / totalSessions : 0,
    );
    setTaskCompletionRate(
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    );
    setPomodoroCyclesPerDay(
      completedDays.size > 0 ? pomodoroCycles / completedDays.size : 0,
    );
  };

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

  if (dbLoading) {
    return <div className="analytics-container">Cargando analíticas...</div>;
  }

  if (dbError) {
    return (
      <div className="analytics-container">
        Error al cargar las analíticas: {dbError}
      </div>
    );
  }

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
