import './App.css';
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
import Quizzes from './pages/Quizzes';
import QuizPlayer from './pages/QuizPlayer';
import QuizCreator from './pages/QuizCreator';

import { AuthProvider } from './context/AuthContext';
import { PlannerProvider } from './context/PlannerProvider';

function AppRoutes() {
  // El Sidebar ahora gestiona su propio estado de colapsado/expandido
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleSectionChange = (path: string) => {
    navigate(path);
  };

  // El Sidebar gestiona el colapso/expansión internamente

  const handleToggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const currentPath = location.pathname;

  return (
    <AuthProvider>
      <div className="app-container">
        {currentPath !== '/' && (
          <Sidebar
            activeSection={currentPath}
            onSectionChange={handleSectionChange}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
          />
        )}
        <main className="content-area">
          <Toaster position="top-right" />
          <Routes>
            {/* Rutas públicas solo para usuarios NO autenticados */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/" element={<Auth />} />
            </Route>
            {/* Rutas protegidas solo para usuarios autenticados */}
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
              <Route path="/quizzes" element={<Quizzes />} />
              <Route path="/quiz/:quizId" element={<QuizPlayer />} />
              <Route path="/create-quiz" element={<QuizCreator />} />
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
      <AuthProvider>
        <PlannerProvider>
          <AppRoutes />
        </PlannerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
