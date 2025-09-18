import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useDatabase } from '../hooks/useDatabase';
import { AuthContext } from '../hooks/authContext';
import './QuizPlayer.css';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  questions: QuizQuestion[];
  subjectName: string;
  materialId: string;
  userId: string;
  createdAt: string;
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

  useEffect(() => {
    const loadQuiz = async () => {
      if (!user || !quizId) return;
      try {
        const quizData = await getQuiz(quizId);
        setQuiz(quizData);
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
