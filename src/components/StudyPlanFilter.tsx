import React from 'react';
import './StudyPlanFilter.css';

interface StudyPlanDay {
  date: string;
  dayNumber: number;
  topics: {
    name: string;
    summary: string;
    estimatedTime: string;
  }[];
  totalTime: string;
  recommendations: string;
  completed: boolean;
}

interface StructuredPlan {
  title: string;
  summary: string;
  days: StudyPlanDay[];
  finalRecommendations: string;
}

interface StudyPlan {
  id: string | number;
  subjectName: string;
  eventName: string;
  examDate: string;
  topics: string[];
  studyDays: string[];
  content: string;
  structuredPlan: StructuredPlan | null | undefined;
  progress: number;
  createdAt: string;
  expanded: boolean;
}

interface ImportantDate {
  name: string;
  date: string;
  type: 'exam' | 'tp' | 'other';
}

interface Pdf {
  id: number;
  name: string;
  size: string;
}

interface Subject {
  id: string | number;
  name: string;
  examDate: string;
  color: string;
  pdfs: Pdf[];
  importantDates: ImportantDate[];
}

interface StudyPlanFilterProps {
  studyPlans: StudyPlan[];
  subjects: Subject[];
  onFilterChange: (filteredPlanIds: (string | number)[]) => void;
}

type FilterType = 'all' | 'next-exam' | 'pending' | 'selected';

