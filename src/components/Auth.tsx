
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Login from "../Login";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";


export default function Auth() {
  
  const navigate = useNavigate();

  
  const handleLogin = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast.success("¡Inicio de sesión exitoso!");
      navigate("/informacion-academica");
    } catch (error) {
      toast.error("Error al iniciar sesión. Por favor, revisa tus credenciales.");
      console.error("Error al iniciar sesión", error);
    }
  };

  return (
    <Login onLogin={handleLogin} />
  )
}

