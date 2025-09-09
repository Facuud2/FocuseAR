// --- START OF FILE App.tsx (Updated for Responsiveness) ---
import './App.css';
import { useState } from 'react'; // Importar useState de React
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './ProtectedRoute';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import PDFSummaryTest from './components/PDFSummaryTest';
import Sidebar from './components/Sidebar';
import { AuthProvider } from './context/AuthContext';

function AppRoutes() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Auth />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Sidebar
                activeSection="overview"
                onSectionChange={() => {}}
                isSidebarOpen={isSidebarOpen}
                onClose={toggleSidebar}
              />
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pdf-summary-test"
          element={
            <ProtectedRoute>
              <PDFSummaryTest />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
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
// --- END OF FILE App.tsx ---
