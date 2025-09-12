import { useState } from 'react';
import './Documents.css';
import { FileText, Upload, Trash2, Folder, Search } from 'lucide-react';

interface Document {
  id: number;
  name: string;
  size: string;
  subject: string;
}

const initialDocuments: Document[] = [
  {
    id: 1,
    name: 'Clase-1-Matematicas.pdf',
    size: '2.4 MB',
    subject: 'Matemáticas',
  },
  { id: 2, name: 'Resumen-Historia.docx', size: '800 KB', subject: 'Historia' },
  { id: 3, name: 'Quimica-Organica.pdf', size: '5.1 MB', subject: 'Química' },
  { id: 4, name: 'Introduccion-Fisica.pdf', size: '1.2 MB', subject: 'Física' },
];

const Documents = () => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (id: number) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="documents-container">
      <header className="documents-header">
        <h1 className="documents-title">Mis Documentos</h1>
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
          <div className="drag-drop-area">
            <input type="file" className="file-input" />
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
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="delete-btn"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No se encontraron documentos.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
