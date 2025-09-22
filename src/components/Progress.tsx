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
import { TrendingUp, BarChart, PieChart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';
import type { StudyPlan } from '../services/DatabaseService';
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import './Progress.css'; // Import the new CSS file

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
  const { user } = useAuth();
  const {
    getUserStudyPlans,
    loading: dbLoading,
    error: dbError,
  } = useDatabase();
  const { theme } = useTheme(); // Get current theme

  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const monthlyGoal = 100; // Default monthly goal
  const [hoursStudied, setHoursStudied] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
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
    }; // 0 for Sunday, 1 for Monday, etc.
    const subjectHours: { [key: string]: number } = {};
    let totalTasks = 0;
    let completedTasks = 0;
    let totalSessions = 0;
    let totalPomodoroCycles = 0;
    const completedDays: Set<string> = new Set(); // To track unique days with completed tasks

    plans.forEach((plan) => {
      // Extract subject name from the plan's title
      const titleParts = plan.generatedPlan?.title?.split(' - ');
      const subjectName =
        titleParts && titleParts.length > 1
          ? titleParts[1].trim()
          : 'Materia Desconocida';

      if (plan.generatedPlan?.structuredPlan?.days) {
        plan.generatedPlan.structuredPlan.days.forEach((day) => {
          // Calculate total hours studied and weekly distribution
          if (day.completed) {
            const timeMatch = day.totalTime.match(/(\d+(\.\d+)?)\s*horas?/i);
            if (timeMatch && timeMatch[1]) {
              const hours = parseFloat(timeMatch[1]);
              totalHoursStudied += hours;
              const date = new Date(day.date);
              const dayOfWeek = date.getDay(); // 0-6, Sunday is 0
              weeklyHours[dayOfWeek] = (weeklyHours[dayOfWeek] || 0) + hours;
            }
          }

          // Calculate subject distribution
          if (subjectName && day.completed) {
            const timeMatch = day.totalTime.match(/(\d+(\.\d+)?)\s*horas?/i);
            if (timeMatch && timeMatch[1]) {
              const hours = parseFloat(timeMatch[1]);
              subjectHours[subjectName] =
                (subjectHours[subjectName] || 0) + hours;
            }
          }

          // Calculate task completion rate and pomodoro cycles
          if (plan.generatedPlan.dailyTasks) {
            plan.generatedPlan.dailyTasks.forEach((task) => {
              totalTasks++;
              if (task.completed) {
                completedTasks++;
                totalPomodoroCycles++;
                // Use the day's date for pomodoro cycle tracking
                completedDays.add(new Date(day.date).toDateString());
              }
            });
          }
          totalSessions++; // Each day in a structured plan is a session
        });
      }
    });

    setHoursStudied(totalHoursStudied);
    setProgressPercentage((totalHoursStudied / monthlyGoal) * 100);

    // Update weekly study data
    setWeeklyStudyData({
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [
        {
          label: 'Horas Estudiadas',
          data: [
            weeklyHours[1], // Monday
            weeklyHours[2], // Tuesday
            weeklyHours[3], // Wednesday
            weeklyHours[4], // Thursday
            weeklyHours[5], // Friday
            weeklyHours[6], // Saturday
            weeklyHours[0], // Sunday
          ],
          backgroundColor: 'rgba(66, 133, 244, 0.6)',
          borderColor: 'rgba(66, 133, 244, 1)',
          borderWidth: 1,
        },
      ],
    });

    // Update subject distribution data
    const subjectLabels = Object.keys(subjectHours);
    const subjectData = Object.values(subjectHours);
    const backgroundColors = subjectLabels.map(
      (_, index) => `hsl(${index * 60}, 70%, 60%)`,
    ); // Generate distinct colors
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

    // Calculate average session time (simple average for now)
    setAvgSessionTime(
      totalSessions > 0 ? totalHoursStudied / totalSessions : 0,
    );

    // Calculate task completion rate
    setTaskCompletionRate(
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    );

    // Calculate average pomodoro cycles per day
    setPomodoroCyclesPerDay(
      completedDays.size > 0 ? totalPomodoroCycles / completedDays.size : 0,
    );
  };

  const weeklyStudyOptions = useMemo(() => {
    const textColor = theme === 'dark' ? '#e0e0e0' : '#333';
    const gridColor =
      theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    return {
      responsive: true,
      plugins: {
        legend: { position: 'top' as const, labels: { color: textColor } },
        title: { display: false, text: 'Tiempo de Estudio Semanal' },
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

  const subjectDistributionOptions = useMemo(() => {
    const textColor = theme === 'dark' ? '#e0e0e0' : '#333';

    return {
      responsive: true,
      plugins: {
        legend: { position: 'top' as const, labels: { color: textColor } },
        title: { display: false, text: 'Distribución por Materia' },
      },
    };
  }, [theme]);

  if (dbLoading) {
    return <div className="progress-containers">Cargando progreso...</div>;
  }

  if (dbError) {
    return (
      <div className="progress-containers">
        Error al cargar el progreso: {dbError}
      </div>
    );
  }

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
        {/* Sección de Analíticas y Gráficos */}
        <div className="analytics-panel">
          <h2 className="panel-title">
            <BarChart className="panel-icon" />
            Análisis de Estudio
          </h2>
          <div className="chart-wrapper">
            <h3 className="chart-title-text">Tiempo de Estudio Semanal</h3>
            <Bar data={weeklyStudyData} options={weeklyStudyOptions} />
            <p className="chart-description">
              Distribución de horas estudiadas por día de la semana.
            </p>
          </div>
          <div className="chart-wrapper">
            <h3 className="chart-title-text">Distribución por Materia</h3>
            <Doughnut
              data={subjectDistributionData}
              options={subjectDistributionOptions}
            />
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
