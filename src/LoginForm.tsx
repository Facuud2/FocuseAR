// Lo comenté ya que solo lo utilicé para comprobar que funcionaba el Login con Google

import React from "react";
import { loginWithGoogle } from "./AuthService";

// Type alias for Firebase-like errors
type FirebaseError = {
    code: string;
    message: string;
};

// Type guard to check for FirebaseError
const isFirebaseError = (error: unknown): error is FirebaseError => {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as FirebaseError).code === "string"
    );
};

const LoginForm: React.FC = () => {
    const handleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error: unknown) {
            if (isFirebaseError(error)) {
                if (error.code !== 'auth/cancelled-popup-request') {
                    console.error("Firebase login error:", error);
                    alert("Ocurrió un error durante el inicio de sesión con Google.");
                }
                // If it is 'auth/cancelled-popup-request', do nothing.
            } else if (error instanceof Error) {
                // This will catch other general errors.
                alert(error.message);
            }
        }
    };

    return (
        <div>
            <h2>Iniciar sesión</h2>
            <button onClick={handleLogin}>Iniciar sesión con Google</button>
        </div>
    );
};

export default LoginForm; 
