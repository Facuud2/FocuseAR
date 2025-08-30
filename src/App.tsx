import { useState } from "react";
import Dashboard from "./Dashboard";
import "./App.css";
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Auth from "./components/Auth";
import type { ReactNode } from "react";
import Login from "./LoginForm";

function App() {


  const [loggedIn, setLoggedIn] = useState(false);


  const PrivateRoute = ( {children} : {children: ReactNode}) => {
    return loggedIn ? { children } : <Login />
  };


  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <Routes>
          <Route path="/" element={<Auth loggedIn={loggedIn} setLoggedIn={setLoggedIn} />} />
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
};
export default App;