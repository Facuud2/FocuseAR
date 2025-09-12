// src/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando sesión...</div>; // Puedes usar un spinner
  }

  // Si no hay usuario, redirige al login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Si el usuario está autenticado, renderiza la ruta anidada
  return <Outlet />;
};

export default ProtectedRoute;
