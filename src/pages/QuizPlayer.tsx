import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '../hooks/useDatabase';
import { AuthContext } from '../hooks/authContext';
import { Timestamp } from 'firebase/firestore';
import './QuizPlayer.css';

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
  createdAt: string | Timestamp | Date;
  updatedAt?: Timestamp;
}

const QuizPlayer: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useContext(AuthContext);
  const { getQuiz } = useDatabase();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const navigate = useNavigate(); // Moved to top level
  const { saveQuizResult, getBestQuizScore } = useDatabase();

  // Helper function to convert Firestore timestamp to string
  const formatDate = (date: string | Timestamp | Date | undefined): string => {
    if (!date) return new Date().toISOString();
    if (date instanceof Date) {
      return date.toISOString();
    }
    if (typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toISOString();
    }
    return date as string;
  };

  // Type predicate to check if data is a valid Quiz
  // Nota: los quizzes en Firestore pueden tener distintos shapes según
  // la función que los creó. Aquí validamos de forma tolerante y
  // normalizamos posteriormente.
  const isValidQuiz = (data: unknown): data is Quiz => {
    if (!data || typeof data !== 'object') return false;
    if (
      !('questions' in data) ||
      !Array.isArray((data as { questions?: unknown }).questions)
    )
      return false;
    if (!('createdAt' in data)) return false;
    // userId y materialId pueden faltar en algunas versiones; lo toleramos
    return true;
  };

  useEffect(() => {
    const loadQuiz = async () => {
      if (!user || !quizId) return;
      try {
        const quizData = await getQuiz(quizId);

        if (!quizData) {
          throw new Error('No se pudo cargar el quiz');
        }

        // Ensure we have all required fields
        if (!isValidQuiz(quizData)) {
          throw new Error('Datos del quiz inválidos');
        }

        // Normalizar preguntas: soportar legacy shapes
        const normalizeQuestion = (q: unknown): QuizQuestion | null => {
          if (!q || typeof q !== 'object') return null;
          const obj = q as Record<string, unknown>;

          // Caso 1: nuevo formato (frontend espera esto)
          if (
            typeof obj.question === 'string' &&
            Array.isArray(obj.options) &&
            typeof obj.correctAnswer === 'string'
          ) {
            return {
              question: obj.question as string,
              options: obj.options as string[],
              correctAnswer: obj.correctAnswer as string,
            };
          }

          // Caso 2: formato con questionText y correctAnswerIndex
          if (
            typeof obj.questionText === 'string' &&
            Array.isArray(obj.options) &&
            typeof obj.correctAnswerIndex === 'number'
          ) {
            const idx = obj.correctAnswerIndex as number;
            const options = obj.options as string[];
            const correct = options && options[idx] ? options[idx] : '';
            return {
              question: obj.questionText as string,
              options: options,
              correctAnswer: correct,
            };
          }

          // Caso 3: mix (questionText + correctAnswer)
          if (
            typeof obj.questionText === 'string' &&
            Array.isArray(obj.options) &&
            typeof obj.correctAnswer === 'string'
          ) {
            return {
              question: obj.questionText as string,
              options: obj.options as string[],
              correctAnswer: obj.correctAnswer as string,
            };
          }

          // Caso 4: question + correctAnswerIndex
          if (
            typeof obj.question === 'string' &&
            Array.isArray(obj.options) &&
            typeof obj.correctAnswerIndex === 'number'
          ) {
            const idx = obj.correctAnswerIndex as number;
            const options = obj.options as string[];
            const correct = options && options[idx] ? options[idx] : '';
            return {
              question: obj.question as string,
              options: options,
              correctAnswer: correct,
            };
          }

          // No se pudo normalizar
          return null;
        };

        const normalizedQuestions: QuizQuestion[] = (quizData.questions || [])
          .map(normalizeQuestion)
          .filter(Boolean) as QuizQuestion[];

        if (!normalizedQuestions || normalizedQuestions.length === 0) {
          throw new Error('El quiz no contiene preguntas válidas');
        }

        // Create a properly typed quiz object
        const formattedQuiz: Quiz = {
          id: quizData.id,
          questions: normalizedQuestions,
          subjectName: quizData.subjectName || 'Sin título',
          materialId: quizData.materialId || '',
          userId: quizData.userId || '',
          createdAt: formatDate(quizData.createdAt),
        };

        setQuiz(formattedQuiz);
      } catch (error) {
        console.error('Error loading quiz:', error);
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [user, quizId, getQuiz]);

  const handleAnswer = (answer: string) => {
    if (showAnswer) return;

    setSelectedAnswer(answer);
    if (quiz && answer === quiz.questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }
    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    setShowAnswer(false);
    setSelectedAnswer(null);
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };
  // Compute whether the quiz is finished safely (quiz may be null during initial renders)
  const isFinished = quiz
    ? currentQuestionIndex >= quiz.questions.length
    : false;

  // When quiz finishes, save the attempt and fetch the user's best score.
  useEffect(() => {
    if (!quiz || !isFinished || completed) return;

    let cancelled = false;

    const doSaveAndFetch = async () => {
      try {
        if (quiz.id) await saveQuizResult(quiz.id, score);
        if (quiz.id) {
          const best = await getBestQuizScore(quiz.id);
          if (!cancelled && best) setBestScore(best.score);
        }
      } catch (e) {
        console.error('Error saving/fetching quiz results:', e);
      } finally {
        if (!cancelled) setCompleted(true);
      }
    };

    doSaveAndFetch();

    return () => {
      cancelled = true;
    };
  }, [quiz, isFinished, completed, score, saveQuizResult, getBestQuizScore]);

  if (loading) {
    return <div>Cargando quiz...</div>;
  }

  if (!quiz) {
    return <div>Quiz no encontrado.</div>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  if (isFinished) {
    return (
      <div className="quiz-results-container">
        <h2>¡Quiz completado!</h2>
        <p>
          Tu puntuación: {score} de {quiz.questions.length}
        </p>
        {bestScore !== null && (
          <p className="best-score">
            Mejor puntuación: {bestScore} de {quiz.questions.length}
          </p>
        )}
        <div className="results-actions">
          <button
            onClick={() => {
              // Reset state to retry
              setScore(0);
              setCurrentQuestionIndex(0);
              setShowAnswer(false);
              setSelectedAnswer(null);
              setCompleted(false);
              setBestScore(null);
            }}
          >
            Volver a intentar
          </button>
          <button onClick={() => navigate('/quizzes')}>Finalizar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-player-container">
      <h2>{quiz.subjectName}</h2>
      <div className="question-container">
        <h3>{currentQuestion.question}</h3>
        <div className="options-container">
          {currentQuestion.options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className={`option-button ${
                showAnswer && option === currentQuestion.correctAnswer
                  ? 'correct'
                  : ''
              } ${
                showAnswer &&
                selectedAnswer === option &&
                option !== currentQuestion.correctAnswer
                  ? 'incorrect'
                  : ''
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      {showAnswer && (
        <div className="answer-container">
          <p>La respuesta correcta es: {currentQuestion.correctAnswer}</p>
          <button onClick={handleNextQuestion}>Siguiente</button>
        </div>
      )}
    </div>
  );
};

export default QuizPlayer;
