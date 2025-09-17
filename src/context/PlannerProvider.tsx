import React, { useState } from 'react';
import { type ExtractedTopic } from '../services/PDFProcessor';
import { PlannerContext } from './PlannerContext';

export const PlannerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [extractedTopics, setExtractedTopics] = useState<ExtractedTopic[]>([]);
  return (
    <PlannerContext.Provider value={{ extractedTopics, setExtractedTopics }}>
      {children}
    </PlannerContext.Provider>
  );
};
