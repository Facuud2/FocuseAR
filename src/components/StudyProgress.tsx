import { useContext, useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
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
import { isTimestamp } from '../utils/stats';
import { useTheme } from '../context/ThemeContext';
import {
  groupSessionsByDayDomFirst,
  getPercentagesFromCounts,
  getTotalSessions,
  sumDurationMinutes,
} from '../utils/stats';
import './StudyProgress.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

type SessionRecord = {
  id: string;
  userId: string;
  completedAt: Date | Timestamp | string | number;
  durationMinutes?: number;
};

const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function StudyProgress() {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

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
        const data: SessionRecord[] = [];
        snap.forEach((d) => {
          const raw = d.data();
          const docData = raw as unknown as Record<string, unknown>;
          data.push({
            id: d.id,
            userId:
              typeof docData.userId === 'string'
                ? String(docData.userId)
                : user.uid,
            completedAt: isTimestamp(docData.completedAt)
              ? docData.completedAt.toDate()
              : (docData.completedAt as Date | string | number),
            durationMinutes:
              typeof docData.durationMinutes === 'number'
                ? docData.durationMinutes
                : undefined,
          });
        });
        setSessions(data);
        setLoading(false);
      },
      (err) => {
        console.warn('Error suscripción global studySessions:', err);
        setLoading(false);
      },
    );

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
          const data: SessionRecord[] = [];
          snap.forEach((d) => {
            const raw = d.data();
            const docData = raw as unknown as Record<string, unknown>;
            data.push({
              id: d.id,
              userId: user.uid,
              completedAt: isTimestamp(docData.completedAt)
                ? docData.completedAt.toDate()
                : (docData.completedAt as Date | string | number),
              durationMinutes:
                typeof docData.durationMinutes === 'number'
                  ? docData.durationMinutes
                  : undefined,
            });
          });
          setSessions(data);
        }
      },
      (err) =>
        console.warn('Error suscripción users/{uid}/studySessions:', err),
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

  const totalThisWeek = getTotalSessions(sessions);

  const countsByDay = useMemo(
    () => groupSessionsByDayDomFirst(sessions),
    [sessions],
  );
  const percentages = useMemo(
    () => getPercentagesFromCounts(countsByDay),
    [countsByDay],
  );

  const totalFocusedMinutes = sumDurationMinutes(sessions);
  const avgMinutes =
    sessions.length > 0 ? Math.round(totalFocusedMinutes / sessions.length) : 0;

  const chartData = useMemo(
    () => ({
      labels: weekdays,
      datasets: [
        {
          label: 'Sesiones',
          data: countsByDay,
          backgroundColor:
            theme === 'dark'
              ? 'rgba(66, 133, 244, 0.9)'
              : 'rgba(66, 133, 244, 0.8)',
        },
      ],
    }),
    [countsByDay, theme],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    }),
    [],
  );

  return (
    <div className="study-progress">
      <h3>Progreso de Estudio</h3>
      {loading ? (
        <div className="sp-loading">Cargando estadísticas...</div>
      ) : sessions.length === 0 ? (
        <div className="sp-empty">No hay sesiones en los últimos 7 días.</div>
      ) : (
        <>
          <div className="sp-cards">
            <div className="sp-card">
              <div className="sp-card-title">Sesiones (últimos 7 días)</div>
              <div className="sp-card-value">{totalThisWeek}</div>
              <div className="sp-card-sub">
                Tiempo total: {Math.round(totalFocusedMinutes)} min
              </div>
              <div className="sp-card-sub">
                Promedio: {avgMinutes} min/sesión
              </div>
            </div>
            <div className="sp-card sp-card-small">
              <div className="sp-card-title">% por día</div>
              <ul className="sp-day-list">
                {weekdays.map((w, i) => (
                  <li key={w}>
                    <span className="day-name">{w}</span>
                    <span className="day-pct">{percentages[i]}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="sp-chart">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </>
      )}
    </div>
  );
}
