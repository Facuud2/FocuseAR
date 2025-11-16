// src/components/Profile.tsx
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../hooks/authContext';
import { useDatabase } from '../hooks/useDatabase';
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
  // Atom, // Comentado temporalmente
  Globe,
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, loading } = useContext(AuthContext);
  const { getUserMaterials, getUserStudyPlans } = useDatabase();

  const [materialsCount, setMaterialsCount] = useState<number | null>(null);
  const [studyPlansCount, setStudyPlansCount] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadCounts = async () => {
      if (!user) {
        if (mounted) {
          setMaterialsCount(0);
          setStudyPlansCount(0);
        }
        return;
      }

      try {
        setDataLoading(true);
        const materials = await getUserMaterials();
        const plans = await getUserStudyPlans();
        if (!mounted) return;
        setMaterialsCount(Array.isArray(materials) ? materials.length : 0);
        setStudyPlansCount(Array.isArray(plans) ? plans.length : 0);
      } catch (err) {
        // Si falla la carga, dejamos los contadores en 0 y registramos el error
        console.error('Error cargando materials/studyPlans:', err);
        if (mounted) {
          setMaterialsCount(0);
          setStudyPlansCount(0);
        }
      } finally {
        if (mounted) setDataLoading(false);
      }
    };

    loadCounts();
    return () => {
      mounted = false;
    };
  }, [user, getUserMaterials, getUserStudyPlans]);

  // Datos de ejemplo para el rediseño
  const studyStats = {
    streakDays: 7,
    totalHoursThisMonth: 45,
    // activeSubjects and mostStudiedSubject will be populated from DB
    activeSubjects: materialsCount ?? 0,
    mostStudiedSubject:
      studyPlansCount !== null ? String(studyPlansCount) : '0',
    // ¡NUEVO! Datos para el gráfico holográfico
    weeklyProgress: [0.2, 0.5, 0.7, 0.8, 0.6, 0.9, 0.75], // Progreso ficticio
  };

  // Datos temporalmente comentados para AI Insights
  /*
  const aiInsight = {
    title: 'Análisis Predictivo de Rendimiento',
    message:
      'Basado en tu ritmo actual, el modelo de IA predice que alcanzarás el 90% de dominio en Álgebra Lineal en los próximos 18 días. ¡Mantén el enfoque!',
    recommendation:
      'Considera una sesión de repaso profundo este jueves a las 19:00.',
  };
  */

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
              {loading ? (
                <div className="profile-loading">Cargando perfil...</div>
              ) : (
                <>
                  <h3 className="user-name-lg">
                    {user?.displayName || 'Explorador'}
                  </h3>
                  <p className="user-email-lg">{user?.email}</p>
                  <p className="user-status-tag">Conectado al Hivemind</p>

                  {/* Estado cool */}
                  <div className="study-streak glow-effect">
                    <Award size={24} className="streak-icon" />
                    <span className="streak-text">
                      Racha: {studyStats.streakDays} días
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* ¡NUEVO! Gráfico holográfico de progreso (visual placeholder) */}
          <div className="holographic-progress">
            <h4>
              Dominio Semanal <Zap size={16} />
            </h4>
            <div className="progress-graph">
              {studyStats.weeklyProgress.map((value, index) => (
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
                  {studyStats.totalHoursThisMonth}
                  <small>h</small>
                </span>
                <span className="stat-label">En órbita este mes</span>
              </div>
            </div>
            <div className="stat-card stat-card-neumorphic">
              <div className="stat-icon-wrapper pulse-effect">
                <Globe size={32} />
              </div>
              <div className="stat-info">
                <span className="stat-value">
                  {dataLoading || materialsCount === null
                    ? '...'
                    : materialsCount}
                </span>
                <span className="stat-label">Materias en curso</span>
              </div>
            </div>
            <div className="stat-card stat-card-neumorphic stat-card-full">
              <div className="stat-icon-wrapper pulse-effect">
                <BookOpen size={32} />
              </div>
              <div className="stat-info">
                <span className="stat-value">
                  {dataLoading || studyPlansCount === null
                    ? '...'
                    : studyPlansCount}
                </span>
                <span className="stat-label">Planes de estudio generados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Insights de la IA con interfaz de comando futurista - OCULTO TEMPORALMENTE */}
        {/* 
        <div className="ai-insights-panel glow-border">
          <div className="ai-console-header">
            <Atom size={20} className="ai-icon-brain" />
            <span className="ai-console-title">_AI_ASSISTANT: &gt;</span>
          </div>
          <div className="ai-insights-content">
            <p className="ai-insights-message type-effect">
              {aiInsight.message}
            </p>
            <p className="ai-recommendation">
              <Zap size={16} className="ai-rec-icon" />
              Recomendación: _{aiInsight.recommendation}_
            </p>
          </div>
        </div>
        */}
      </div>

      {/* Panel de Acceso a Configuración, con diseño más agresivo */}
      <a href="/settings" className="settings-access-link interactive-btn">
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
      </a>
    </div>
  );
};

export default Profile;
