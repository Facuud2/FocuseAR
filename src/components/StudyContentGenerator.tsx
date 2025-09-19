// src/components/StudyContentGenerator.tsx
import React, { useState } from 'react';
import { Brain, BookOpen, Zap, Clock, AlertCircle } from 'lucide-react';
import './StudyContentGenerator.css';

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

interface StudyContentGeneratorProps {
  topic: string;
  subject: string;
  onContentGenerated: (content: StudyContent) => void;
  onClose: () => void;
}

const StudyContentGenerator: React.FC<StudyContentGeneratorProps> = ({
  topic,
  subject,
  onContentGenerated,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<
    'secundario' | 'universitario' | 'postgrado'
  >('universitario');

  const generateContent = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        'https://us-central1-proyecto-final-universitario.cloudfunctions.net/generateStudyContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            subject,
            level,
            contentType: 'complete',
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.content) {
        onContentGenerated(data.content);
      } else if (data.raw_response) {
        // Intentar parsear la respuesta raw
        try {
          const parsedContent = JSON.parse(data.raw_response);
          onContentGenerated(parsedContent);
        } catch {
          throw new Error('La IA generó contenido en formato incorrecto');
        }
      } else {
        throw new Error('No se pudo generar el contenido');
      }
    } catch (err) {
      console.error('Error generando contenido:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="study-content-generator-overlay">
      <div className="study-content-generator-modal">
        <div className="generator-header">
          <div className="generator-title">
            <Brain size={24} />
            <h2>Generar Contenido de Estudio</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="generator-content">
          <div className="topic-info">
            <div className="topic-display">
              <BookOpen size={20} />
              <div>
                <h3>{topic}</h3>
                <p>{subject}</p>
              </div>
            </div>
          </div>

          <div className="level-selector">
            <label>Nivel educativo:</label>
            <select
              value={level}
              onChange={(e) =>
                setLevel(
                  e.target.value as
                    | 'secundario'
                    | 'universitario'
                    | 'postgrado',
                )
              }
              disabled={isGenerating}
            >
              <option value="secundario">Secundario</option>
              <option value="universitario">Universitario</option>
              <option value="postgrado">Postgrado</option>
            </select>
          </div>

          <div className="content-preview">
            <h4>La IA generará:</h4>
            <div className="content-items">
              <div className="content-item">
                <BookOpen size={16} />
                <span>Resumen completo del tema</span>
              </div>
              <div className="content-item">
                <Zap size={16} />
                <span>5-7 conceptos clave con definiciones</span>
              </div>
              <div className="content-item">
                <Brain size={16} />
                <span>8-10 flashcards para memorización</span>
              </div>
              <div className="content-item">
                <AlertCircle size={16} />
                <span>4-5 preguntas de práctica</span>
              </div>
              <div className="content-item">
                <Clock size={16} />
                <span>Consejos de estudio personalizados</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="generator-actions">
            <button
              className="cancel-btn"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancelar
            </button>
            <button
              className="generate-btn"
              onClick={generateContent}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="loading-spinner" />
                  Generando...
                </>
              ) : (
                <>
                  <Brain size={16} />
                  Generar Contenido
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyContentGenerator;
