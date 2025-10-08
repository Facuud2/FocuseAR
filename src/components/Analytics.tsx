import { useContext, useMemo, useState, useEffect } from 'react';
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
  const { user } = useContext(AuthContext);
  const [avgSessionTime, setAvgSessionTime] = useState(0);
  const [taskCompletionRate] = useState(85);
  const [pomodoroCyclesPerDay, setPomodoroCyclesPerDay] = useState(0);
  const [totalPomodoroCycles, setTotalPomodoroCycles] = useState(0);
  const [totalFocusedTime, setTotalFocusedTime] = useState(0);
  const [mostProductiveDay, setMostProductiveDay] = useState('—');
  const [loading, setLoading] = useState(false);

  // Estado para los datos de los gráficos
  const [weeklyStudyData, setWeeklyStudyData] = useState<ChartData>({
    labels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
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

  function hoursPerDayFromSessionsDomFirst(sessions: SessionDoc[]) {
    const hours = new Array(7).fill(0);
    const counts = new Array(7).fill(0);
    let totalMinutes = 0;
    for (const s of sessions) {
      let date: Date;
      if (isTimestamp(s.completedAt)) {
        date = s.completedAt.toDate();
      } else {
        date = new Date(s.completedAt as Date | string | number);
      }
      const idx = date.getDay(); // 0=Dom..6=Sáb
      const minutes =
        typeof s.durationMinutes === 'number' ? s.durationMinutes : 25;
      hours[idx] += minutes / 60;
      counts[idx] += 1;
      totalMinutes += minutes;
    }
    return { hours, counts, totalMinutes };
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
        const { hours, totalMinutes } = hoursPerDayFromSessionsDomFirst(docs);
        setWeeklyStudyData({
          labels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
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
        setTotalFocusedTime(Math.round((totalMinutes / 60) * 10) / 10);
        setTotalPomodoroCycles(docs.length);
        setAvgSessionTime(
          docs.length ? Math.round((totalMinutes / docs.length) * 10) / 10 : 0,
        );
        // día más productivo por horas
        const maxIdx = hours.indexOf(Math.max(...hours));
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        setMostProductiveDay(dayNames[maxIdx] || '—');
        setPomodoroCyclesPerDay(Math.round((docs.length / 7) * 10) / 10);
        setLoading(false);
      },
      (err) => {
        console.warn('Error suscripción Analytics:', err);
        setLoading(false);
      },
    );

    // user subcollection override
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
          const { hours, totalMinutes } = hoursPerDayFromSessionsDomFirst(docs);
          setWeeklyStudyData({
            labels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
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
          setTotalFocusedTime(Math.round((totalMinutes / 60) * 10) / 10);
          setTotalPomodoroCycles(docs.length);
          setAvgSessionTime(
            docs.length
              ? Math.round((totalMinutes / docs.length) * 10) / 10
              : 0,
          );
          const maxIdx = hours.indexOf(Math.max(...hours));
          const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          setMostProductiveDay(dayNames[maxIdx] || '—');
          setPomodoroCyclesPerDay(Math.round((docs.length / 7) * 10) / 10);
        }
      },
      (err) => console.warn('Error subscripción Analytics user col:', err),
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
            {loading ? (
              <p className="chart-description">Cargando...</p>
            ) : (
              <Bar data={weeklyStudyData} options={chartOptions} />
            )}
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
              <span>
                {totalFocusedTime ? totalFocusedTime.toFixed(1) : '0.0'}h
              </span>
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
