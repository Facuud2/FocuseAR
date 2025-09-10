import React, { useState } from 'react';
import './Login.css';

interface LoginProps {
  onLogin: (email: string, pass: string) => void;
  onGoogleLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGoogleLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    } else {
      alert('Completa todos los campos');
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        {/* LADO IZQUIERDO - LOGO Y DESCRIPCIÓN */}
        <div className="login-left">
          <div className="login-logo-container">
            <img
              src="/logo.png"
              alt="FocuseAR Icon"
              className="login-logo"
            />
            <div className="login-title-container">
              <h1 className="login-title">FocuseAR</h1>
              <p className="login-subtitle">Tu asistente de estudio con IA</p>
            </div>
          </div>
          
          <div className="login-features">
            <h3 className="login-features-title">¿Qué ofrece FocuseAR?</h3>
            <ul className="login-features-list">
              <li className="login-feature-item">Planificación automática de estudios</li>
              <li className="login-feature-item">Organización inteligente de materias</li>
              <li className="login-feature-item">Asistente con IA para dudas académicas</li>
              <li className="login-feature-item">Seguimiento de tu progreso</li>
            </ul>
          </div>
        </div>

        {/* LADO DERECHO - FORMULARIO */}
        <div className="login-right">
          <div className="login-form-container">
            <div className="login-form-header">
              <h2 className="login-form-title">Iniciar Sesión</h2>
              <p className="login-form-subtitle">Accede a tu cuenta para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-input-group">
                <label htmlFor="email" className="login-label">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="login-input"
                  required
                />
              </div>

              <div className="login-input-group">
                <label htmlFor="password" className="login-label">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="login-input"
                  required
                />
              </div>

              <button type="submit" className="login-button">
                Entrar
              </button>
            </form>

            <div className="login-separator">
              <span className="login-separator-text">O continúa con</span>
            </div>

            <button
              onClick={onGoogleLogin}
              type="button"
              className="login-google-button"
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google logo"
                className="login-google-icon"
              />
              Continuar con Google
            </button>

            <div className="login-signup-link">
              <p>¿No tienes una cuenta? <a href="#" className="login-link">Regístrate</a></p>
            </div>
          </div>

          <div className="login-terms">
            <p className="login-terms-text">Al iniciar sesión, aceptas nuestros <a href="#" className="login-link">Términos de servicio</a> y <a href="#" className="login-link">Política de privacidad</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;