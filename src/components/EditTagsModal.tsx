import React, { useState, useEffect } from 'react';
import './Modal.css'; // Assuming shared modal styles
import { X } from 'lucide-react';

interface MaterialMetadata {
  id?: string;
  fileName: string;
  originalName: string;
  storagePath: string;
  downloadUrl: string;
  userId: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'completed' | 'error';
  path: string;
  tags?: string[];
  createdAt?: Date;
}

interface EditTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: MaterialMetadata | null;
  onSave: (documentId: string, newTags: string[]) => void;
}

const EditTagsModal: React.FC<EditTagsModalProps> = ({
  isOpen,
  onClose,
  document,
  onSave,
}) => {
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    if (document?.tags) {
      setCurrentTags(document.tags);
    } else {
      setCurrentTags([]);
    }
  }, [document]);

  const handleAddTag = () => {
    if (
      newTagInput.trim() !== '' &&
      !currentTags.includes(newTagInput.trim())
    ) {
      setCurrentTags([...currentTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (document?.id) {
      onSave(document.id, currentTags);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <header className="modal-header">
          <h3>Edit Tags for "{document?.fileName}"</h3>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </header>
        <div className="modal-body">
          <div className="tags-display">
            {currentTags.map((tag) => (
              <span key={tag} className="tag-item">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="remove-tag-btn"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="tag-input-container">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddTag();
                }
              }}
              placeholder="Add new tag"
              className="input"
            />
            <button onClick={handleAddTag} className="btn">
              Add Tag
            </button>
          </div>
        </div>
        <footer className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Save Tags
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditTagsModal;
