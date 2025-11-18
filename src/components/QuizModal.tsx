import React, { useState, useEffect, useContext } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { AuthContext } from '../hooks/authContext';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { X, Play } from 'lucide-react'; // <--- Agregamos iconos
import './QuizzesDashboard.css';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  id?: string;
  questions: QuizQuestion[];
  subjectName: string;
  materialId: string;
  userId: string;
  createdAt: Timestamp;
}

const Quizzes: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { getQuizzes, deleteQuiz } = useDatabase();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este quiz?')) {
      try {
        await deleteQuiz(quizId);
        setQuizzes((prevQuizzes) =>
          prevQuizzes.filter((quiz) => quiz.id !== quizId),
        );
      } catch (error) {
        console.error('Error al eliminar el quiz:', error);
        alert('Hubo un error al eliminar el quiz.');
      }
    }
  };

  useEffect(() => {
    const loadQuizzes = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const userQuizzes = await getQuizzes();
        setQuizzes(userQuizzes);
      } catch (error) {
        console.error('Error loading quizzes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadQuizzes();
  }, [user, getQuizzes, deleteQuiz]);

  interface FirestoreTimestamp {
    toDate: () => Date;
    seconds?: number;
    nanoseconds?: number;
  }

  const toDate = (date: unknown): Date => {
    try {
      if (date instanceof Date) return date;
      if (
        date &&
        typeof date === 'object' &&
        'toDate' in date &&
        typeof (date as FirestoreTimestamp).toDate === 'function'
      ) {
        return (date as FirestoreTimestamp).toDate();
      }
      if (typeof date === 'string') {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) return parsed;
      }
      if (typeof date === 'number') {
        return new Date(date);
      }
      if (
        date &&
        typeof date === 'object' &&
        'seconds' in date &&
        typeof (date as FirestoreTimestamp).seconds === 'number'
      ) {
        return new Date((date as FirestoreTimestamp).seconds! * 1000);
      }
      return new Date();
    } catch {
      return new Date();
    }
  };

  const filteredQuizzes = quizzes
    .filter(() => {
      if (filter === 'all') return true;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime();
      }
      if (sortBy === 'subject') {
        return a.subjectName.localeCompare(b.subjectName);
      }
      return 0;
    });

  return (
    <div className="quizzes-dashboard-container">
      <header className="quizzes-dashboard-header">
        <h2>Mis Quizzes</h2>
        <div className="header-actions">
          <Link to="/create-quiz" className="create-quiz-btn">
            + Crear Nuevo
          </Link>
        </div>
      </header>

      <div className="quizzes-controls">
        <div className="filter-options">
          <label htmlFor="filter">Filtrar por:</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos</option>
          </select>
        </div>
        <div className="sort-options">
          <label htmlFor="sortBy">Ordenar por:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Más Recientes</option>
            <option value="oldest">Más Antiguos</option>
            <option value="subject">Materia</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Cargando tus materiales de estudio...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-box-open"></i>
          <p>No tienes quizzes o flashcards generados aún.</p>
          <p>¡Crea uno para empezar a estudiar!</p>
        </div>
      ) : (
        <div className="quizzes-grid">
          {filteredQuizzes.map((quizItem) => (
            <div key={quizItem.id} className="quiz-card">
              {/* BOTÓN ELIMINAR (X) - Ahora arriba a la derecha */}
              <button
                onClick={() => quizItem.id && handleDeleteQuiz(quizItem.id)}
                className="delete-quiz-btn"
                title="Eliminar Quiz"
              >
                <X size={20} />
              </button>

              <h3>{quizItem.subjectName}</h3>
              <div className="quiz-info">
                <p>{quizItem.questions.length} preguntas</p>
                <p className="quiz-date">
                  {toDate(quizItem.createdAt).toLocaleDateString()}
                </p>
              </div>

              <Link to={`/quiz/${quizItem.id}`} className="play-quiz-btn">
                <Play size={20} fill="currentColor" /> Jugar Quiz
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Quizzes;
