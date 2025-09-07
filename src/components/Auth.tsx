import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Login from './Login';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase';

const googleProvider = new GoogleAuthProvider();

export default function Auth() {
  const navigate = useNavigate();

  const handleLogin = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast.success('¡Inicio de sesión exitoso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(
        'Error al iniciar sesión. Por favor, revisa tus credenciales.',
      );
      console.error('Error al iniciar sesión', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        toast.success('¡Inicio de sesión con Google exitoso!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Error al iniciar sesión con Google');
      console.error('Error al iniciar sesión con Google:', error);
    }
  };

  return <Login onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} />;
}
