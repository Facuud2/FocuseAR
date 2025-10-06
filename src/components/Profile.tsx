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

  // Datos de ejemplo para el rediseño
  const [streakDays] = useState(7);
  const [totalHoursThisMonth, setTotalHoursThisMonth] = useState<number>(0);
  const [activeSubjectsCount, setActiveSubjectsCount] = useState<number>(0);
  const [studyPlansCount, setStudyPlansCount] = useState<number>(0);
  const [weeklyProgress] = useState<number[]>([
    0.2, 0.5, 0.7, 0.8, 0.6, 0.9, 0.75,
  ]);

  const { getPomodoroCyclesCount, getActiveSubjectsCount, getStudyPlansCount } =
    useDatabase();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
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
      } catch (e) {
        console.warn('Error cargando métricas del perfil:', e);
      }
    };
    load();
    return () => {
      mounted = false;
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
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
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
                {user?.displayName || 'Explorador'}
              </h3>
              <p className="user-status-tag">Conectado al Hivemind</p>{' '}
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
            <div className="progress-graph">
              {weeklyProgress.map((value: number, index: number) => (
                <div
                  key={index}
                  className="progress-bar"
                  style={{ height: `${value * 100}%` }}
                  title={`Día ${index + 1}: ${Math.round(value * 100)}%`}
                ></div>
              ))}
            </div>
            <p className="graph-label">Actividad en los últimos 7 días</p>
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
