// Lo comenté ya que solo lo utilicé para comprobar que funcionaba el Login con Google

import React from "react";
import { loginWithGoogle } from "./AuthService"; 

const LoginForm: React.FC = () => { 
    const handleLogin = async () => { 
        try {
            await loginWithGoogle();
        } catch (error: any) {
            if (error && typeof error.code === 'string' && error.code !== 'auth/cancelled-popup-request') {
                // This handles Firebase errors that are not simple cancellations by the user.
                console.error("Firebase login error:", error);
                alert("Ocurrió un error durante el inicio de sesión con Google.");
            } else if (error instanceof Error) {
                // This will catch the 'auth/cancelled-popup-request' and other general errors.
                // We can choose to ignore the cancellation error and not show an alert.
                if (error.message.includes('auth/cancelled-popup-request')) {
                    // User cancelled the popup, do nothing.
                } else {
                    alert(error.message);
                }
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
