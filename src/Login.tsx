import React, { useState } from "react";

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin();
    } else {
      alert("Completa todos los campos");
    }
  };

  return (
  <div className="login-box">
      <h2><i className="fas fa-user"></i> Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="usuario@ejemplo.com" 
          />
        </div>
        <div className="form-group">
          <label>Contraseña</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="********" 
          />
        </div>
        <button type="submit" className="planify-btn">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
