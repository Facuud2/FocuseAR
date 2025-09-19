import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
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
  const isValidQuiz = (data: unknown): data is Quiz => {
    // Check if data is an object and not null
    if (!data || typeof data !== 'object') return false;

    // Type assertion with proper type checking
    const hasQuestions =
      'questions' in data &&
      Array.isArray((data as { questions: unknown }).questions);
    const hasSubjectName =
      'subjectName' in data &&
      typeof (data as { subjectName: unknown }).subjectName === 'string';
    const hasMaterialId =
      'materialId' in data &&
      typeof (data as { materialId: unknown }).materialId === 'string';
    const hasUserId =
      'userId' in data &&
      typeof (data as { userId: unknown }).userId === 'string';

    // Check createdAt field (can be string, Date, or Timestamp)
    const hasValidCreatedAt =
      'createdAt' in data &&
      (typeof (data as { createdAt: unknown }).createdAt === 'string' ||
        (data as { createdAt: unknown }).createdAt instanceof Date ||
        (typeof (data as { createdAt: unknown }).createdAt === 'object' &&
          (data as { createdAt: object }).createdAt !== null &&
          'toDate' in (data as { createdAt: { toDate?: unknown } }).createdAt));

    return (
      hasQuestions &&
      hasSubjectName &&
      hasMaterialId &&
      hasUserId &&
      hasValidCreatedAt
    );
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

        // Create a properly typed quiz object
        const formattedQuiz: Quiz = {
          ...quizData,
          questions: quizData.questions || [],
          subjectName: quizData.subjectName || 'Sin título',
          materialId: quizData.materialId || '',
          userId: quizData.userId || '',
          createdAt: formatDate(quizData.createdAt),
          id: quizData.id,
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

  if (loading) {
    return <div>Cargando quiz...</div>;
  }

  if (!quiz) {
    return <div>Quiz no encontrado.</div>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div>
        <h2>¡Quiz completado!</h2>
        <p>
          Tu puntuación final es: {score} de {quiz.questions.length}
        </p>
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
