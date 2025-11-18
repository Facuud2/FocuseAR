import React, { useState, useCallback, useRef, useEffect } from 'react';
import './Documents.css';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../firebase';
import type { Folder as FolderType } from '../types/folder';
import { getFolders, createFolder, renameFolder } from '../services/folders'; // Importar renameFolder
import {
  getUserMaterials,
  saveMaterialMetadata,
  moveMaterial,
  deleteMaterial,
  updateMaterialTags,
} from '../services/materials'; // Corrected import path for materials services
import CreateFolderModal from './CreateFolderModal';
import EditTagsModal from './EditTagsModal'; // Import the new modal
import ContextMenu from './ContextMenu';
import './Modal.css';
import './ContextMenu.css';
import {
  FileText,
  Upload,
  Trash2,
  Folder,
  Download,
  X, // Removed Sun, Moon
  Edit,
} from 'lucide-react';

import type { MaterialMetadata } from '../types/material';
import toast from 'react-hot-toast';
import { auth } from '../firebase'; // Ajusta la ruta según tu estructura

type OnMaterialContextMenu = (
  e: React.MouseEvent,
  item: MaterialMetadata,
  type: 'material',
) => void;
type HandleOpenViewer = (doc: MaterialMetadata) => void;
type HandleDownload = (doc: MaterialMetadata) => void;
type HandleDeleteMaterial = (
  materialId?: string,
  storagePath?: string,
) => Promise<void>;

type OnDropMaterial = (materialId: string, newPath: string) => Promise<void>;
type OnNavigateFolder = (path: string) => void;
type OnFolderContextMenu = (
  e: React.MouseEvent,
  item: FolderType,
  type: 'folder',
) => void;
type OnRenameFolder = (folderId: string, currentName: string) => Promise<void>;
type OnDeleteFolder = (folderId: string) => Promise<void>;

interface ContextMenuState {
  x: number;
  y: number;
  item: MaterialMetadata | FolderType;
  type: 'material' | 'folder';
}

const ItemTypes = {
  MATERIAL: 'material',
};

