export interface RawQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface FolderData {
  name: string;
  path: string;
  userId: string;
}

export interface UserAvailability {
  selectedWeekDays: number[];
}