const StudyPlanFilter: React.FC<StudyPlanFilterProps> = ({
  studyPlans,
  subjects,
  onFilterChange,
}) => {
  const [activeFilter, setActiveFilter] = React.useState<FilterType>('all');
  const [selectedSubjects, setSelectedSubjects] = React.useState<Set<string>>(
    new Set(),
  );

  // Función para obtener el próximo examen
  const getNextExamPlan = React.useCallback((): StudyPlan | null => {
    const today = new Date();
    const upcomingPlans = studyPlans
      .filter((plan) => {
        if (!plan.examDate) return false;
        const examDate = new Date(plan.examDate);
        return examDate >= today;
      })
      .sort((a, b) => {
        const dateA = new Date(a.examDate);
        const dateB = new Date(b.examDate);
        return dateA.getTime() - dateB.getTime();
      });

    return upcomingPlans.length > 0 ? upcomingPlans[0] : null;
  }, [studyPlans]);

  // Función para obtener materias pendientes (progreso 0)
  const getPendingPlans = React.useCallback((): StudyPlan[] => {
    return studyPlans.filter((plan) => plan.progress === 0);
  }, [studyPlans]);

  // Función para aplicar filtros
  const applyFilter = React.useCallback(
    (filterType: FilterType, selectedSubjectsSet?: Set<string>) => {
      let filteredPlanIds: (string | number)[] = [];

      switch (filterType) {
        case 'all': {
          filteredPlanIds = studyPlans.map((plan) => plan.id);
          break;
        }
        case 'next-exam': {
          const nextExamPlan = getNextExamPlan();
          if (nextExamPlan) {
            filteredPlanIds = [nextExamPlan.id];
          }
          break;
        }
        case 'pending': {
          const pendingPlans = getPendingPlans();
          filteredPlanIds = pendingPlans.map((plan) => plan.id);
          break;
        }
        case 'selected': {
          const subjectsSet = selectedSubjectsSet || selectedSubjects;
          filteredPlanIds = studyPlans
            .filter((plan) => subjectsSet.has(plan.subjectName))
            .map((plan) => plan.id);
          break;
        }
      }

      onFilterChange(filteredPlanIds);
    },
    [studyPlans, selectedSubjects],
  );

  // Manejar cambio de filtro principal
  const handleFilterChange = (filterType: FilterType) => {
    setActiveFilter(filterType);
    applyFilter(filterType);
  };

  // Manejar selección/deselección de materias
  const handleSubjectToggle = (subjectName: string) => {
    const newSelectedSubjects = new Set(selectedSubjects);

    if (newSelectedSubjects.has(subjectName)) {
      newSelectedSubjects.delete(subjectName);
    } else {
      newSelectedSubjects.add(subjectName);
    }

    setSelectedSubjects(newSelectedSubjects);

    // Si el filtro activo es 'selected', aplicar inmediatamente
    if (activeFilter === 'selected') {
      applyFilter('selected', newSelectedSubjects);
    }
  };

  // Obtener todas las materias únicas de los planes de estudio
  const getUniqueSubjects = () => {
    const subjectNames = new Set(studyPlans.map((plan) => plan.subjectName));
    return Array.from(subjectNames).map((name) => {
      const subject = subjects.find((s) => s.name === name);
      const plansForSubject = studyPlans.filter((p) => p.subjectName === name);
      const totalProgress = plansForSubject.reduce(
        (sum, plan) => sum + plan.progress,
        0,
      );
      const avgProgress =
        plansForSubject.length > 0 ? totalProgress / plansForSubject.length : 0;

      return {
        name,
        color: subject?.color || '#4285F4',
        planCount: plansForSubject.length,
        avgProgress: Math.round(avgProgress),
      };
    });
  };

  const uniqueSubjects = getUniqueSubjects();
  const nextExamPlan = getNextExamPlan();
  const pendingPlans = getPendingPlans();

  // Aplicar filtro inicial
  React.useEffect(() => {
    applyFilter(activeFilter);
  }, [activeFilter, studyPlans.length, applyFilter]); // Re-aplicar cuando cambien los planes o el filtro activo

  return (
    <div className="study-plan-filter">
      <div className="filter-header">
        <h3>
          <i className="fas fa-filter"></i>
          Filtros de Planes de Estudio
        </h3>
        <span className="filter-count">
          {studyPlans.length} plan{studyPlans.length !== 1 ? 'es' : ''} total
          {studyPlans.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Filtros predefinidos */}
      <div className="predefined-filters">
        <button
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          <i className="fas fa-list"></i>
          Todos los planes
          <span className="count">{studyPlans.length}</span>
        </button>

        <button
          className={`filter-btn ${activeFilter === 'next-exam' ? 'active' : ''}`}
          onClick={() => handleFilterChange('next-exam')}
          disabled={!nextExamPlan}
        >
          <i className="fas fa-clock"></i>
          Próximo examen
          {nextExamPlan && (
            <span className="exam-info">
              {nextExamPlan.subjectName} -{' '}
              {new Date(nextExamPlan.examDate).toLocaleDateString('es-ES')}
            </span>
          )}
        </button>

        <button
          className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => handleFilterChange('pending')}
          disabled={pendingPlans.length === 0}
        >
          <i className="fas fa-exclamation-triangle"></i>
          Materias pendientes
          <span className="count">{pendingPlans.length}</span>
        </button>

        <button
          className={`filter-btn ${activeFilter === 'selected' ? 'active' : ''}`}
          onClick={() => handleFilterChange('selected')}
        >
          <i className="fas fa-check-square"></i>
          Materias seleccionadas
          <span className="count">{selectedSubjects.size}</span>
        </button>
      </div>

      {/* Lista de materias con checkboxes */}
      {activeFilter === 'selected' && (
        <div className="subjects-list">
          <h4>Seleccionar materias:</h4>
          <div className="subjects-grid">
            {uniqueSubjects.map((subject) => (
              <label
                key={subject.name}
                className={`subject-checkbox ${selectedSubjects.has(subject.name) ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedSubjects.has(subject.name)}
                  onChange={() => handleSubjectToggle(subject.name)}
                />
                <div className="subject-info">
                  <div
                    className="subject-color"
                    style={{ backgroundColor: subject.color }}
                  ></div>
                  <div className="subject-details">
                    <span className="subject-name">{subject.name}</span>
                    <div className="subject-meta">
                      <span className="plan-count">
                        {subject.planCount} plan
                        {subject.planCount !== 1 ? 'es' : ''}
                      </span>
                      <span className="progress">
                        {subject.avgProgress}% completado
                      </span>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="filter-info">
        {activeFilter === 'next-exam' && nextExamPlan && (
          <div className="info-card next-exam">
            <i className="fas fa-calendar-check"></i>
            <div>
              <strong>Próximo examen:</strong> {nextExamPlan.subjectName}
              <br />
              <span className="exam-date">
                {new Date(nextExamPlan.examDate).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        )}

        {activeFilter === 'pending' && pendingPlans.length > 0 && (
          <div className="info-card pending">
            <i className="fas fa-hourglass-start"></i>
            <div>
              <strong>Materias sin progreso:</strong>
              <br />
              {pendingPlans.map((plan) => plan.subjectName).join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPlanFilter;
