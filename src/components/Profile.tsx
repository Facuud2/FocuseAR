// src/components/Profile.tsx
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../hooks/authContext';
import { useDatabase } from '../hooks/useDatabase';
import { Link } from 'react-router-dom';
// Importamos iconos adicionales para un look más futurista
import {
  User,
  Award,
  Clock,
  BookOpen,
  Settings,
  ArrowRight,
  TrendingUp,
  Zap,
  Atom,
  Globe,
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user } = useContext(AuthContext);

  // Estados para métricas
  const [streakDays, setStreakDays] = useState<number>(0);
  const [totalHoursThisMonth, setTotalHoursThisMonth] = useState<number>(0);
  const [activeSubjectsCount, setActiveSubjectsCount] = useState<number>(0);
  const [studyPlansCount, setStudyPlansCount] = useState<number>(0);
  const [weeklyProgress, setWeeklyProgress] = useState<number[]>(
    new Array(7).fill(0),
  );
  const [weeklyCountsState, setWeeklyCountsState] = useState<number[]>(
    new Array(7).fill(0),
  );

  const {
    getPomodoroCyclesCount,
    getActiveSubjectsCount,
    getStudyPlansCount,
    getUserProfile,
    getUserStreakDays,
    getWeeklyCounts,
  } = useDatabase();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<{
    displayName?: string;
    email?: string;
    photoURL?: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const cycles = await getPomodoroCyclesCount();
        // Cada ciclo = 25 minutos
        const totalMinutes = cycles * 25;
        const hours = totalMinutes / 60;
        if (mounted) {
          setTotalHoursThisMonth(hours);
        }

        const subjects = await getActiveSubjectsCount();
        if (mounted) setActiveSubjectsCount(subjects);

        const plansCount = await getStudyPlansCount();
        if (mounted) setStudyPlansCount(plansCount);
        // Obtener racha y progreso semanal
        try {
          const streak = await getUserStreakDays?.();
          const counts: number[] =
            (await getWeeklyCounts?.('calendar')) || new Array(7).fill(0);
          const weekly = counts.map((c: number) => Math.min(c / 4, 1));
          if (mounted) {
            setStreakDays(typeof streak === 'number' ? streak : 0);
            setWeeklyProgress(
              weekly.length === 7 ? weekly : new Array(7).fill(0),
            );
            setWeeklyCountsState(
              counts.length === 7 ? counts : new Array(7).fill(0),
            );
          }
        } catch (e) {
          console.warn('No se pudo calcular racha o progreso semanal:', e);
        }
        // Cargar perfil guardado en Firestore (si existe)
        try {
          const profile = await getUserProfile?.();
          if (mounted && profile) {
            setProfileData({
              displayName: profile.displayName || undefined,
              email: profile.email || undefined,
              photoURL: profile.photoURL || undefined,
            });
          }
        } catch (e) {
          console.warn('No se pudo cargar profile desde Firestore:', e);
        }
        if (mounted) setIsLoading(false);
      } catch (e) {
        console.warn('Error cargando métricas del perfil:', e);
        if (mounted) setIsLoading(false);
      }
    };
    load();

    // Listener para actualizar métricas cuando se registra un ciclo Pomodoro en otra parte de la app
    const onPomodoroRecorded = async () => {
      try {
        const streak = await getUserStreakDays?.();
        const counts: number[] =
          (await getWeeklyCounts?.('calendar')) || new Array(7).fill(0);
        const weekly = counts.map((c: number) => Math.min(c / 4, 1));
        if (mounted) {
          setStreakDays(typeof streak === 'number' ? streak : 0);
          setWeeklyProgress(
            weekly.length === 7 ? weekly : new Array(7).fill(0),
          );
          setWeeklyCountsState(
            counts.length === 7 ? counts : new Array(7).fill(0),
          );
        }
      } catch (e) {
        console.warn(
          'Error refrescando métricas por evento pomodoro:recorded',
          e,
        );
      }
    };

    window.addEventListener(
      'pomodoro:recorded',
      onPomodoroRecorded as EventListener,
    );
    return () => {
      mounted = false;
      window.removeEventListener(
        'pomodoro:recorded',
        onPomodoroRecorded as EventListener,
      );
    };
  }, [getPomodoroCyclesCount, getActiveSubjectsCount, getStudyPlansCount]);

  const aiInsight = {
    title: 'Análisis Predictivo de Rendimiento',
    message:
      'Basado en tu ritmo actual, el modelo de IA predice que alcanzarás el 90% de dominio en Álgebra Lineal en los próximos 18 días. ¡Mantén el enfoque!',
    recommendation:
      'Considera una sesión de repaso profundo este jueves a las 19:00.',
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1 className="profile-title">
          <span className="gradient-text">Mi</span>
          <span className="gradient-text-alt"> Perfil</span>
        </h1>
        <p className="profile-subtitle">
          Explora tu universo de estudio. Impulsado por IA.
        </p>
      </header>

      <div className="profile-main-content">
        {/* Panel Principal: Información de Usuario y Progreso Holográfico */}
        <div className="profile-hero-panel">
          <div className="hero-background-effect"></div>{' '}
          {/* ¡NUEVO! Para efectos de partículas/glitch */}
          <div className="hero-content">
            {/* ¡MÁS SPICY! Avatar con marco futurista */}
            <div className="user-avatar-frame">
              {profileData?.photoURL || user?.photoURL ? (
                <img
                  src={profileData?.photoURL ?? user?.photoURL ?? ''}
                  alt={`${profileData?.displayName || user?.displayName || 'Avatar'} avatar`}
                  className="user-avatar-lg"
                />
              ) : (
                <div className="user-avatar-placeholder-lg">
                  <User size={64} />
                </div>
              )}
            </div>
            <div className="user-details-lg">
              <h3 className="user-name-lg">
                {profileData?.displayName || user?.displayName || 'Explorador'}
              </h3>
              {/* Mostrar email si lo tenemos */}
              {isLoading ? (
                <p className="user-email-loading">Cargando información...</p>
              ) : (
                <p className="user-email" aria-live="polite">
                  {profileData?.email || user?.email || ''}
                </p>
              )}
              {/* ¡NUEVO! Estado cool */}
              <div className="study-streak glow-effect">
                {' '}
                {/* ¡MÁS SPICY! Efecto glow */}
                <Award size={24} className="streak-icon" />
                <span className="streak-text">
                  Racha: <strong>{streakDays} días</strong>
                </span>
              </div>
            </div>
          </div>
          {/* ¡NUEVO! Gráfico holográfico de progreso (visual placeholder) */}
          <div className="holographic-progress">
            <h4>
              Dominio Semanal <Zap size={16} />
            </h4>
            <div className="progress-graph" aria-hidden="false">
              {weeklyProgress.map((value: number, index: number) => {
                const count = weeklyCountsState[index] ?? 0;
                // Normalize height relative to max count or target (use target=4 as baseline)
                const heightPercent = Math.min((count / 4) * 100, 100);
                return (
                  <div key={index} className="progress-bar-wrapper">
                    <div
                      className="progress-bar"
                      style={{ height: `${heightPercent}%` }}
                      title={`Día ${index + 1}: ${count} ciclos (${Math.round(value * 100)}%)`}
                    />
                  </div>
                );
              })}
            </div>
            {/* day labels moved outside of the graph container to keep graph exclusive */}
            <div
              className="progress-graph-days"
              role="list"
              aria-label="Días de la semana"
            >
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => (
                <div key={i} className="progress-bar-day" role="listitem">
                  {d}
                </div>
              ))}
            </div>
            <p className="graph-label">Actividad esta semana (Lun→Dom)</p>
          </div>
        </div>

        {/* Panel de Estadísticas con diseño neuromórfico/flotante */}
        <div className="stats-panel">
          <h2 className="panel-title">
            <TrendingUp className="panel-icon" />
            Métricas del Viaje
          </h2>
          <div className="stats-grid">
            {/* ¡MÁS SPICY! Stat Card con efecto hover */}
            <div className="stat-card stat-card-neumorphic">
              <div className="stat-icon-wrapper pulse-effect">
                <Clock size={32} />
              </div>
              <div className="stat-info">
                <span className="stat-value">
                  {Math.round((totalHoursThisMonth + Number.EPSILON) * 10) / 10}
                  <small>h</small>
                </span>
                <span className="stat-label">Horas de estudio (estimadas)</span>
              </div>
            </div>
            <div className="stat-card stat-card-neumorphic">
              <div className="stat-icon-wrapper pulse-effect">
                <Globe size={32} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{activeSubjectsCount}</span>
                <span className="stat-label">Materias en curso</span>
              </div>
            </div>
            <div className="stat-card stat-card-neumorphic stat-card-full">
              <div className="stat-icon-wrapper pulse-effect">
                <BookOpen size={32} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{studyPlansCount}</span>
                <span className="stat-label">Planes generados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Insights de la IA con interfaz de comando futurista */}
        <div className="ai-insights-panel glow-border">
          {' '}
          {/* ¡MÁS SPICY! Borde que brilla */}
          <div className="ai-console-header">
            <Atom size={20} className="ai-icon-brain" />
            <span className="ai-console-title">_AI_ASSISTANT: &gt;</span>
          </div>
          <div className="ai-insights-content">
            <p className="ai-insights-message type-effect">
              {aiInsight.message}
            </p>{' '}
            {/* ¡NUEVO! Efecto de escritura */}
            <p className="ai-recommendation">
              <Zap size={16} className="ai-rec-icon" />
              Recomendación: _{aiInsight.recommendation}_
            </p>
          </div>
        </div>
      </div>

      {/* Panel de Acceso a Configuración, con diseño más agresivo */}
      <Link to="/settings" className="settings-access-link interactive-btn">
        {' '}
        {/* ¡MÁS SPICY! Botón interactivo */}
        <div className="settings-access-panel">
          <div className="settings-content">
            <div className="settings-icon-wrapper">
              <Settings size={36} />
            </div>
            <div className="settings-text">
              <h3>Configuración del Núcleo</h3>
              <p>Calibra tu experiencia, ajusta parámetros del sistema.</p>
            </div>
            <div className="settings-action-arrow">
              <ArrowRight size={28} />
            </div>
          </div>
          <div className="button-glare-effect"></div>{' '}
          {/* ¡NUEVO! Efecto de luz */}
        </div>
      </Link>
    </div>
  );
};

export default Profile;
