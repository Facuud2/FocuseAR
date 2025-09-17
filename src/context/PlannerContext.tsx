import React, { createContext, useContext } from 'react';
import { type ExtractedTopic } from '../services/PDFProcessor';

export interface PlannerContextType {
  extractedTopics: ExtractedTopic[];
  setExtractedTopics: React.Dispatch<React.SetStateAction<ExtractedTopic[]>>;
}

export const PlannerContext = createContext<PlannerContextType | undefined>(
  undefined,
);

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (context === undefined) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};
