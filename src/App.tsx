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
import { Menu } from 'lucide-react';

import ProtectedRoute from './ProtectedRoute';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import PDFSummaryTest from './components/PDFSummaryTest';
import Sidebar from './components/Sidebar';
import AccountSettings from './components/AccountSettings';
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
  // Ahora el estado de la barra lateral se gestiona aquí
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSectionChange = (path: string) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
  };

  const currentPath = location.pathname;

  return (
    <AuthProvider>
      <div className="app-container">
        {/* Renderiza el Sidebar si no estamos en la página de inicio */}
        {currentPath !== '/' && (
          <Sidebar
            activeSection={currentPath}
            onSectionChange={handleSectionChange}
            isSidebarOpen={isSidebarOpen}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onClose={() => {}} // Pasamos una función vacía para evitar errores
          />
        )}
        {/* El área de contenido se adapta al ancho de la barra lateral */}
        <main
          className={`content-area ${isSidebarOpen ? '' : 'content-collapsed'}`}
        >
          {/* Botón para abrir/cerrar el sidebar, visible cuando está colapsado */}
          {!isSidebarOpen && currentPath !== '/' && (
            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
          )}

          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Auth />} />
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
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </main>
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
