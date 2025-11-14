import React, { useState, useEffect, useContext } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { AuthContext } from '../hooks/authContext';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import './QuizzesDashboard.css'; // For dashboard specific styles

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
  const { getQuizzes, deleteQuiz, getBestQuizScore } = useDatabase();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
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
        // Fetch best scores for each quiz in background
        try {
          const scoresMap: Record<string, number> = {};
          await Promise.all(
            (userQuizzes || []).map(async (q) => {
              if (!q.id) return;
              try {
                const best = await getBestQuizScore(q.id);
                if (best && typeof best.score === 'number') {
                  scoresMap[q.id!] = best.score;
                }
              } catch (e) {
                console.warn(
                  'No se pudo obtener mejor puntuación para quiz',
                  q.id,
                  e,
                );
              }
            }),
          );
          setBestScores(scoresMap);
        } catch (e) {
          console.warn('Error fetching best scores', e);
        }
      } catch (error) {
        console.error('Error loading quizzes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadQuizzes();
  }, [user, getQuizzes, deleteQuiz, getBestQuizScore]);

  // Define a type for Firestore Timestamp-like objects
  interface FirestoreTimestamp {
    toDate: () => Date;
    seconds?: number;
    nanoseconds?: number;
  }

  // Helper function to safely convert to Date with better error handling
  const toDate = (date: unknown): Date => {
    try {
      // If it's already a Date, return it
      if (date instanceof Date) return date;

      // If it's a Firebase Timestamp or similar object with toDate method
      if (
        date &&
        typeof date === 'object' &&
        'toDate' in date &&
        typeof (date as FirestoreTimestamp).toDate === 'function'
      ) {
        return (date as FirestoreTimestamp).toDate();
      }

      // If it's a string, try to parse it
      if (typeof date === 'string') {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) return parsed;
      }

      // If it's a number, assume it's a timestamp
      if (typeof date === 'number') {
        return new Date(date);
      }

      // If it's an object with seconds (Firestore timestamp format)
      if (
        date &&
        typeof date === 'object' &&
        'seconds' in date &&
        typeof (date as FirestoreTimestamp).seconds === 'number'
      ) {
        return new Date((date as FirestoreTimestamp).seconds! * 1000);
      }

      console.warn(
        'Could not parse date, using current date as fallback:',
        date,
      );
      return new Date(); // Fallback to current date
    } catch (error) {
      console.error(
        'Error parsing date, using current date as fallback:',
        error,
      );
      return new Date(); // Fallback to current date
    }
  };

  const filteredQuizzes = quizzes
    .filter(() => {
      if (filter === 'all') return true;
      // Add more filter logic here (e.g., by type, by subject)
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
            {/* Add more filter options dynamically based on quiz types/subjects */}
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
            {/* Add more sort options */}
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
              <h3>{quizItem.subjectName}</h3>
              <p>{quizItem.questions.length} preguntas</p>
              <p className="quiz-type">Tipo: Quiz</p>{' '}
              {/* Placeholder for quiz type */}
              <p className="quiz-date">
                Creado: {toDate(quizItem.createdAt).toLocaleDateString()}
              </p>
              {quizItem.id && bestScores[quizItem.id] !== undefined && (
                <p className="quiz-best-score">
                  Mejor puntuación: {bestScores[quizItem.id]} preguntas
                </p>
              )}
              <Link to={`/quiz/${quizItem.id}`} className="play-quiz-btn">
                Jugar
              </Link>
              <button
                onClick={() => quizItem.id && handleDeleteQuiz(quizItem.id)}
                className="delete-quiz-btn"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Quizzes;
