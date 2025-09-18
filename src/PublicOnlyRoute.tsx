// src/PublicOnlyRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

/**
 * PublicOnlyRoute
 * Si el usuario está autenticado, redirige al dashboard.
 * Si no, muestra la página pública (login/register).
 */
const PublicOnlyRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando sesión...</div>; // Puedes usar un spinner
  }

  // Si el usuario está autenticado, redirige al dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si no está autenticado, muestra la página pública
  return <Outlet />;
};

export default PublicOnlyRoute;
