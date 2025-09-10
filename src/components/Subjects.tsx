import React, { useState } from 'react';
import './Subjects.css';
import {
  BookOpen,
  Plus,
  AlertTriangle,
  GraduationCap,
  Calendar,
  Clock,
  Users,
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  professor: string;
  schedule: string;
  examDate: string;
  modality: string;
  totalHours: number;
  description: string;
  color: string;
}

const initialSubjects: Subject[] = [
  {
    id: '1',
    name: 'Calculus II',
    code: 'MATH202',
    credits: 4,
    professor: 'Dr. Martinez',
    schedule: 'Mon/Wed/Fri 9:00-10:30',
    examDate: '2025-01-28',
    modality: 'Presencial',
    totalHours: 60,
    description:
      'Advanced calculus including integration techniques, series, and differential equations.',
    color: 'violet',
  },
  {
    id: '2',
    name: 'Physics III',
    code: 'PHYS301',
    credits: 5,
    professor: 'Dr. Chen',
    schedule: 'Tue/Thu 14:00-16:30',
    examDate: '2025-02-15',
    modality: 'Híbrida',
    totalHours: 75,
    description:
      'Electromagnetic theory, waves, and quantum mechanics fundamentals.',
    color: 'blue',
  },
  {
    id: '3',
    name: 'Data Structures',
    code: 'CS250',
    credits: 3,
    professor: 'Prof. Johnson',
    schedule: 'Mon/Wed 11:00-12:30',
    examDate: '2025-02-08',
    modality: 'Presencial',
    totalHours: 45,
    description:
      'Advanced data structures, algorithms, and complexity analysis.',
    color: 'emerald',
  },
];

const initialFormState = {
  name: '',
  code: '',
  credits: '',
  professor: '',
  schedule: '',
  examDate: '',
  modality: '',
  totalHours: '',
  description: '',
  color: 'violet',
};

export function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [formData, setFormData] = useState(initialFormState);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '') return;

    const newSubject: Subject = {
      id: Date.now().toString(),
      name: formData.name,
      code: formData.code,
      credits: parseInt(formData.credits),
      professor: formData.professor,
      schedule: formData.schedule,
      examDate: formData.examDate,
      modality: formData.modality,
      totalHours: parseInt(formData.totalHours),
      description: formData.description,
      color: formData.color,
    };

    setSubjects([...subjects, newSubject]);
    setFormData(initialFormState);
  };

  return (
    <div className="main-container">
      <div className="content-card">
        <div className="header-section">
          <h1 className="main-title">Gestión de Materias</h1>
          <p className="subtitle">
            Añade y organiza las materias de tu plan de estudio.
          </p>
        </div>

        <form onSubmit={handleAddSubject} className="add-form">
          <h2 className="form-title">+ Añadir Nueva Materia</h2>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Nombre de la Materia
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Cálculo II"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="code" className="form-label">
                Código
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="Ej: MATH202"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="credits" className="form-label">
                Créditos
              </label>
              <input
                type="number"
                id="credits"
                name="credits"
                value={formData.credits}
                onChange={handleInputChange}
                placeholder="Ej: 4"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="totalHours" className="form-label">
                Horas Totales
              </label>
              <input
                type="number"
                id="totalHours"
                name="totalHours"
                value={formData.totalHours}
                onChange={handleInputChange}
                placeholder="Ej: 60"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="professor" className="form-label">
                Profesor
              </label>
              <input
                type="text"
                id="professor"
                name="professor"
                value={formData.professor}
                onChange={handleInputChange}
                placeholder="Ej: Dra. Martínez"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="schedule" className="form-label">
                Horario
              </label>
              <input
                type="text"
                id="schedule"
                name="schedule"
                value={formData.schedule}
                onChange={handleInputChange}
                placeholder="Ej: Lun/Mié 9:00-10:30"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="examDate" className="form-label">
                Fecha de Examen
              </label>
              <input
                type="date"
                id="examDate"
                name="examDate"
                value={formData.examDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="modality" className="form-label">
                Modalidad
              </label>
              <select
                id="modality"
                name="modality"
                value={formData.modality}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="Presencial">Presencial</option>
                <option value="Virtual">Virtual</option>
                <option value="Híbrida">Híbrida</option>
              </select>
            </div>
          </div>

          <div className="form-group form-group-full">
            <label htmlFor="description" className="form-label">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Breve descripción de la materia..."
            ></textarea>
          </div>

          <div className="form-group form-group-full">
            <label className="form-label">Color</label>
            <div className="color-picker-container">
              {['violet', 'blue', 'emerald', 'amber'].map((color) => (
                <label key={color} className="color-option-label">
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    checked={formData.color === color}
                    onChange={handleInputChange}
                  />
                  <span className={`color-circle color-circle-${color}`}></span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="submit-button">
            <Plus size={18} />
            <span>Añadir Materia</span>
          </button>
        </form>

        <div className="subjects-list-section">
          <h2 className="list-title">
            <BookOpen size={20} className="list-title-icon" />
            Mis Materias
          </h2>

          {subjects.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={40} className="empty-state-icon" />
              <p className="empty-state-text">
                No has agregado ninguna materia aún.
              </p>
              <p className="empty-state-text-small">
                Utiliza el formulario para empezar a organizar tu estudio.
              </p>
            </div>
          ) : (
            <div className="subjects-grid">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className={`subject-card subject-card-${subject.color}`}
                >
                  <div className="card-header-content">
                    <div className="card-icon-wrapper">
                      <BookOpen size={24} className="card-icon" />
                    </div>
                    <div className="card-info">
                      <span
                        className={`card-badge badge-color-${subject.color}`}
                      >
                        {subject.code}
                      </span>
                      <h3 className="card-title">{subject.name}</h3>
                    </div>
                  </div>
                  <p className="card-description">{subject.description}</p>
                  <div className="card-details">
                    <div className="detail-item">
                      <Users size={16} />
                      <span className="detail-text">{subject.professor}</span>
                    </div>
                    <div className="detail-item">
                      <Clock size={16} />
                      <span className="detail-text">{subject.schedule}</span>
                    </div>
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span className="detail-text">
                        Examen:{' '}
                        {new Date(subject.examDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <GraduationCap size={16} />
                      <span className="detail-text">
                        {subject.credits} créditos • {subject.totalHours}h
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
