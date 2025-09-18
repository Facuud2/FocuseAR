import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import toast from 'react-hot-toast';
import './Login.css'; // Reutiliza los estilos del login

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast.error('Completa todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('¡Registro exitoso!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Error al registrar';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <video autoPlay loop muted className="video-background" playsInline>
        <source src="/videolofi.mp4" type="video/mp4" />
        Tu navegador no soporta el tag de video.
      </video>
      <div className="login-box">
        <div className="text-center">
          <img src="/logo.png" alt="FocuseAR Logo" className="logo-img" />
          <h2>Crear cuenta</h2>
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
              disabled={loading}
            />
          </div>
          <div className="form-group">
            Contraseña
            <i className="input-icon fas fa-lock"></i>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            Repetir contraseña
            <i className="input-icon fas fa-lock"></i>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetir contraseña"
              disabled={loading}
            />
          </div>
          <button type="submit" className="planify-btn" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
