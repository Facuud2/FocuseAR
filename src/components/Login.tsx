import React, { useState } from 'react';
import './Login.css'; // Asegúrate de que esta ruta sea correcta

interface LoginProps {
  onLogin: (email: string, pass: string) => void;
  onGoogleLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGoogleLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  // Estado para recuperación de contraseña
  const [showRecover, setShowRecover] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverMessage, setRecoverMessage] = useState<string | null>(null);
  const getErrorMessage = (error: unknown) => {
    try {
      return (error as Error).message || 'Error desconocido';
    } catch {
      return 'Error desconocido';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    } else {
      alert('Completa todos los campos');
    }
  };
  // Registro con Firebase
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regConfirm) {
      alert('Completa todos los campos');
      return;
    }
    if (regPassword !== regConfirm) {
      alert('Las contraseñas no coinciden');
      return;
    }
    setRegLoading(true);
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      alert('¡Registro exitoso!');
      setShowRegister(false);
      setEmail(regEmail);
      setPassword(regPassword);
    } catch (error: unknown) {
      alert(getErrorMessage(error));
    } finally {
      setRegLoading(false);
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
        {/* Botón para abrir el registro */}
        <div className="mt-4">
          <button
            type="button"
            className="planify-btn"
            onClick={() => setShowRegister(true)}
            style={{ marginTop: '1rem' }}
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </div>
        {/* Botón que abre drawer lateral para recuperación de contraseña */}
        <div
          style={{ width: '100%', marginTop: '0.5rem', textAlign: 'center' }}
        >
          <button
            type="button"
            onClick={() => {
              setShowRecover(true);
              setRecoverMessage(null);
              setRecoverEmail('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-color)',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginTop: '0.75rem',
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>

      {/* Modal/popup de registro moderno */}
      {showRegister && (
        <div className="drawer-overlay">
          <div className="side-drawer">
            <button
              className="drawer-close-btn"
              onClick={() => setShowRegister(false)}
            >
              &times;
            </button>
            <div className="text-center">
              <img src="/logo.png" alt="FocuseAR Logo" className="logo-img" />
              <h2 className="drawer-title">Crear cuenta</h2>
            </div>
            <form onSubmit={handleRegister} style={{ width: '100%' }}>
              <div
                className="form-group"
                style={{
                  background: 'var(--background-light)',
                  color: 'var(--primary-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  width: '100%',
                }}
              >
                <label
                  style={{
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                  }}
                >
                  Email
                </label>
                <i className="input-icon fas fa-envelope"></i>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Email"
                  disabled={regLoading}
                  style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div
                className="form-group"
                style={{
                  background: 'var(--background-light)',
                  color: 'var(--primary-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  width: '100%',
                }}
              >
                <label
                  style={{
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                  }}
                >
                  Contraseña
                </label>
                <i className="input-icon fas fa-lock"></i>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Contraseña"
                  disabled={regLoading}
                  style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div
                className="form-group"
                style={{
                  background: 'var(--background-light)',
                  color: 'var(--primary-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  width: '100%',
                }}
              >
                <label
                  style={{
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                  }}
                >
                  Repetir contraseña
                </label>
                <i className="input-icon fas fa-lock"></i>
                <input
                  type="password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="Repetir contraseña"
                  disabled={regLoading}
                  style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <button
                type="submit"
                className="planify-btn"
                disabled={regLoading}
                style={{ marginTop: '2rem' }}
              >
                {regLoading ? 'Creando cuenta...' : 'Registrarse'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Drawer lateral para recuperación de contraseña */}
      {showRecover && (
        <div className="drawer-overlay">
          <div className="side-drawer small">
            <button
              className="drawer-close-btn"
              onClick={() => setShowRecover(false)}
            >
              &times;
            </button>
            <div
              className="text-center"
              style={{ width: '100%', marginTop: '1.5rem' }}
            >
              <img
                src="/logo.png"
                alt="FocuseAR Logo"
                className="drawer-logo"
              />
              <h2 className="drawer-title">Recuperar contraseña</h2>
              <p className="drawer-desc">
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>
            </div>
            <div className="drawer-form">
              <input
                className="drawer-input"
                type="email"
                placeholder="Tu email"
                value={recoverEmail}
                onChange={(e) => setRecoverEmail(e.target.value)}
                disabled={recoverLoading}
              />
              <div className="drawer-actions" style={{ display: 'flex' }}>
                <button
                  className="planify-btn"
                  type="button"
                  onClick={async () => {
                    if (!recoverEmail) {
                      setRecoverMessage('Ingresa un email válido.');
                      return;
                    }
                    setRecoverLoading(true);
                    setRecoverMessage(null);
                    try {
                      const { sendPasswordResetEmail } = await import(
                        'firebase/auth'
                      );
                      const { auth } = await import('../firebase');
                      await sendPasswordResetEmail(auth, recoverEmail);
                      setRecoverMessage(
                        'Se envió el enlace de recuperación. Revisa tu correo.',
                      );
                    } catch (err: unknown) {
                      setRecoverMessage(
                        getErrorMessage(err) || 'Error enviando el enlace',
                      );
                    } finally {
                      setRecoverLoading(false);
                    }
                  }}
                  disabled={recoverLoading}
                  style={{ flex: 1 }}
                >
                  {recoverLoading ? 'Enviando...' : 'Enviar enlace'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecover(false);
                    setRecoverMessage(null);
                  }}
                  style={{
                    flex: '0 0 40%',
                    borderRadius: 10,
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </div>
              {recoverMessage && (
                <div
                  className="drawer-message"
                  style={{
                    color: recoverMessage.startsWith('Se envió')
                      ? 'limegreen'
                      : '#ffb4b4',
                  }}
                >
                  {recoverMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
