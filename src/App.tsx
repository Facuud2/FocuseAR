/* src/App.tsx */
import './theme.css';
import './App.css';
import './glass.css';
import { useState, useEffect } from 'react';
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
import PublicOnlyRoute from './PublicOnlyRoute';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import AccountSettings from './components/AccountSettings';
import Subjects from './components/Subjects';
import Documents from './components/Documents';
import PomodoroTimer from './components/PomodoroTimer';
import AIPlanner from './components/AIPlanner';
import Profile from './components/Profile';
import Quizzes from './pages/Quizzes';
import QuizPlayer from './pages/QuizPlayer';
import QuizCreator from './pages/QuizCreator';
import ErrorTest from './components/ErrorTest';

import { AuthProvider } from './context/AuthContext';
import { PlannerProvider } from './context/PlannerProvider';

function AppRoutes() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  // Detectamos si es la página de login
  const isLoginPage = currentPath === '/';

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleSectionChange = (path: string) => {
    navigate(path);
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  return (
    // Si es login, usamos una clase que no aplique flex-row ni márgenes extra
    <div className={isLoginPage ? 'app-container-login' : 'app-container'}>
      {!isLoginPage && (
        <Sidebar
          activeSection={currentPath}
          onSectionChange={handleSectionChange}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      )}
      {/* Si es Login, usamos 'content-area-full' (sin padding).
         Si es Dashboard, usamos 'content-area' (con padding).
      */}
      <main className={isLoginPage ? 'content-area-full' : 'content-area'}>
        <Toaster position="top-right" />
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/" element={<Auth />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/pomodoro" element={<PomodoroTimer />} />
            <Route path="/ai-planner" element={<AIPlanner />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/quiz/:quizId" element={<QuizPlayer />} />
            <Route path="/create-quiz" element={<QuizCreator />} />
            <Route path="/error-test" element={<ErrorTest />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlannerProvider>
          <AppRoutes />
        </PlannerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
