import React, { useState } from 'react';
import styles from './Login.module.css';
import './Login.css'; // keep existing for any remaining global utilities

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
    <div id="login-root" className={styles.container}>
      {/* Video de fondo */}
      <video autoPlay loop muted className={styles.video} playsInline>
        <source src="/videolofi.mp4" type="video/mp4" />
        Tu navegador no soporta el tag de video.
      </video>

      {/* Contenido del formulario */}
      <div className={styles.box}>
        <div>
          <img src="/logo.png" alt="FocuseAR Logo" className={styles.logo} />
          <h2 className={styles.title}>Inicia Sesión</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <i className={`${styles.icon} fas fa-envelope`} aria-hidden />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Contraseña</label>
            <i className={`${styles.icon} fas fa-lock`} aria-hidden />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              aria-label="Contraseña"
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.btn}>
            Entrar
          </button>
        </form>
        <div className="mt-4">
          <button
            onClick={onGoogleLogin}
            type="button"
            className={styles.googleBtn}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google logo" />
            Continuar con Google
          </button>
        </div>
        {/* Botón para abrir el registro */}
        <div className="mt-4">
          <button
            type="button"
            className={styles.btn}
            onClick={() => setShowRegister(true)}
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </div>
        {/* Botón que abre drawer lateral para recuperación de contraseña */}
        <div className="recover-link-wrap">
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => {
              setShowRecover(true);
              setRecoverMessage(null);
              setRecoverEmail('');
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>

      {/* Modal/popup de registro moderno */}
      {showRegister && (
        <div className={styles.drawerOverlay}>
          <div className={styles.sideDrawer}>
            <button
              className="drawer-close-btn"
              onClick={() => setShowRegister(false)}
            >
              &times;
            </button>
            <div className={styles.drawerHeader}>
              <img
                src="/logo.png"
                alt="FocuseAR Logo"
                className={styles.drawerLogo}
              />
              <h2 className={styles.drawerTitle}>Crear cuenta</h2>
            </div>
            <form onSubmit={handleRegister} className={styles.drawerForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <i className={`${styles.icon} fas fa-envelope`} aria-hidden />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Email"
                  disabled={regLoading}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Contraseña</label>
                <i className={`${styles.icon} fas fa-lock`} aria-hidden />
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Contraseña"
                  disabled={regLoading}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Repetir contraseña</label>
                <i className={`${styles.icon} fas fa-lock`} aria-hidden />
                <input
                  type="password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="Repetir contraseña"
                  disabled={regLoading}
                  className={styles.input}
                />
              </div>
              <button
                type="submit"
                className={styles.btn}
                disabled={regLoading}
              >
                {regLoading ? 'Creando cuenta...' : 'Registrarse'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Drawer lateral para recuperación de contraseña */}
      {showRecover && (
        <div className={styles.drawerOverlay}>
          <div className={`${styles.sideDrawer} small`}>
            <button
              className="drawer-close-btn"
              onClick={() => setShowRecover(false)}
            >
              &times;
            </button>
            <div className={styles.drawerHeader}>
              <img
                src="/logo.png"
                alt="FocuseAR Logo"
                className={styles.drawerLogo}
              />
              <h2 className={styles.drawerTitle}>Recuperar contraseña</h2>
              <p className={styles.drawerDesc}>
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>
            </div>
            <div className={styles.drawerForm}>
              <input
                className={styles.input}
                type="email"
                placeholder="Tu email"
                value={recoverEmail}
                onChange={(e) => setRecoverEmail(e.target.value)}
                disabled={recoverLoading}
              />
              <div className="drawer-actions">
                <button
                  className={styles.btn}
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
                >
                  {recoverLoading ? 'Enviando...' : 'Enviar enlace'}
                </button>
                <button
                  type="button"
                  className="muted-btn"
                  onClick={() => {
                    setShowRecover(false);
                    setRecoverMessage(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
              {recoverMessage && (
                <div
                  className={`drawer-message ${recoverMessage.startsWith('Se envió') ? 'drawer-success' : 'drawer-error'}`}
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
