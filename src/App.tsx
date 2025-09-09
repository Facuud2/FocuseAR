// src/App.tsx
import './App.css';
import { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './ProtectedRoute';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import PDFSummaryTest from './components/PDFSummaryTest';
import Sidebar from './components/Sidebar';
import AccountSettings from './components/AccountSettings';

// Importa los nuevos componentes
import StudySchedule from './components/StudySchedule';
import Subjects from './components/Subjects';
import Documents from './components/Documents';
import PomodoroTimer from './components/PomodoroTimer';
import AIPlanner from './components/AIPlanner';
import Profile from './components/Profile';
import Progress from './components/Progress';
import Analytics from './components/Analytics';

import { AuthProvider } from './context/AuthContext';

function AppRoutes() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSectionChange = (path: string) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <AuthProvider>
      <div className="app-container">
        <div className="main-content">
          {/* Muestra el sidebar solo en rutas protegidas */}
          {location.pathname !== '/' && (
            <Sidebar
              activeSection={location.pathname}
              onSectionChange={handleSectionChange}
              isSidebarOpen={isSidebarOpen}
              onClose={toggleSidebar}
            />
          )}
          <main className="content-area">
            <Toaster position="top-right" />
            <Routes>
              {/* Ruta para el login */}
              <Route path="/" element={<Auth />} />

              {/* Agrupa todas las rutas protegidas bajo un solo <Route> */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/study-schedule" element={<StudySchedule />} />
                <Route path="/subjects" element={<Subjects />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/pomodoro" element={<PomodoroTimer />} />
                <Route path="/ai-planner" element={<AIPlanner />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<AccountSettings />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/pdf-summary-test" element={<PDFSummaryTest />} />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Route>
            </Routes>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
