// src/components/StudyMaterialViewer.tsx
import React, { useState } from 'react';
import {
  BookOpen,
  Brain,
  Zap,
  HelpCircle,
  Link,
  Lightbulb,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import './StudyMaterialViewer.css';

interface StudyContent {
  topic: string;
  subject: string;
  level: string;
  summary: string;
  keyConcepts: Array<{
    concept: string;
    definition: string;
  }>;
  flashcards: Array<{
    question: string;
    answer: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  practiceQuestions: Array<{
    question: string;
    answer: string;
    type: 'application' | 'analysis' | 'synthesis';
  }>;
  connections: Array<{
    relatedTopic: string;
    relationship: string;
  }>;
  studyTips: string[];
  estimatedStudyTime: string;
}

interface StudyMaterialViewerProps {
  content: StudyContent;
  onClose: () => void;
  onGenerateNew: () => void;
  onCompleteTopicInPlan?: (planId: string, topicName: string) => void;
  currentPlanId?: string;
  currentTopicName?: string;
}

type ViewMode =
  | 'summary'
  | 'concepts'
  | 'flashcards'
  | 'questions'
  | 'connections'
  | 'tips';

const StudyMaterialViewer: React.FC<StudyMaterialViewerProps> = ({
  content,
  onClose,
  onGenerateNew,
  onCompleteTopicInPlan,
  currentPlanId,
  currentTopicName,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showQuestionAnswer, setShowQuestionAnswer] = useState(false);

  const handleCompleteAndClose = () => {
    // Si tenemos la información del plan y tema, marcamos como completado
    if (onCompleteTopicInPlan && currentPlanId && currentTopicName) {
      onCompleteTopicInPlan(currentPlanId, currentTopicName);
    }
    // Cerramos la ventana
    onClose();
  };

  const navigationItems = [
    { id: 'summary', label: 'Resumen', icon: BookOpen },
    { id: 'concepts', label: 'Conceptos', icon: Zap },
    { id: 'flashcards', label: 'Flashcards', icon: Brain },
    { id: 'questions', label: 'Preguntas', icon: HelpCircle },
    { id: 'connections', label: 'Conexiones', icon: Link },
    { id: 'tips', label: 'Consejos', icon: Lightbulb },
  ];

  const nextFlashcard = () => {
    if (currentFlashcard < content.flashcards.length - 1) {
      setCurrentFlashcard(currentFlashcard + 1);
      setShowFlashcardAnswer(false);
    }
  };

  const prevFlashcard = () => {
    if (currentFlashcard > 0) {
      setCurrentFlashcard(currentFlashcard - 1);
      setShowFlashcardAnswer(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < content.practiceQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowQuestionAnswer(false);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowQuestionAnswer(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'var(--accent-green)';
      case 'medium':
        return 'var(--accent-yellow)';
      case 'hard':
        return 'var(--accent-red)';
      default:
        return 'var(--text-color)';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'application':
        return 'Aplicación';
      case 'analysis':
        return 'Análisis';
      case 'synthesis':
        return 'Síntesis';
      default:
        return type;
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'summary':
        return (
          <div className="content-section">
            <div className="section-header">
              <BookOpen size={20} />
              <h3>Resumen del Tema</h3>
              <div className="study-time">
                <Clock size={16} />
                <span>{content.estimatedStudyTime}</span>
              </div>
            </div>
            <div className="summary-content">
              <p>{content.summary}</p>
            </div>
          </div>
        );

      case 'concepts':
        return (
          <div className="content-section">
            <div className="section-header">
              <Zap size={20} />
              <h3>Conceptos Clave</h3>
              <span className="count-badge">{content.keyConcepts.length}</span>
            </div>
            <div className="concepts-grid">
              {content.keyConcepts.map((concept, index) => (
                <div key={index} className="concept-card">
                  <h4>{concept.concept}</h4>
                  <p>{concept.definition}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'flashcards':
        return (
          <div className="content-section">
            <div className="section-header">
              <Brain size={20} />
              <h3>Flashcards</h3>
              <span className="count-badge">
                {currentFlashcard + 1} / {content.flashcards.length}
              </span>
            </div>
            {content.flashcards.length > 0 && (
              <div className="flashcard-container">
                <div
                  className={`flashcard ${showFlashcardAnswer ? 'flipped' : ''}`}
                >
                  <div className="flashcard-front">
                    <div className="flashcard-header">
                      <span
                        className="difficulty-badge"
                        style={{
                          backgroundColor: getDifficultyColor(
                            content.flashcards[currentFlashcard].difficulty,
                          ),
                        }}
                      >
                        {content.flashcards[currentFlashcard].difficulty}
                      </span>
                    </div>
                    <div className="flashcard-content">
                      <p>{content.flashcards[currentFlashcard].question}</p>
                    </div>
                    <button
                      className="reveal-btn"
                      onClick={() => setShowFlashcardAnswer(true)}
                    >
                      <Eye size={16} />
                      Ver Respuesta
                    </button>
                  </div>
                  <div className="flashcard-back">
                    <div className="flashcard-content">
                      <p>{content.flashcards[currentFlashcard].answer}</p>
                    </div>
                    <button
                      className="hide-btn"
                      onClick={() => setShowFlashcardAnswer(false)}
                    >
                      <EyeOff size={16} />
                      Ocultar
                    </button>
                  </div>
                </div>
                <div className="flashcard-controls">
                  <button
                    onClick={prevFlashcard}
                    disabled={currentFlashcard === 0}
                    className="nav-btn"
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </button>
                  <button
                    onClick={() => setShowFlashcardAnswer(false)}
                    className="reset-btn"
                  >
                    <RotateCcw size={16} />
                    Reiniciar
                  </button>
                  <button
                    onClick={nextFlashcard}
                    disabled={
                      currentFlashcard === content.flashcards.length - 1
                    }
                    className="nav-btn"
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'questions':
        return (
          <div className="content-section">
            <div className="section-header">
              <HelpCircle size={20} />
              <h3>Preguntas de Práctica</h3>
              <span className="count-badge">
                {currentQuestion + 1} / {content.practiceQuestions.length}
              </span>
            </div>
            {content.practiceQuestions.length > 0 && (
              <div className="question-container">
                <div className="question-card">
                  <div className="question-header">
                    <span className="question-type">
                      {getQuestionTypeLabel(
                        content.practiceQuestions[currentQuestion].type,
                      )}
                    </span>
                  </div>
                  <div className="question-content">
                    <h4>Pregunta:</h4>
                    <p>{content.practiceQuestions[currentQuestion].question}</p>

                    {showQuestionAnswer && (
                      <div className="answer-section">
                        <h4>Respuesta:</h4>
                        <p>
                          {content.practiceQuestions[currentQuestion].answer}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="question-actions">
                    {!showQuestionAnswer ? (
                      <button
                        className="reveal-btn"
                        onClick={() => setShowQuestionAnswer(true)}
                      >
                        <Eye size={16} />
                        Ver Respuesta
                      </button>
                    ) : (
                      <button
                        className="hide-btn"
                        onClick={() => setShowQuestionAnswer(false)}
                      >
                        <EyeOff size={16} />
                        Ocultar Respuesta
                      </button>
                    )}
                  </div>
                </div>
                <div className="question-controls">
                  <button
                    onClick={prevQuestion}
                    disabled={currentQuestion === 0}
                    className="nav-btn"
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </button>
                  <button
                    onClick={() => setShowQuestionAnswer(false)}
                    className="reset-btn"
                  >
                    <RotateCcw size={16} />
                    Reiniciar
                  </button>
                  <button
                    onClick={nextQuestion}
                    disabled={
                      currentQuestion === content.practiceQuestions.length - 1
                    }
                    className="nav-btn"
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'connections':
        return (
          <div className="content-section">
            <div className="section-header">
              <Link size={20} />
              <h3>Conexiones con Otros Temas</h3>
              <span className="count-badge">{content.connections.length}</span>
            </div>
            <div className="connections-list">
              {content.connections.map((connection, index) => (
                <div key={index} className="connection-card">
                  <h4>{connection.relatedTopic}</h4>
                  <p>{connection.relationship}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tips':
        return (
          <div className="content-section">
            <div className="section-header">
              <Lightbulb size={20} />
              <h3>Consejos de Estudio</h3>
              <span className="count-badge">{content.studyTips.length}</span>
            </div>
            <div className="tips-list">
              {content.studyTips.map((tip, index) => (
                <div key={index} className="tip-card">
                  <div className="tip-number">{index + 1}</div>
                  <p>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="study-material-viewer-overlay">
      <div className="study-material-viewer">
        <div className="viewer-header">
          <div className="topic-info">
            <h2>{content.topic}</h2>
            <p>
              {content.subject} • Nivel {content.level}
            </p>
          </div>
          <div className="header-actions">
            <button className="regenerate-btn" onClick={onGenerateNew}>
              <RotateCcw size={16} />
              Regenerar
            </button>
            <button className="complete-btn" onClick={handleCompleteAndClose}>
              ✓ Completar tema
            </button>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="viewer-body">
          <nav className="content-navigation">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${viewMode === item.id ? 'active' : ''}`}
                  onClick={() => setViewMode(item.id as ViewMode)}
                >
                  <IconComponent size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="content-area">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default StudyMaterialViewer;
