import React, { useState, useEffect, useContext, useRef } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { AuthContext } from '../hooks/authContext';
import { PDFProcessor } from '../services/PDFProcessor';
import { extractTextFromPDF } from '../services/PDFTextExtractor';
import SelectorDeColor from './SelectorDeColor';
import { AnalysisModal } from './AnalysisModal';
import 'react-datepicker/dist/react-datepicker.css';
import './Subjects.css';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Pdf {
  id: number;
  name: string;
  size: string;
}

interface Subject {
  id: string | number;
  name: string;
  examDate: string;
  color: string;
  pdfs: Pdf[];
  importantDates: {
    name: string;
    date: string;
    type: 'exam' | 'tp' | 'other';
  }[];
}

interface AnalysisState {
  isAnalyzing: boolean;
  progress: number;
  statusMessage: string;
}

const Subjects: React.FC = () => {
  const { user } = useContext(AuthContext);
  const {
    loading: dbLoading,
    getUserMaterials,
    createMaterial,
    deleteMaterialAndPlans,
  } = useDatabase();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4285F4');
  const [firstPartialDate, setFirstPartialDate] = useState<Date | null>(null);
  const [secondPartialDate, setSecondPartialDate] = useState<Date | null>(null);
  const [tpDate, setTpDate] = useState<Date | null>(null);
  const [otherDates, setOtherDates] = useState<
    { id: number; name: string; date: Date | null }[]
  >([]);

  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analysisStatus, setAnalysisStatus] = useState<AnalysisState>({
    isAnalyzing: false,
    progress: 0,
    statusMessage: '',
  });

  const [analysisSuccess, setAnalysisSuccess] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);

  const updateAnalysisStatus = (status: Partial<AnalysisState>) => {
    setAnalysisStatus((prev) => ({ ...prev, ...status }));
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      try {
        const materials = await getUserMaterials();
        const convertedSubjects: Subject[] = materials.map(
          (material, index) => {
            const subjectId = material.id || `subject-${Date.now()}-${index}`;
            return {
              id: subjectId,
              name:
                material.subjectName ||
                material.fileName.replace(/\.(pdf|docx|doc)$/i, ''),
              examDate: material.examDate || '',
              color: material.color || '#4285F4',
              pdfs: [
                {
                  id: 1,
                  name: material.fileName,
                  size: '0 MB',
                },
              ],
              importantDates: material.importantDates || [],
            };
          },
        );
        setSubjects(convertedSubjects);
      } catch (error: unknown) {
        console.error('Error al cargar datos del usuario:', error);
      }
    };
    loadUserData();
  }, [user, getUserMaterials]);

  const handlePlanify = async () => {
    if (!analysisSuccess) {
      alert(
        'No se puede cargar la materia porque el análisis del PDF falló. Por favor, intenta con otro archivo.',
      );
      return;
    }

    if (isUploading) {
      return;
    }

    const importantDates: {
      name: string;
      date: string;
      type: 'exam' | 'tp' | 'other';
    }[] = [];
    if (firstPartialDate)
      importantDates.push({
        name: 'Primer Parcial',
        date: format(firstPartialDate, 'yyyy-MM-dd'),
        type: 'exam',
      });
    if (secondPartialDate)
      importantDates.push({
        name: 'Segundo Parcial',
        date: format(secondPartialDate, 'yyyy-MM-dd'),
        type: 'exam',
      });
    if (tpDate)
      importantDates.push({
        name: 'Trabajo Práctico',
        date: format(tpDate, 'yyyy-MM-dd'),
        type: 'tp',
      });
    otherDates.forEach((d) => {
      if (d.name && d.date)
        importantDates.push({
          name: d.name,
          date: format(d.date, 'yyyy-MM-dd'),
          type: 'other',
        });
    });

    if (!subjectName || pdfs.length === 0 || importantDates.length === 0) {
      alert('Completa el nombre, sube un PDF y añade al menos una fecha.');
      return;
    }

    setIsUploading(true);

    try {
      if (pdfs.length > 0) {
        const materialId = await createMaterial({
          fileName: pdfs[0].name,
          subjectName: subjectName,
          storagePath: `materials/${user?.uid}/${pdfs[0].name}`,
          fileType: 'pdf',
          color: selectedColor,
        });

        if (materialId) {
          const newSubject: Subject = {
            id: Date.now(),
            name: subjectName,
            examDate:
              importantDates.length > 0
                ? importantDates.map((d) => d.date).sort()[0]
                : '',
            color: selectedColor,
            pdfs,
            importantDates,
          };

          setSubjects([...subjects, newSubject]);
          setSubjectName('');
          setPdfs([]);
          setFirstPartialDate(null);
          setSecondPartialDate(null);
          setTpDate(null);
          setOtherDates([]);
          alert('Materia añadida exitosamente y guardada en Firebase!');
        }
      }
    } catch (error: unknown) {
      console.error('Error al guardar materia en Firebase:', error);
      alert('Error al guardar la materia. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const addOtherDate = () => {
    const newDate = {
      id: Date.now(),
      name: '',
      date: null,
    };
    setOtherDates([...otherDates, newDate]);
  };

  const updateOtherDate = (
    id: number,
    field: 'name' | 'date',
    value: string | Date | null,
  ) => {
    setOtherDates(
      otherDates.map((d) => {
        if (d.id === id) {
          return { ...d, [field]: value };
        }
        return d;
      }),
    );
  };

  const removeOtherDate = (id: number) => {
    setOtherDates(otherDates.filter((d) => d.id !== id));
  };

  const deleteSubject = async (subjectId: string | number) => {
    try {
      const materials = await getUserMaterials();
      const firebaseMaterial = materials.find((material) => {
        return material.id === subjectId || material.id === String(subjectId);
      });
      if (firebaseMaterial && firebaseMaterial.id) {
        await deleteMaterialAndPlans(firebaseMaterial.id);
      }
      setSubjects((prevSubjects) => {
        const newSubjects = prevSubjects.filter(
          (subject) => subject.id !== subjectId,
        );
        return newSubjects;
      });
    } catch (error: unknown) {
      console.error('❌ Error al eliminar materia:', error);
      alert('Error al eliminar la materia. Inténtalo de nuevo.');
    }
  };

  const handlePdfUpload = async (file: File) => {
    if (!subjectName.trim()) {
      alert('Por favor ingresa el nombre de la materia antes de subir el PDF');
      // Reset file input to allow re-selection
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);
    setAnalysisSuccess(false);

    const newPdf = {
      id: Date.now(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
    };
    setPdfs([newPdf]); // Only allow one PDF at a time

    updateAnalysisStatus({
      isAnalyzing: true,
      progress: 10,
      statusMessage: 'Extrayendo texto del PDF...',
    });

    try {
      const text = await extractTextFromPDF(file);
      updateAnalysisStatus({
        progress: 40,
        statusMessage: 'Enviando texto a la IA...',
      });
      const result = await PDFProcessor.processPDFTextWithGemini(
        text,
        subjectName,
      );
      if (result.success) {
        updateAnalysisStatus({
          progress: 100,
          statusMessage: '¡Análisis completado!',
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
        alert(
          `¡Éxito! Se extrajeron ${result.topics.length} temas del PDF. Ahora puedes guardar la materia.`,
        );
        setAnalysisSuccess(true);
      } else {
        alert(`Error procesando PDF: ${result.error}`);
        throw new Error(result.error);
      }
    } catch (e) {
      alert('Error procesando el PDF. Inténtalo de nuevo.');
      console.error('Error durante el análisis del PDF:', e);
      setAnalysisSuccess(false);
      setPdfs([]); // Clear the PDF list on failure
    } finally {
      setTimeout(() => {
        updateAnalysisStatus({
          isAnalyzing: false,
          progress: 0,
          statusMessage: '',
        });
        setIsUploading(false);
      }, 500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handlePdfUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (isUploading) return;
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf',
    );
    if (files.length > 0) {
      handlePdfUpload(files[0]);
    }
  };

  const removePdf = (id: number) => {
    setPdfs(pdfs.filter((p) => p.id !== id));
    setAnalysisSuccess(false); // Reset analysis state if PDF is removed
  };

  return (
    <div className="subjects-container">
      {/* ===== COLUMNA IZQUIERDA ===== */}
      <div className="subjects-left-column">
        <div className="panel">
          <h2>
            <i className="fas fa-book"></i> Nueva Materia
          </h2>
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Ej: Álgebra Lineal"
              disabled={isUploading}
            />
            <div className="dates-section">
              <h4
                style={{
                  marginBottom: '15px',
                  color: '#333',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                Fechas Importantes
              </h4>
              <div className="form-group">
                <label>Fecha Primer Parcial</label>
                <DatePicker
                  selected={firstPartialDate}
                  onChange={(date: Date | null) => setFirstPartialDate(date)}
                  dateFormat="P"
                  locale={es}
                  className="date-picker-input" // Use a consistent class name
                  placeholderText="Selecciona una fecha"
                  minDate={new Date()}
                  disabled={isUploading}
                />
              </div>
              {otherDates.map((otherDate, index) => (
                <div
                  key={`other-date-${otherDate.id || index}`}
                  className="form-group"
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'end',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label>Nombre del Evento</label>
                    <input
                      type="text"
                      placeholder="ej: Entrega Proyecto Final"
                      value={otherDate.name}
                      onChange={(e) =>
                        updateOtherDate(otherDate.id, 'name', e.target.value)
                      }
                      disabled={isUploading}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Fecha</label>
                    <DatePicker
                      selected={otherDate.date}
                      onChange={(date: Date | null) =>
                        updateOtherDate(otherDate.id, 'date', date)
                      }
                      dateFormat="P"
                      locale={es}
                      className="date-picker-input" // Use a consistent class name
                      placeholderText="Selecciona una fecha"
                      minDate={new Date()}
                      disabled={isUploading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOtherDate(otherDate.id)}
                    disabled={isUploading}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOtherDate}
                disabled={isUploading}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 15px',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginTop: '10px',
                }}
              >
                + Agregar OTROS
              </button>
            </div>
            <div className="form-group">
              <label>Color</label>
              <div
                className="color-options"
                style={{ display: 'flex', gap: '8px' }}
              >
                {['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#9b59b6'].map(
                  (c) => (
                    <div
                      key={c}
                      className={`color-option ${selectedColor === c ? 'selected' : ''}`}
                      style={{
                        backgroundColor: c,
                        width: '36px',
                        height: '36px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border:
                          selectedColor === c
                            ? '2px solid #000'
                            : '1px solid #ccc',
                      }}
                      onClick={() => setSelectedColor(c)}
                    />
                  ),
                )}
                <div style={{ position: 'relative' }}>
                  <SelectorDeColor
                    color={selectedColor}
                    onChange={setSelectedColor}
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '36px',
                    height: '36px',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                  title="Elegir color"
                >
                  ...
                </div>
              </div>
            </div>
          </div>
          <div className="pdf-section">
            <h3>
              <i className="fas fa-file-pdf"></i> Programa de la materia (PDF)
            </h3>
            <div
              className={`upload-area${dragActive ? ' dragover' : ''} ${isUploading ? 'uploading' : ''}`}
              onClick={() => {
                if (!isUploading && fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isUploading) {
                  setDragActive(true);
                }
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              style={{
                cursor: isUploading ? 'wait' : 'pointer',
                opacity: isUploading ? 0.7 : 1,
                position: 'relative',
              }}
            >
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={isUploading}
                ref={fileInputRef}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M24 32V18M24 18L18 24M24 18L30 24"
                    stroke="#4285F4"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M36 36H12C8.68629 36 6 33.3137 6 30C6 26.6863 8.68629 24 12 24H14.5C15.3284 24 16 23.3284 16 22.5C16 19.4624 18.4624 17 21.5 17C23.9853 17 26 19.0147 26 21.5V22.5C26 23.3284 26.6716 24 27.5 24H36C39.3137 24 42 26.6863 42 30C42 33.3137 39.3137 36 36 36Z"
                    stroke="#4285F4"
                    strokeWidth="2"
                  />
                </svg>
                <span
                  style={{
                    marginTop: '10px',
                    color: isUploading ? '#f59e0b' : '#4285F4',
                    fontWeight: '500',
                    fontSize: '15px',
                    textAlign: 'center',
                  }}
                >
                  {isUploading
                    ? '🤖 Procesando PDF con IA...'
                    : 'Haz click o arrastra el contenido de la materia'}
                </span>
              </div>
              {pdfs.length > 0 && (
                <div style={{ width: '100%', marginTop: '15px' }}>
                  <h4
                    style={{
                      margin: '10px 0',
                      fontSize: '14px',
                      color: '#4B5563',
                    }}
                  >
                    Archivos cargados:
                  </h4>
                  <div
                    style={{
                      maxHeight: '150px',
                      overflowY: 'auto',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '8px',
                    }}
                  >
                    {pdfs.map((pdf, index) => (
                      <div
                        key={`pdf-${pdf.id || index}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 10px',
                          backgroundColor: '#F9FAFB',
                          marginBottom: '6px',
                          borderRadius: '4px',
                          borderLeft: '3px solid #3B82F6',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                              fill="#EF4444"
                            />
                            <path d="M14 2V8H20" fill="#FECACA" />
                            <path d="M14 2L20 8H14V2Z" fill="#FCA5A5" />
                          </svg>
                          <span style={{ fontSize: '13px' }}>{pdf.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#6B7280',
                              marginRight: '8px',
                            }}
                          >
                            {pdf.size}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removePdf(pdf.id);
                            }}
                            disabled={isUploading}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              cursor: isUploading ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                '#FEE2E2')
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                'transparent')
                            }
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            className="planify-btn"
            onClick={handlePlanify}
            disabled={dbLoading || !user || isUploading || !analysisSuccess}
          >
            {isUploading ? (
              <span>⏳ Procesando PDF...</span>
            ) : dbLoading ? (
              <span>⏳ Guardando...</span>
            ) : (
              <span>
                <i className="fas fa-upload"></i> Cargar materia
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ===== COLUMNA DERECHA ===== */}
      <div className="subjects-right-column">
        <div className="panel subjects-list-panel">
          <h2>
            <i className="fas fa-list"></i> Mis Materias
          </h2>
          {subjects.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-book-open"></i>
              <p>No hay materias planificadas</p>
              <small>Agrega tu primera materia a la izquierda</small>
            </div>
          ) : (
            <div className="subjects-grid">
              {subjects.map((subject, index) => {
                const initial = subject.name.charAt(0).toUpperCase();
                return (
                  <div
                    key={`subject-${subject.id || index}`}
                    className="subject-card"
                  >
                    <div className="subject-header">
                      <div
                        className="subject-icon"
                        style={{ backgroundColor: subject.color }}
                      >
                        <span>{initial}</span>
                      </div>
                      <div className="subject-info">
                        <h3 className="subject-name">{subject.name}</h3>
                        <p className="subject-date">
                          <i className="fas fa-calendar-alt"></i>
                          {subject.examDate && subject.examDate !== ''
                            ? new Date(subject.examDate).toLocaleDateString(
                                'es-ES',
                              )
                            : 'Fecha no definida'}
                        </p>
                      </div>
                    </div>
                    <div className="subject-footer">
                      <span className="pdf-count">
                        <i className="fas fa-file-pdf"></i>
                        {subject.pdfs.length} PDF(s)
                      </span>
                      <div className="subject-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, (subject.pdfs.length / 5) * 100)}%`,
                              backgroundColor: subject.color,
                            }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {subject.pdfs.length}/5
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `¿Estás seguro de que quieres eliminar la materia "${subject.name}" y todos sus planes de estudio asociados?`,
                            )
                          ) {
                            deleteSubject(subject.id);
                          }
                        }}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '8px',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ef4444';
                        }}
                      >
                        <i className="fas fa-trash"></i>
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <AnalysisModal
          isAnalyzing={analysisStatus.isAnalyzing}
          progress={analysisStatus.progress}
          statusMessage={analysisStatus.statusMessage}
        />
      </div>
    </div>
  );
};

export default Subjects;
