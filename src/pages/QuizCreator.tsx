import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../hooks/authContext';
import { useDatabase } from '../hooks/useDatabase';
import { extractTextFromPDF } from '../services/PDFTextExtractor';
import toast from 'react-hot-toast';
import './QuizCreator.css';

const QuizCreator: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { createMaterial } = useDatabase(); // To save the material if a new one is uploaded
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [quizType, setQuizType] = useState<
    'multiple-choice' | 'flashcard' | ''
  >('');
  const [subjectName, setSubjectName] = useState('');
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMaterialFile(file);
      setLoading(true);
      setError(null);
      try {
        const text = await extractTextFromPDF(file);
        setExtractedText(text);
        toast.success('Texto extraído del PDF con éxito!');
      } catch (err) {
        console.error('Error extracting text:', err);
        setError('Error al extraer texto del PDF.');
        toast.error('Error al extraer texto del PDF.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNext = () => {
    if (step === 1 && !quizType) {
      setError('Por favor, selecciona un tipo de quiz.');
      return;
    }
    if (step === 2 && (!subjectName || !materialFile)) {
      setError(
        'Por favor, ingresa el nombre de la materia y sube un material.',
      );
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user || !extractedText || !materialFile || !quizType || !subjectName) {
      setError('Faltan datos para generar el quiz.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, save the material metadata if it's a new upload
      const materialId = await createMaterial({
        fileName: materialFile.name,
        subjectName: subjectName,
        storagePath: `materials/${user.uid}/${materialFile.name}`, // This needs to be handled by actual file upload to Firebase Storage
        fileType: materialFile.type,
      });

      if (!materialId) {
        throw new Error('Error al guardar los metadatos del material.');
      }

      const endpoint = import.meta.env
        .VITE_GENERATE_QUIZ_FROM_MATERIAL_ENDPOINT;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId: materialId,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el quiz.');
      }

      toast.success('Quiz generado con éxito!');
      navigate('/quizzes');
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error desconocido al generar el quiz.',
      );
      toast.error(
        err instanceof Error
          ? err.message
          : 'Error desconocido al generar el quiz.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-creator-container">
      <h2>Crear Nuevo Quiz o Flashcards</h2>
      {error && <div className="error-message">{error}</div>}

      {step === 1 && (
        <div className="quiz-creator-step">
          <h3>Paso 1: Selecciona el tipo de contenido</h3>
          <div className="quiz-type-selection">
            <button
              className={`type-button ${quizType === 'multiple-choice' ? 'selected' : ''}`}
              onClick={() => setQuizType('multiple-choice')}
            >
              Quiz de Opción Múltiple
            </button>
            <button
              className={`type-button ${quizType === 'flashcard' ? 'selected' : ''}`}
              onClick={() => setQuizType('flashcard')}
            >
              Flashcards de Conceptos
            </button>
          </div>
          <button onClick={handleNext} disabled={!quizType}>
            Siguiente
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="quiz-creator-step">
          <h3>Paso 2: Sube tu material de estudio</h3>
          <input
            type="text"
            placeholder="Nombre de la Materia"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
          />
          <input type="file" accept=".pdf" onChange={handleFileChange} />
          {loading && <p>Procesando archivo...</p>}
          {extractedText && <p>Texto extraído. Listo para generar.</p>}
          <div className="quiz-creator-actions">
            <button onClick={handleBack}>Atrás</button>
            <button
              onClick={handleNext}
              disabled={!extractedText || !subjectName}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="quiz-creator-step">
          <h3>Paso 3: Confirma y Genera</h3>
          <p>
            Tipo de Quiz:{' '}
            <strong>
              {quizType === 'multiple-choice'
                ? 'Opción Múltiple'
                : 'Flashcards'}
            </strong>
          </p>
          <p>
            Materia: <strong>{subjectName}</strong>
          </p>
          <p>
            Archivo: <strong>{materialFile?.name}</strong>
          </p>
          <div className="quiz-creator-actions">
            <button onClick={handleBack}>Atrás</button>
            <button onClick={handleSubmit} disabled={loading}>
              Generar {quizType === 'multiple-choice' ? 'Quiz' : 'Flashcards'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizCreator;
