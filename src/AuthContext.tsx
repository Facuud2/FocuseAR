import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
  type AuthError,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { DatabaseService } from './services/DatabaseService';
import { AuthContext } from './hooks/authContext';
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Cuando el usuario se autentica, crear/actualizar en Firestore
          console.log('🔐 Usuario autenticado, sincronizando con Firestore...');
          await DatabaseService.createOrUpdateUser(firebaseUser);
          console.log('✅ Usuario sincronizado con Firestore');
        } catch (dbError) {
          console.error(
            '❌ Error al sincronizar usuario con Firestore:',
            dbError,
          );
          // No bloqueamos la autenticación por errores de base de datos
        }
      }

      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      await signInWithPopup(auth, googleProvider);

      // El usuario se creará/actualizará automáticamente en el useEffect
      console.log('✅ Login con Google exitoso');
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
      console.error('❌ Error en login con Google:', authError.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('✅ Logout exitoso');
    } catch (error) {
      console.error('❌ Error en logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
