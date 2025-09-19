import React, { useState, useCallback, useRef } from 'react';
import './Documents.css';
import {
  FileText,
  Upload,
  Trash2,
  Folder,
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

// Placeholder para FileUpload
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
      />
      <div className="upload-content">
        <Upload size={36} />
        <p>Arrastra y suelta tus archivos aquí, o haz clic para seleccionar.</p>
      </div>
    </div>
  );
};

// Nuevo componente de subida de archivos
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
            {/* buscador */}
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
