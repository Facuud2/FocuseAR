import "./App.css";
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Auth from "./components/Auth";
import InfoAcademica from "./InfoAcademica";
import ProtectedRoute from "./ProtectedRoute";
function App() {

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route 
            path="/informacion-academica" 
            element={
              <ProtectedRoute>
                <InfoAcademica />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};
export default App;