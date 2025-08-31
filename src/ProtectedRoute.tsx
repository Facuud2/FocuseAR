import React, { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Cargando sesión...</div>; // Aquí puedes poner un spinner
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;

