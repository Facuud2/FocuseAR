import './Profile.css';
import { User, TrendingUp, BookOpen, Clock, Settings } from 'lucide-react';

const Profile = () => {
  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1 className="profile-title">Mi Perfil</h1>
        <p className="profile-subtitle">
          Revisa y gestiona la información de tu cuenta y tu progreso.
        </p>
      </header>

      <div className="profile-main-content">
        {/* Panel de Información Personal */}
        <div className="info-panel">
          <h2 className="panel-title">
            <User className="panel-icon" />
            Información Personal
          </h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Nombre completo</span>
              <span className="info-value">Juan Pérez</span>
            </div>
            <div className="info-item">
              <span className="info-label">Correo electrónico</span>
              <span className="info-value">juan.perez@ejemplo.com</span>
            </div>
            <div className="info-item">
              <span className="info-label">Miembro desde</span>
              <span className="info-value">9 de septiembre, 2025</span>
            </div>
          </div>
          <p className="info-note">
            Para editar esta información, ve a **Configuración de la Cuenta**.
          </p>
        </div>

        {/* Panel de Estadísticas Rápidas */}
        <div className="stats-panel">
          <h2 className="panel-title">
            <TrendingUp className="panel-icon" />
            Estadísticas Rápidas
          </h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper">
                <BookOpen size={32} />
              </div>
              <div className="stat-info">
                <span className="stat-value">5</span>
                <span className="stat-label">Materias activas</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper">
                <Clock size={32} />
              </div>
              <div className="stat-info">
                <span className="stat-value">45h</span>
                <span className="stat-label">Estudiadas este mes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Acceso a Configuración */}
      <div className="settings-access-panel">
        <div className="settings-content">
          <div className="settings-icon">
            <Settings size={48} />
          </div>
          <div className="settings-text">
            <h3>Configuración de la Cuenta</h3>
            <p>
              Actualiza tus preferencias, cambia tu contraseña y gestiona tu
              cuenta.
            </p>
          </div>
          <button className="settings-btn">Ir a Configuración</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
