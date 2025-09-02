import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';
import Auth from './components/Auth';
import Dashboard from './Dashboard';
import Sidebar from './components/Sidebar';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {/* Aquí ponemos el layout con Sidebar y Dashboard */}
            <div className="flex">
              <Sidebar activeSection="overview" onSectionChange={() => {}} />{' '}
              {/* Añadido props activeSection y onSectionChange */}
              <div className="ml-80 flex-1 min-h-screen bg-gray-100 p-8">
                {' '}
                {/* Cambiado ml-64 a ml-80 para coincidir con w-80 del sidebar */}
                <Dashboard />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
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
}

export default App;
