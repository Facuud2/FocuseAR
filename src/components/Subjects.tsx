// src/components/Subjects.tsx
import React, { useState } from 'react';
import './Subjects.css';
import { Plus, BookOpen, AlertTriangle } from 'lucide-react';

// Define el tipo para una materia
interface Subject {
  id: number;
  name: string;
  color: string;
  documents: number;
}

const Subjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState({ name: '', color: '#4285f4' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSubject({ ...newSubject, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.name.trim() === '') return;

    const newSubjectWithId = {
      ...newSubject,
      id: Date.now(),
      documents: 0,
    };

    setSubjects([...subjects, newSubjectWithId]);
    setNewSubject({ name: '', color: '#4285f4' });
  };

  return (
    <div className="subjects-container">
      <header className="subjects-header">
        <h1 className="subjects-title">Gestión de Materias</h1>
        <p className="subjects-subtitle">
          Añade y organiza las materias de tu plan de estudio.
        </p>
      </header>

      <div className="subjects-main-content">
        {/* Formulario para añadir una nueva materia */}
        <div className="add-subject-panel">
          <h2 className="panel-title">
            <Plus className="panel-icon" />
            Añadir Nueva Materia
          </h2>
          <form className="add-subject-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="subject-name">Nombre de la Materia</label>
              <input
                type="text"
                id="subject-name"
                name="name"
                value={newSubject.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="subject-color">Color</label>
              <div className="color-picker-container">
                <input
                  type="color"
                  id="subject-color"
                  name="color"
                  value={newSubject.color}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <button type="submit" className="add-subject-btn">
              <Plus size={18} />
              Añadir Materia
            </button>
          </form>
        </div>

        {/* Sección de la lista de materias */}
        <div className="subjects-list-panel">
          <h2 className="panel-title">
            <BookOpen className="panel-icon" />
            Mis Materias
          </h2>
          {subjects.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={48} className="empty-state-icon" />
              <p className="empty-state-text">
                No has agregado ninguna materia aún.
              </p>
              <small>
                Utiliza el formulario para empezar a organizar tu estudio.
              </small>
            </div>
          ) : (
            <div className="subjects-grid">
              {subjects.map((subject) => (
                <div key={subject.id} className="subject-card">
                  <div
                    className="subject-icon"
                    style={{ backgroundColor: subject.color }}
                  >
                    {subject.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="subject-info">
                    <h3>{subject.name}</h3>
                    <p>{subject.documents} documentos</p>
                  </div>
                  <div className="subject-actions">
                    <button className="subject-action-btn">Ver</button>
                    <button className="subject-action-btn delete-btn">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subjects;
