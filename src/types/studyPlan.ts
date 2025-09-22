import type { Timestamp } from 'firebase/firestore';

// Definiciones de tipos para el plan de estudio
export interface Topic {
  id: string;
  title: string;
  description?: string;
  order?: number;
}

export interface StudyPlanGenerated {
  title: string;
  summary?: string;
  durationDays: number;
  examDate?: string;
  selectedWeekDays?: number[];
  topics?: Topic[]; // ahora es array de objetos editables
  studyDates?: string[];
  subjectColor?: string;
  structuredPlan?: Record<string, unknown> | null;
  dailyTasks: Array<{
    day: number;
    task: string;
    completed?: boolean;
  }>;
}

export interface StudyPlan {
  id?: string;
  userId: string;
  materialId: string;
  generatedPlan: StudyPlanGenerated;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}
