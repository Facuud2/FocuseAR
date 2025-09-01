import React, { useState } from 'react';

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
      {/* LADO IZQUIERDO - LOGO */}
      <div className="login-left">
        <div className="login-logo-full">
          <div className="login-logo-icon">
            <img
              src="/logo.png"
              alt="FocuseAR Icon"
              className="w-[180px] h-[180px] object-cover rounded-full mx-auto"
            />
          </div>
          <div className="login-title-container">
            <img
              src="Texto.png"
              alt="FocuseAR Logo"
              className="login-title-img"
            />
            <p className="login-subtitle">Tu asistente de estudio con IA</p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-box">
          <h2>
            <i className="fas fa-user"></i> Iniciar Sesión
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>
            <button type="submit" className="planify-btn">
              Entrar
            </button>
          </form>
          <div className="mt-4">
            <button
              onClick={onGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google logo"
                className="w-5 h-5"
              />
              Continuar con Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
