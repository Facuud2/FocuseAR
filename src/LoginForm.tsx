//Lo comenté ya que solo lo utilicé para comprobar que funcionaba el Login con Google

// import React from "react";
// import { loginWithGoogle } from "./AuthService"; 

// const LoginForm: React.FC = () => { 
//     const handleLogin = async () => { 
//         try {
//             await loginWithGoogle();
//         } catch (error: any) {
//             if (error.code !== 'auth/cancelled-popup-request') {
//                 alert("Debes completar el inicio de sesión con Google"); 
//             } else {
//                 alert(error.message);
//             }

//         }
//     };

//     return (
//         <div>
//             <h2>Iniciar sesión</h2>
//             <button onClick={handleLogin}>Iniciar sesión con Google</button>
//         </div>
//     );
// };

// export default LoginForm; 
