import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase"

// 1. Creamos el contexto con un valor inicial nulo.
const AuthContext = createContext<{ user: User | null }>({ user: null });

// 2. Componente proveedor que envuelve la app y gestiona el usuario.
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

  // 3. Escucha los cambios de autenticación de Firebase.
    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
    });
    return () => unsubscribe();
    }, []);

  // 4. Provee el usuario a toda la app.
    return (
    <AuthContext.Provider value={{ user }}>
        {children}
    </AuthContext.Provider>
    );
};

// 5. Hook para usar el contexto fácilmente en cualquier componente.
export const useAuth = () => useContext(AuthContext);