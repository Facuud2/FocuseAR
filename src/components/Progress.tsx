import { useContext, useEffect, useMemo, useState } from 'react';
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
import { AuthContext } from '../hooks/authContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import type { SessionDoc } from '../utils/stats';
import { isTimestamp } from '../utils/stats';
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
  const [hoursStudied, setHoursStudied] = useState(0);
  const [avgSessionTime, setAvgSessionTime] = useState(0);
  const [taskCompletionRate] = useState(85);
  const [pomodoroCyclesPerDay, setPomodoroCyclesPerDay] = useState(0);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

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

  // helper para agrupar por día (Lun..Dom)
  function hoursPerDayFromSessions(sessions: SessionDoc[]) {
    const hours = new Array(7).fill(0);
    let totalMinutes = 0;
    for (const s of sessions) {
      let date: Date;
      if (isTimestamp(s.completedAt)) {
        date = s.completedAt.toDate();
      } else {
        date = new Date(s.completedAt as Date | string | number);
      }
      // Convert JS getDay (0=Dom,1=Lun...) to index 0=Mon..6=Sun
      const idx = (date.getDay() + 6) % 7;
      const minutes =
        typeof s.durationMinutes === 'number' ? s.durationMinutes : 25; // assume 25 min if missing
      hours[idx] += minutes / 60;
      totalMinutes += minutes;
    }
    return { hours, totalMinutes };
  }

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const since = Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );

    const globalCol = collection(db, 'studySessions');
    const globalQ = query(
      globalCol,
      where('userId', '==', user.uid),
      where('completedAt', '>=', since),
      orderBy('completedAt', 'desc'),
    );
    const unsubGlobal = onSnapshot(
      globalQ,
      (snap) => {
        const docs: SessionDoc[] = [];
        snap.forEach((d) => docs.push(d.data() as SessionDoc));
        const { hours, totalMinutes } = hoursPerDayFromSessions(docs);
        setWeeklyStudyData({
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          datasets: [
            {
              label: 'Horas Estudiadas',
              data: hours,
              backgroundColor: 'rgba(66, 133, 244, 0.6)',
              borderColor: 'rgba(66, 133, 244, 1)',
              borderWidth: 1,
            },
          ],
        });
        setHoursStudied(Math.round((totalMinutes / 60) * 10) / 10);
        setAvgSessionTime(
          docs.length ? Math.round(totalMinutes / docs.length / 6) / 10 : 0,
        ); // hours approx (minutes/60 -> simplified)
        setPomodoroCyclesPerDay(Math.round((docs.length / 7) * 10) / 10);
        setLoading(false);
      },
      (err) => {
        console.warn('Error subscripción Progress:', err);
        setLoading(false);
      },
    );

    // also try user subcollection and prefer it if it has docs
    const userCol = collection(db, 'users', user.uid, 'studySessions');
    const userQ = query(
      userCol,
      where('completedAt', '>=', since),
      orderBy('completedAt', 'desc'),
    );
    const unsubUser = onSnapshot(
      userQ,
      (snap) => {
        if (!snap.empty) {
          const docs: SessionDoc[] = [];
          snap.forEach((d) => docs.push(d.data() as SessionDoc));
          const { hours, totalMinutes } = hoursPerDayFromSessions(docs);
          setWeeklyStudyData({
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [
              {
                label: 'Horas Estudiadas',
                data: hours,
                backgroundColor: 'rgba(66, 133, 244, 0.6)',
                borderColor: 'rgba(66, 133, 244, 1)',
                borderWidth: 1,
              },
            ],
          });
          setHoursStudied(Math.round((totalMinutes / 60) * 10) / 10);
          setAvgSessionTime(
            docs.length ? Math.round(totalMinutes / docs.length / 6) / 10 : 0,
          );
          setPomodoroCyclesPerDay(Math.round((docs.length / 7) * 10) / 10);
        }
      },
      (err) => console.warn('Error subscripción Progress user col:', err),
    );

    return () => {
      try {
        unsubGlobal();
      } catch (err) {
        console.warn('unsubGlobal error', err);
      }
      try {
        unsubUser();
      } catch (err) {
        console.warn('unsubUser error', err);
      }
    };
  }, [user]);

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
            {loading ? (
              <p className="chart-description">Cargando datos...</p>
            ) : (
              <Bar data={weeklyStudyData} options={chartOptions} />
            )}
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
              <span className="metric-value">
                {avgSessionTime ? avgSessionTime.toFixed(1) : '0.0'}h
              </span>
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
                {pomodoroCyclesPerDay ? pomodoroCyclesPerDay.toFixed(1) : '0.0'}
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