const FileUploadDemo = ({
  onFilesUploaded,
}: {
  onFilesUploaded: (files: File[]) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesUploaded(files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    onFilesUploaded(files);
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

const DraggableMaterial = ({
  doc,
  onContextMenu,
  handleOpenViewer,
  handleDownload,
  handleDelete,
}: {
  doc: MaterialMetadata;
  onContextMenu: OnMaterialContextMenu;
  handleOpenViewer: HandleOpenViewer;
  handleDownload: HandleDownload;
  handleDelete: HandleDeleteMaterial;
}) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: ItemTypes.MATERIAL,
    item: { id: doc.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const drag = (node: HTMLDivElement | null) => {
    if (node) {
      dragRef(node);
    }
  };

  return (
    <div
      ref={drag}
      className="document-card"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onContextMenu={(e) => onContextMenu(e, doc, 'material')}
    >
      <div className="document-icon-wrapper">
        <FileText size={48} className="document-icon" />
      </div>
      <div className="document-info">
        <span className="document-name">{doc.fileName}</span>
        <span className="document-size">
          {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
        </span>
        {doc.tags && doc.tags.length > 0 && (
          <div className="document-tags">
            {doc.tags.map((tag) => (
              <span key={tag} className="tag-display-item">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="document-actions">
        <button
          onClick={() => handleOpenViewer(doc)}
          className="view-btn"
          title="Ver PDF"
        >
          <FileText size={18} />
        </button>
        <button
          onClick={() => handleDownload(doc)}
          className="download-btn"
          title="Descargar"
        >
          <Download size={18} />
        </button>
        <button
          onClick={() => handleDelete(doc.id, doc.storagePath)}
          className="delete-btn"
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const DropTargetFolder = ({
  folder,
  onDrop,
  onNavigate,
  onContextMenu,
  onRename,
  onDelete,
}: {
  folder: FolderType;
  onDrop: OnDropMaterial;
  onNavigate: OnNavigateFolder;
  onContextMenu: OnFolderContextMenu;
  onRename: OnRenameFolder;
  onDelete: OnDeleteFolder;
}) => {
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: ItemTypes.MATERIAL,
    drop: (item: { id: string }) =>
      onDrop(item.id, `${folder.path}${folder.name}/`),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const drop = (node: HTMLDivElement | null) => {
    if (node) {
      dropRef(node);
    }
  };

  return (
    <div
      ref={drop}
      className="document-card"
      style={{ backgroundColor: isOver ? '#f0f0f0' : 'transparent' }}
      onClick={() =>
        folder.path &&
        folder.name &&
        onNavigate(`${folder.path}${folder.name}/`)
      }
      onContextMenu={(e) => onContextMenu(e, folder, 'folder')}
    >
      <div className="document-icon-wrapper">
        <Folder size={48} className="document-icon" />
      </div>
      <div className="document-info">
        <span className="document-name">{folder.name}</span>
      </div>
      <div className="document-actions" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (folder.id && folder.name) onRename(folder.id, folder.name);
          }}
        >
          <Edit size={18} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (folder.id) onDelete(folder.id);
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const Documents: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<MaterialMetadata[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] =
    useState<MaterialMetadata | null>(null);
  const [viewableUrl, setViewableUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditTagsModalOpen, setIsEditTagsModalOpen] = useState(false);
  const [documentToEditTags, setDocumentToEditTags] =
    useState<MaterialMetadata | null>(null);

  const loadContent = useCallback(async () => {
    if (!user) {
      console.log('User not authenticated, cannot load content.'); // Log 6
      return;
    }
    setLoading(true);
    console.log('Loading content for user:', user.uid, 'at path:', currentPath); // Log 7
    try {
      const [folders, materials] = await Promise.all([
        getFolders(user.uid, currentPath),
        getUserMaterials(user.uid, currentPath),
      ]);
      console.log('Folders loaded:', folders); // Log 8
      console.log('Materials loaded:', materials); // Log 9
      setFolders(folders);
      setDocuments(materials);
    } catch (error: unknown) {
      console.error('Error al cargar el contenido:', error);
      let errorMessage = 'Error al cargar el contenido';

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      toast.error(errorMessage);
    }
    setLoading(false);
  }, [user, currentPath]); // Removed getFolders and getUserMaterials

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleCreateFolder = async (folderName: string) => {
    if (folderName && user) {
      // Use the local service function instead of Firebase Cloud Function
      await createFolder({
        name: folderName,
        path: currentPath,
        userId: user.uid,
      });
      loadContent();
    }
  };

  const handleRenameFolder = async (folderId: string, currentName: string) => {
    try {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const newName = prompt('Ingrese el nuevo nombre:', currentName);

      // Si el usuario cancela o no ingresa un nombre, no hacemos nada
      if (newName === null || newName.trim() === '') {
        return;
      }

      // Validar que el nombre no sea el mismo
      if (newName === currentName) {
        return; // No es necesario hacer nada si el nombre no cambia
      }

      // Usar la función local del servicio en lugar de la función de Firebase
      await renameFolder(folderId, newName);

      // Recargar el contenido después de renombrar
      loadContent();
    } catch (error: unknown) {
      console.error('Error al renombrar la carpeta:', error);

      // Mostrar mensaje de error al usuario
      let errorMessage = 'Ocurrió un error al intentar renombrar la carpeta';

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      alert(errorMessage);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta carpeta?')) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const token = await user.getIdToken();
      const endpoint = import.meta.env.VITE_DELETE_FOLDER_ENDPOINT;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folderId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar la carpeta');
      }

      // Actualizar el estado local
      setFolders((prevFolders) =>
        prevFolders.filter((folder) => folder.id !== folderId),
      );
      toast.success('Carpeta eliminada correctamente');
      loadContent(); // Recargar el contenido actualizado
    } catch (error: unknown) {
      console.error('Error al eliminar carpeta:', error);
      let errorMessage = 'Error al eliminar la carpeta';

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      toast.error(errorMessage);
    }
  };

  const handleDeleteMaterial: HandleDeleteMaterial = async (
    materialId = '',
    storagePath = '',
  ) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      await deleteMaterial(materialId);
      loadContent();
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length > 0 && user) {
      const file = files[0];
      console.log(
        'Attempting to upload file:',
        file.name,
        'for user:',
        user.uid,
      ); // Log 1
      const storageRef = ref(
        storage,
        `materials/${user.uid}/${Date.now()}_${file.name}`,
      );
      try {
        const snapshot = await uploadBytes(storageRef, file);
        console.log('File uploaded to Storage:', snapshot.ref.fullPath); // Log 2
        const downloadUrl = await getDownloadURL(snapshot.ref);
        console.log('Download URL obtained:', downloadUrl); // Log 3
        const metadataToSave: MaterialMetadata = {
          // Added type assertion here
          fileName: file.name,
          originalName: file.name,
          storagePath: snapshot.ref.fullPath,
          downloadUrl,
          userId: user.uid,
          fileSize: file.size,
          mimeType: file.type,
          status: 'completed',
          path: currentPath,
          tags: [], // Initialize with empty tags array
        };
        console.log('Saving material metadata:', metadataToSave); // Log 4
        await saveMaterialMetadata(metadataToSave);
        console.log('Material metadata saved successfully.'); // Log 5
        loadContent();
      } catch (error) {
        console.error('Error during file upload or metadata save:', error); // Log Error
      }
    } else {
      console.log('No file selected or user not authenticated.'); // Log 0
    }
  };

  const handleMoveMaterial = async (materialId: string, newPath: string) => {
    await moveMaterial(materialId, newPath);
    loadContent();
  };

  const handleMoveToRoot = async (materialId: string) => {
    await moveMaterial(materialId, '/');
    loadContent();
    closeContextMenu();
  };

  const handleOpenViewer = (doc: MaterialMetadata) => {
    setSelectedDocument(doc);
    setViewableUrl(doc.downloadUrl);
  };

  const handleDownload = (doc: MaterialMetadata) => {
    window.open(doc.downloadUrl, '_blank');
  };

  const closeViewer = () => {
    setSelectedDocument(null);
    setViewableUrl(null);
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    item: MaterialMetadata | FolderType,
    type: 'material' | 'folder',
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleEditTags = (doc: MaterialMetadata) => {
    setDocumentToEditTags(doc);
    setIsEditTagsModalOpen(true);
    closeContextMenu(); // Close the context menu after selection
  };

  const handleSaveTags = async (documentId: string, newTags: string[]) => {
    if (!user) return;
    await updateMaterialTags(documentId, newTags); // Use the actual service function
    loadContent();
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="documents-container" onClick={closeContextMenu}>
        {' '}
        {/* Removed data-theme attribute */}
        <header className="documents-header">
          <div>
            <h1 className="documents-title">Mis Documentos 📄</h1>
            <p className="documents-subtitle">
              Organiza y gestiona todos tus documentos de estudio en un solo
              lugar.
            </p>
          </div>
          {/* Removed theme toggle button */}
        </header>
        <div className="documents-main-content">
          <div className="panel upload-panel">
            <h2 className="panel-title">
              <Upload className="panel-icon" />
              Subir Documentos
            </h2>
            <FileUploadDemo onFilesUploaded={handleFileUpload} />
          </div>

          <div className="documents-list-panel">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 className="panel-title">
                <Folder className="panel-icon" />
                Documentos Subidos
              </h2>
              <button onClick={() => setIsModalOpen(true)}>
                Create Folder
              </button>
            </div>
            <div>
              <span
                onClick={() => setCurrentPath('/')}
                style={{ cursor: 'pointer' }}
              ></span>
              {currentPath
                .split('/')
                .filter(Boolean)
                .map((segment, index, arr) => (
                  <span
                    key={index}
                    onClick={() =>
                      setCurrentPath(
                        '/' + arr.slice(0, index + 1).join('/') + '/',
                      )
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    / {segment}
                  </span>
                ))}
            </div>
            <div className="search-container">
              <input
                placeholder="Search..."
                type="text"
                name="text"
                className="input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="documents-grid">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <>
                  {folders.map((folder) => (
                    <DropTargetFolder
                      key={folder.id}
                      folder={folder}
                      onDrop={handleMoveMaterial}
                      onNavigate={setCurrentPath}
                      onContextMenu={handleContextMenu}
                      onRename={handleRenameFolder}
                      onDelete={handleDeleteFolder}
                    />
                  ))}
                  {filteredDocuments.map((doc) => (
                    <DraggableMaterial
                      key={doc.id}
                      doc={doc}
                      onContextMenu={handleContextMenu}
                      handleOpenViewer={handleOpenViewer}
                      handleDownload={handleDownload}
                      handleDelete={handleDeleteMaterial}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
        {selectedDocument && viewableUrl && (
          <div className="pdf-viewer-modal-backdrop">
            <div className="pdf-viewer-modal-content">
              <header className="pdf-viewer-header">
                <h3>{selectedDocument.fileName}</h3>
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
        <CreateFolderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateFolder}
        />
        <EditTagsModal
          isOpen={isEditTagsModalOpen}
          onClose={() => setIsEditTagsModalOpen(false)}
          document={documentToEditTags}
          onSave={handleSaveTags}
        />
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={closeContextMenu}
          >
            {contextMenu.type === 'folder' && 'path' in contextMenu.item && (
              <>
                <div
                  className="context-menu-item"
                  onClick={() => {
                    const folder = contextMenu.item as FolderType;
                    if (folder.id && 'name' in folder) {
                      handleRenameFolder(folder.id, folder.name);
                    }
                  }}
                >
                  Rename
                </div>
                <div
                  className="context-menu-item"
                  onClick={() => {
                    const folder = contextMenu.item as FolderType;
                    if (folder.id) {
                      handleDeleteFolder(folder.id);
                    }
                  }}
                >
                  Delete
                </div>
              </>
            )}
            {contextMenu.type === 'material' &&
              'storagePath' in contextMenu.item && (
                <>
                  <div
                    className="context-menu-item"
                    onClick={() =>
                      contextMenu.item.id &&
                      'storagePath' in contextMenu.item &&
                      handleDeleteMaterial(
                        contextMenu.item.id,
                        contextMenu.item.storagePath,
                      )
                    }
                  >
                    Delete
                  </div>
                  <div
                    className="context-menu-item"
                    onClick={() =>
                      'storagePath' in contextMenu.item &&
                      handleEditTags(contextMenu.item)
                    }
                  >
                    Edit Tags
                  </div>
                  <div
                    className="context-menu-item"
                    onClick={() =>
                      contextMenu.item.id &&
                      handleMoveToRoot(contextMenu.item.id)
                    }
                  >
                    Move to Root
                  </div>
                </>
              )}
          </ContextMenu>
        )}
      </div>
    </DndProvider>
  );
};

export default Documents;
