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

interface DocumentType {
  id: number;
  name: string;
  size: string;
  subject: string;
  uploadProgress: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
}

// SIMULACIÓN de la base de datos para almacenar archivos
const database = new Map<number, ArrayBuffer>();

const initialDocuments: DocumentType[] = [
  {
    id: 1,
    name: 'Clase-1-Matematicas.pdf',
    size: '2.4 MB',
    subject: 'Matemáticas',
    uploadProgress: 100,
    uploadStatus: 'completed',
  },
];

const FileUpload = ({ onChange }: { onChange: (files: File[]) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onChange(files);
    e.target.value = '';
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
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(
    null,
  );
  const [viewableUrl, setViewableUrl] = useState<string | null>(null);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : '';
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const uploadFiles = useCallback((files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newDoc: DocumentType = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            subject: 'Sin asignar',
            uploadProgress: 0,
            uploadStatus: 'pending',
          };

          database.set(newDoc.id, e.target.result as ArrayBuffer);

          setDocuments((prevDocs) => [...prevDocs, newDoc]);

          const interval = setInterval(() => {
            setDocuments((prevDocs) =>
              prevDocs.map((d) => {
                if (d.id === newDoc.id) {
                  const newProgress = d.uploadProgress + 10;
                  if (newProgress >= 100) {
                    clearInterval(interval);
                    return {
                      ...d,
                      uploadProgress: 100,
                      uploadStatus: 'completed',
                    };
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
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const handleDelete = (id: number) => {
    database.delete(id);
    setDocuments(documents.filter((doc) => doc.id !== id));
    if (selectedDocument && selectedDocument.id === id) {
      setSelectedDocument(null);
      setViewableUrl(null);
    }
  };

  const handleOpenViewer = (doc: DocumentType) => {
    if (doc.name.toLowerCase().endsWith('.pdf')) {
      const storedData = database.get(doc.id);
      if (storedData) {
        const blob = new Blob([storedData], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setSelectedDocument(doc);
        setViewableUrl(url);
      } else {
        // Para documentos de ejemplo, usar un PDF de prueba
        const initialDoc = initialDocuments.find((d) => d.id === doc.id);
        if (initialDoc) {
          setSelectedDocument(doc);
          setViewableUrl(
            'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
          );
        }
      }
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDownload = (doc: DocumentType) => {
    const storedData = database.get(doc.id);
    if (storedData) {
      const blob = new Blob([storedData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const initialDoc = initialDocuments.find((d) => d.id === doc.id);
      if (initialDoc) {
        window.open(
          'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
          '_blank',
        );
      }
    }
  };

  const closeViewer = () => {
    if (viewableUrl && viewableUrl.startsWith('blob:')) {
      URL.revokeObjectURL(viewableUrl);
    }
    setSelectedDocument(null);
    setViewableUrl(null);
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
                        {doc.name.toLowerCase().endsWith('.pdf') && (
                          <button
                            onClick={() => handleOpenViewer(doc)}
                            className="view-btn"
                            title="Ver PDF"
                          >
                            <FileText size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(doc)}
                          className="download-btn"
                          title="Descargar"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="delete-btn"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
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
                      />
                    )}
                    {doc.uploadStatus === 'failed' && (
                      <AlertCircle
                        size={20}
                        className="status-icon failed-icon"
                      />
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

      {selectedDocument && viewableUrl && (
        <div className="pdf-viewer-modal-backdrop">
          <div className="pdf-viewer-modal-content">
            <header className="pdf-viewer-header">
              <h3>{selectedDocument.name}</h3>
              <button className="close-modal-btn" onClick={closeViewer}>
                <X size={24} />
              </button>
            </header>
            <div
              className="pdf-viewer-body"
              style={{ width: '100%', height: '100%' }}
            >
              <object
                data={viewableUrl}
                type="application/pdf"
                width="100%"
                height="100%"
              >
                <p>
                  Alternative text - include a link{' '}
                  <a href={viewableUrl}>to the PDF!</a>
                </p>
              </object>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
