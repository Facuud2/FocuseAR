import { useState } from "react";
import { signInWithPopup, signOut, type User } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Auth() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const loginGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      toast.success("¡Inicio de sesión exitoso!");
      navigate("/informacion-academica");
    } catch (error) {
      toast.error("Error al iniciar sesión. Por favor, intenta nuevamente.");
      console.error("Error al iniciar sesión", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast.success("Sesión cerrada exitosamente");
    } catch (error) {
      toast.error("Error al cerrar sesión");
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-md">
      {!user ? (
        <>
          <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
          <button
            onClick={loginGoogle}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Continuar con Google
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl">Hola, {user.displayName}</h2>
          <img src={user.photoURL || ""} alt="Foto perfil" className="w-16 h-16 rounded-full" />
          <button
            onClick={logout}
            className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Cerrar sesión
          </button>
        </>
      )}
    </div>
  );
}

