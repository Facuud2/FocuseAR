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
  X,
} from 'lucide-react';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// SOLUCIÓN: Usar jsdelivr para asegurar que la versión del worker coincida automáticamente.
pdfjs.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface Document {
  id: number;
  name: string;
  size: string;
  subject: string;
  uploadProgress: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  url: string;
}

const initialDocuments: Document[] = [
  {
    id: 1,
    name: 'Clase-1-Matematicas.pdf',
    size: '2.4 MB',
    subject: 'Matemáticas',
    uploadProgress: 100,
    uploadStatus: 'completed',
    url: 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf',
  },
  {
    id: 2,
    name: 'Resumen-Historia.docx',
    size: '800 KB',
    subject: 'Historia',
    uploadProgress: 100,
    uploadStatus: 'completed',
    url: '',
  },
  {
    id: 3,
    name: 'Quimica-Organica.pdf',
    size: '5.1 MB',
    subject: 'Química',
    uploadProgress: 100,
    uploadStatus: 'completed',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 4,
    name: 'Introduccion-Fisica.pdf',
    size: '1.2 MB',
    subject: 'Física',
    uploadProgress: 100,
    uploadStatus: 'completed',
    url: 'https://scholar.harvard.edu/files/tiziana_s/files/sample.pdf',
  },
];

const FileUpload = ({ onChange }: { onChange: (files: File[]) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onChange(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    onChange(files);
  };

  return (
    <div
      className="new-file-upload"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        multiple
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf"
      />
      <div className="upload-content">
        <Upload size={36} />
        <p>Arrastra y suelta tus archivos aquí, o haz clic para seleccionar.</p>
      </div>
    </div>
  );
};

const FileUploadDemo = ({
  onFilesUploaded,
}: {
  onFilesUploaded: (files: File[]) => void;
}) => {
  const [, setFiles] = useState<File[]>([]);
  const handleFileUpload = (files: File[]) => {
    setFiles(files);
    onFilesUploaded(files);
    console.log(files);
  };

  return (
    <div className="file-upload-wrapper">
      <FileUpload onChange={handleFileUpload} />
    </div>
  );
};

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : '';
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const uploadFiles = useCallback((files: File[]) => {
    const newDocs: Document[] = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      subject: 'Sin asignar',
      uploadProgress: 0,
      uploadStatus: 'pending',
      url: URL.createObjectURL(file),
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
    const docToDelete = documents.find((doc) => doc.id === id);
    if (docToDelete && docToDelete.url.startsWith('blob:')) {
      URL.revokeObjectURL(docToDelete.url);
    }
    setDocuments(documents.filter((doc) => doc.id !== id));
    if (selectedDocument && selectedDocument.id === id) {
      setSelectedDocument(null);
    }
  };

  const handleOpenViewer = (doc: Document) => {
    if (doc.name.toLowerCase().endsWith('.pdf') && doc.url) {
      setSelectedDocument(doc);
      setPageNumber(1);
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const goToPrevPage = () => {
    setPageNumber((prevPage) => Math.max(prevPage - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prevPage) =>
      numPages ? Math.min(prevPage + 1, numPages) : prevPage,
    );
  };

  const handleDownload = (doc: Document) => {
    if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
        <div className="panel upload-panel">
          <h2 className="panel-title">
            <Upload className="panel-icon" />
            Subir Documentos
          </h2>
          <FileUploadDemo onFilesUploaded={uploadFiles} />
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
                        {doc.url && doc.name.toLowerCase().endsWith('.pdf') && (
                          <button
                            onClick={() => handleOpenViewer(doc)}
                            className="view-btn"
                          >
                            <FileText size={18}>
                              <title>Ver</title>
                            </FileText>
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(doc)}
                          className="download-btn"
                        >
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

      {selectedDocument && (
        <div className="pdf-viewer-modal-backdrop">
          <div className="pdf-viewer-modal-content">
            <header className="pdf-viewer-header">
              <h3>{selectedDocument.name}</h3>
              <button
                className="close-modal-btn"
                onClick={() => setSelectedDocument(null)}
              >
                <X size={24} />
              </button>
            </header>
            <div className="pdf-viewer-body">
              <Document
                file={selectedDocument.url}
                onLoadSuccess={onDocumentLoadSuccess}
              >
                <Page pageNumber={pageNumber} />
              </Document>
            </div>
            <footer className="pdf-viewer-footer">
              <div className="page-nav">
                <button onClick={goToPrevPage} disabled={pageNumber <= 1}>
                  Página anterior
                </button>
                <span className="page-info">
                  Página {pageNumber} de {numPages || '--'}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={numPages ? pageNumber >= numPages : true}
                >
                  Página siguiente
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
