import "./App.css";
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import InfoAcademica from "./InfoAcademica";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider } from "./AuthContext";
import Auth from "./components/Auth";


function AppRoutes() {

  return (
    <Routes>
      <Route path="/" element={
        <Auth />
      } />
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
  )
}

function App() {

  return (
    <BrowserRouter>
      <AuthProvider>
      <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};
export default App;