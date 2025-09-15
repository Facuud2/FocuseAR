import React, { useState } from 'react';
import './Login.css'; // Asegúrate de que esta ruta sea correcta

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
    <div className="login-container">
      {/* Video de fondo */}
      <video
        autoPlay
        loop
        muted
        className="video-background"
        playsInline // Importante para la reproducción en móviles
      >
        <source src="/videolofi.mp4" type="video/mp4" />
        Tu navegador no soporta el tag de video.
      </video>

      {/* Contenido del formulario */}
      <div className="login-box">
        <div className="text-center">
          <img src="/logo.png" alt="FocuseAR Logo" className="logo-img" />
          <h2>Inicia Sesión</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            Email
            <i className="input-icon fas fa-envelope"></i>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>
          <div className="form-group">
            contraseña
            <i className="input-icon fas fa-lock"></i>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
            />
          </div>
          <button type="submit" className="planify-btn">
            Entrar
          </button>
        </form>
        <div className="mt-4">
          <button onClick={onGoogleLogin} type="button" className="google-btn">
            <img src="https://www.google.com/favicon.ico" alt="Google logo" />
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
