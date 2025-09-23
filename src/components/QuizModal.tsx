import React, { useState, useEffect } from 'react';
import './QuizModal.css';

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

interface QuizModalProps {
  subject: {
    id: string;
    name: string;
    // Add other properties of subject if needed
  };
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ subject, onClose }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    const generateQuiz = async () => {
      try {
        const response = await fetch(
          'http://localhost:5001/focusear-copy/us-central1/generateQuizFromMaterial',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ materialId: subject.id }),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to generate quiz');
        }

        const data = await response.json();
        setQuiz(data.quiz);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    generateQuiz();
  }, [subject]);

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
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal">
          <h2>Generando Quiz...</h2>
          <p>La IA está trabajando para crear tu quiz. ¡Espera un momento!</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal">
          <h2>Error</h2>
          <p>
            No se pudo generar el quiz. Por favor, inténtalo de nuevo más tarde.
          </p>
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal">
          <h2>¡Quiz completado!</h2>
          <p>
            Tu puntuación final es: {score} de {quiz.questions.length}
          </p>
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-modal-overlay">
      <div className="quiz-modal">
        <h2>Quiz: {subject.name}</h2>
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
        <button onClick={onClose} className="close-button">
          Cerrar
        </button>
      </div>
    </div>
  );
};
