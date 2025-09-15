import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './StudyPlanFilter.css'; // Asegúrate de tener este archivo CSS

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
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set(),
  );

  // Función para obtener el próximo examen, memoizada
  const getNextExamPlan = useMemo((): StudyPlan | null => {
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

  // Función para obtener materias pendientes (progreso 0), memoizada
  const getPendingPlans = useMemo((): StudyPlan[] => {
    return studyPlans.filter((plan) => plan.progress === 0);
  }, [studyPlans]);

  // Función para obtener materias únicas, memoizada
  const uniqueSubjects = useMemo(() => {
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
        color: subject?.color || '#4A90E2', // Fallback color for dark theme
        planCount: plansForSubject.length,
        avgProgress: Math.round(avgProgress),
      };
    });
  }, [studyPlans, subjects]);

  // Función para aplicar filtros, memoizada
  const applyFilter = useCallback(
    (filterType: FilterType, selectedSubjectsSet?: Set<string>) => {
      let filteredPlanIds: (string | number)[] = [];

      switch (filterType) {
        case 'all': {
          filteredPlanIds = studyPlans.map((plan) => plan.id);
          break;
        }
        case 'next-exam': {
          const nextExamPlan = getNextExamPlan;
          if (nextExamPlan) {
            filteredPlanIds = [nextExamPlan.id];
          }
          break;
        }
        case 'pending': {
          const pendingPlans = getPendingPlans;
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
    [
      studyPlans,
      selectedSubjects,
      getNextExamPlan,
      getPendingPlans,
      onFilterChange,
    ],
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

  // Aplicar filtro inicial
  useEffect(() => {
    applyFilter(activeFilter);
  }, [activeFilter, studyPlans.length, applyFilter]); // Re-aplicar cuando cambien los planes o el filtro activo

  return (
    <div className="study-plan-filter">
      <div className="filter-header">
        <h3 className="panel-title">
          <i className="fas fa-filter"></i>
          Filtros
        </h3>
        <span className="filter-count">
          {studyPlans.length} plan{studyPlans.length !== 1 ? 'es' : ''}
        </span>
      </div>

      <div className="predefined-filters">
        <button
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          <i className="fas fa-list"></i>
          Todos
          <span className="count">{studyPlans.length}</span>
        </button>

        <button
          className={`filter-btn ${activeFilter === 'next-exam' ? 'active' : ''}`}
          onClick={() => handleFilterChange('next-exam')}
          disabled={!getNextExamPlan}
        >
          <i className="fas fa-clock"></i>
          Próximo Examen
          {getNextExamPlan && (
            <span className="exam-info">{getNextExamPlan.subjectName}</span>
          )}
        </button>

        <button
          className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => handleFilterChange('pending')}
          disabled={getPendingPlans.length === 0}
        >
          <i className="fas fa-exclamation-triangle"></i>
          Pendientes
          <span className="count">{getPendingPlans.length}</span>
        </button>

        <button
          className={`filter-btn ${activeFilter === 'selected' ? 'active' : ''}`}
          onClick={() => handleFilterChange('selected')}
        >
          <i className="fas fa-check-square"></i>
          Seleccionados
          <span className="count">{selectedSubjects.size}</span>
        </button>
      </div>

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
    </div>
  );
};

export default StudyPlanFilter;
