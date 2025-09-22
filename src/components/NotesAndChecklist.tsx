// src/components/NotesAndChecklist.tsx
import React, { useState } from 'react';
import './notes-and-checklist.css'; // Importamos el CSS del dashboard principal
import { Plus, CheckCircle, Trash2, FileText, CheckSquare } from 'lucide-react';

interface Note {
  id: number;
  text: string;
  completed: boolean;
  type: 'note' | 'task';
}

const NotesAndChecklist: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'task'>('task');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteText.trim() !== '') {
      const newNote: Note = {
        id: Date.now(),
        text: newNoteText,
        // CORRECCIÓN: Todas las nuevas entradas se inicializan como no completadas.
        completed: false,
        type: noteType,
      };
      setNotes([...notes, newNote]);
      setNewNoteText('');
    }
  };

  const handleToggleCompleted = (id: number) => {
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, completed: !note.completed } : note,
      ),
    );
  };

  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <div className="notes-panel">
      <h2 className="panel-title">
        <Plus className="panel-icon" /> Anotador y Tareas
      </h2>
      <form onSubmit={handleAddNote} className="notes-form">
        <div className="notes-type-selector">
          <button
            type="button"
            className={`type-btn ${noteType === 'task' ? 'active' : ''}`}
            onClick={() => setNoteType('task')}
          >
            <CheckSquare size={16} /> Tarea
          </button>
          <button
            type="button"
            className={`type-btn ${noteType === 'note' ? 'active' : ''}`}
            onClick={() => setNoteType('note')}
          >
            <FileText size={16} /> Nota
          </button>
        </div>
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder={`Escribe una nueva ${noteType === 'task' ? 'tarea' : 'nota'}...`}
          rows={3}
          className="notes-textarea"
        />
        <button type="submit" className="add-note-btn">
          Añadir {noteType === 'task' ? 'Tarea' : 'Nota'}
        </button>
      </form>
      <div className="notes-list">
        {notes.length === 0 ? (
          <div className="notes-empty-state">
            <p>Empieza a anotar tus ideas y tareas aquí. 📝</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`note-item ${note.completed ? 'completed' : ''}`}
            >
              {note.type === 'task' && (
                <button
                  onClick={() => handleToggleCompleted(note.id)}
                  className="note-check-btn"
                >
                  <CheckCircle size={20} />
                </button>
              )}
              <span className="note-text">{note.text}</span>
              <button
                onClick={() => handleDeleteNote(note.id)}
                className="note-delete-btn"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesAndChecklist;
