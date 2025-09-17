import React, { useState, useRef, useEffect } from 'react';
import './Login.css';

interface LoginProps {
  onLogin: (email: string, pass: string) => void;
  onGoogleLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGoogleLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Estado para controlar qué video se reproduce en el área del "logo"
  const [currentLogoVideo, setCurrentLogoVideo] = useState('/repo.mp4'); // Video predeterminado
  const passwordInputRef = useRef<HTMLInputElement>(null); // Ref para el input de contraseña
  const logoVideoRef = useRef<HTMLVideoElement>(null); // Ref para el video del logo

  // URLs de tus videos
  const defaultLogoVideo = 'public/repo.mp4'; // Asegúrate de tener este video en tu carpeta public
  const passwordTypingVideo = 'public/espia.mp4'; // Asegúrate de tener este video en tu carpeta public

  // Cuando el input de contraseña obtiene el foco
  const handlePasswordFocus = () => {
    setCurrentLogoVideo(passwordTypingVideo);
  };

  // Cuando el input de contraseña pierde el foco (o está vacío)
  const handlePasswordBlur = () => {
    // Si la contraseña está vacía, volvemos al video predeterminado
    if (!passwordInputRef.current || passwordInputRef.current.value === '') {
      setCurrentLogoVideo(defaultLogoVideo);
    }
  };

  // Efecto para controlar la reproducción del video del logo
  useEffect(() => {
    if (logoVideoRef.current) {
      logoVideoRef.current.load(); // Carga el nuevo video si la fuente cambia
      logoVideoRef.current
        .play()
        .catch((error) => console.log('Error al reproducir el video:', error)); // Intenta reproducir
    }
  }, [currentLogoVideo]); // Ejecutar cuando currentLogoVideo cambia

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
      <video autoPlay loop muted className="video-background" playsInline>
        <source src="/videolofi.mp4" type="video/mp4" />
        Tu navegador no soporta el tag de video.
      </video>

      {/* Contenido del formulario */}
      <div className="login-box">
        <div className="text-center">
          {/* Aquí se reemplaza el img por un video */}
          <video
            ref={logoVideoRef}
            key={currentLogoVideo} // Key para forzar la recarga del video al cambiar la fuente
            autoPlay
            loop
            muted
            playsInline
            className="logo-video"
          >
            <source src={currentLogoVideo} type="video/mp4" />
            Tu navegador no soporta el tag de video.
          </video>
          <h2>Inicia Sesión</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <i className="input-icon fas fa-envelope"></i>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>
          <div className="form-group">
            <i className="input-icon fas fa-lock"></i>
            <input
              ref={passwordInputRef} // Asignamos la ref aquí
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={handlePasswordFocus} // Al obtener el foco
              onBlur={handlePasswordBlur} // Al perder el foco
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
