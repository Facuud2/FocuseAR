import React, { useState, useCallback, useRef } from 'react';
import './Documents.css';
import {
  FileText,
  Upload,
  Trash2,
  Folder,
  Search,
  CheckCircle,
  AlertCircle,
  Download,
} from 'lucide-react';

interface Document {
  id: number;
  name: string;
  size: string;
  subject: string;
  uploadProgress: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
}

const initialDocuments: Document[] = [
  {
    id: 1,
    name: 'Clase-1-Matematicas.pdf',
    size: '2.4 MB',
    subject: 'Matemáticas',
    uploadProgress: 100,
    uploadStatus: 'completed',
  },
  {
    id: 2,
    name: 'Resumen-Historia.docx',
    size: '800 KB',
    subject: 'Historia',
    uploadProgress: 100,
    uploadStatus: 'completed',
  },
  {
    id: 3,
    name: 'Quimica-Organica.pdf',
    size: '5.1 MB',
    subject: 'Química',
    uploadProgress: 100,
    uploadStatus: 'completed',
  },
  {
    id: 4,
    name: 'Introduccion-Fisica.pdf',
    size: '1.2 MB',
    subject: 'Física',
    uploadProgress: 100,
    uploadStatus: 'completed',
  },
];

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    uploadFiles(files);
  };

  const uploadFiles = useCallback((files: File[]) => {
    const newDocs: Document[] = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      subject: 'Sin asignar', // Puedes implementar la asignación de materia si es necesario
      uploadProgress: 0,
      uploadStatus: 'pending',
    }));

    setDocuments((prevDocs) => [...prevDocs, ...newDocs]);

    newDocs.forEach((doc) => {
      // Simulación de carga de archivo
      const interval = setInterval(() => {
        setDocuments((prevDocs) =>
          prevDocs.map((d) => {
            if (d.id === doc.id) {
              const newProgress = d.uploadProgress + 10;
              if (newProgress >= 100) {
                clearInterval(interval);
                return { ...d, uploadProgress: 100, uploadStatus: 'completed' };
              }
              return {
                ...d,
                uploadProgress: newProgress,
                uploadStatus: 'uploading',
              };
            }
            return d;
          }),
        );
      }, 200);
    });
  }, []);

  const handleDelete = (id: number) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="documents-container">
      <header className="documents-header">
        <h1 className="documents-title">Mis Documentos 📄</h1>
        <p className="documents-subtitle">
          Organiza y gestiona todos tus documentos de estudio en un solo lugar.
        </p>
      </header>

      <div className="documents-main-content">
        {/* Panel para subir documentos */}
        <div className="upload-panel">
          <h2 className="panel-title">
            <Upload className="panel-icon" />
            Subir Documentos
          </h2>
          <div
            className={`drag-drop-area ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              multiple
              className="file-input"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <Upload size={48} className="upload-icon" />
            <p>Arrastra y suelta tus archivos aquí</p>
            <small>o haz clic para seleccionar archivos</small>
          </div>
        </div>

        {/* Panel de lista de documentos */}
        <div className="documents-list-panel">
          <h2 className="panel-title">
            <Folder className="panel-icon" />
            Documentos Subidos
          </h2>
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="documents-grid">
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <div key={doc.id} className="document-card">
                  <div className="document-icon-wrapper">
                    <FileText size={48} className="document-icon" />
                  </div>
                  <div className="document-info">
                    <span className="document-name">{doc.name}</span>
                    <span className="document-subject">{doc.subject}</span>
                    <span className="document-size">{doc.size}</span>
                    {doc.uploadStatus === 'uploading' && (
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar"
                          style={{ width: `${doc.uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="document-actions">
                    {doc.uploadStatus === 'completed' && (
                      <>
                        <button className="download-btn">
                          <Download size={18}>
                            <title>Descargar</title>
                          </Download>
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="delete-btn"
                        >
                          <Trash2 size={18}>
                            <title>Eliminar</title>
                          </Trash2>
                        </button>
                      </>
                    )}
                    {doc.uploadStatus === 'uploading' && (
                      <span className="upload-status">Cargando...</span>
                    )}
                    {doc.uploadStatus === 'completed' && (
                      <CheckCircle
                        size={20}
                        className="status-icon completed-icon"
                      >
                        <title>Carga Completa</title>
                      </CheckCircle>
                    )}
                    {doc.uploadStatus === 'failed' && (
                      <AlertCircle
                        size={20}
                        className="status-icon failed-icon"
                      >
                        <title>Error en la Carga</title>
                      </AlertCircle>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>
                  No se encontraron documentos. Sube tus archivos para empezar.
                  📁
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
