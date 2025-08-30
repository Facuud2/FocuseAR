<<<<<<< HEAD
import React, { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import "./App.css";

const App: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn ? <Dashboard /> : <Login onLogin={() => setLoggedIn(true)} />;
};

export default App;
=======
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Auth from "./components/Auth";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route 
            path="/informacion-academica" 
            element={
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">Información Académica</h1>
                <p className="text-gray-600">Esta sección está en desarrollo...</p>
              </div>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}


>>>>>>> 1bc5acf3bdfb17556d230244877c6460d7012b60
