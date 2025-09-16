import React, { useState, useCallback, useRef, useEffect } from 'react';
import './Documents.css';
import {
  FileText,
  Upload,
  Trash2,
  Folder,
  CheckCircle,
  AlertCircle,
  Download,
  Sun,
  Moon,
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : '';
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

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
      subject: 'Sin asignar',
      uploadProgress: 0,
      uploadStatus: 'pending',
    }));

    setDocuments((prevDocs) => [...prevDocs, ...newDocs]);

    newDocs.forEach((doc) => {
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
        <div>
          <h1 className="documents-title">Mis Documentos 📄</h1>
          <p className="documents-subtitle">
            Organiza y gestiona todos tus documentos de estudio en un solo
            lugar.
          </p>
        </div>
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </header>

      <div className="documents-main-content">
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

        <div className="documents-list-panel">
          <h2 className="panel-title">
            <Folder className="panel-icon" />
            Documentos Subidos
          </h2>
          {/* Componente de búsqueda de Uiverse */}
          <div className="search-container">
            <div id="poda">
              <div className="glow"></div>
              <div className="darkBorderBg"></div>
              <div className="darkBorderBg"></div>
              <div className="darkBorderBg"></div>
              <div className="white"></div>
              <div className="border"></div>
              <div id="main">
                <input
                  placeholder="Search..."
                  type="text"
                  name="text"
                  className="input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div id="input-mask"></div>
                <div id="pink-mask"></div>
                <div className="filterBorder"></div>
                <div id="filter-icon">
                  <svg
                    preserveAspectRatio="none"
                    height="27"
                    width="27"
                    viewBox="4.8 4.56 14.832 15.408"
                    fill="none"
                  >
                    <path
                      d="M8.16 6.65002H15.83C16.47 6.65002 16.99 7.17002 16.99 7.81002V9.09002C16.99 9.56002 16.7 10.14 16.41 10.43L13.91 12.64C13.56 12.93 13.33 13.51 13.33 13.98V16.48C13.33 16.83 13.1 17.29 12.81 17.47L12 17.98C11.24 18.45 10.2 17.92 10.2 16.99V13.91C10.2 13.5 9.97 12.98 9.73 12.69L7.52 10.36C7.23 10.08 7 9.55002 7 9.20002V7.87002C7 7.17002 7.52 6.65002 8.16 6.65002Z"
                      stroke="#d6d6e6"
                      strokeWidth="1"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </div>
                <div id="search-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    height="24"
                    fill="none"
                    className="feather feather-search"
                  >
                    <circle
                      stroke="url(#search)"
                      r="8"
                      cy="11"
                      cx="11"
                    ></circle>
                    <line
                      stroke="url(#searchl)"
                      y2="16.65"
                      y1="22"
                      x2="16.65"
                      x1="22"
                    ></line>
                    <defs>
                      <linearGradient
                        gradientTransform="rotate(50)"
                        id="search"
                      >
                        <stop stopColor="#f8e7f8" offset="0%"></stop>
                        <stop stopColor="#b6a9b7" offset="50%"></stop>
                      </linearGradient>
                      <linearGradient id="searchl">
                        <stop stopColor="#b6a9b7" offset="0%"></stop>
                        <stop stopColor="#837484" offset="50%"></stop>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
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
