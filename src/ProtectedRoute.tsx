import React from "react";
import { Navigate } from "react-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }  
    return <>{children}</>;
};
export default ProtectedRoute;