import React from 'react';

interface AnalysisModalProps {
  isAnalyzing: boolean;
  progress: number;
  statusMessage: string;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isAnalyzing,
  progress,
  statusMessage,
}) => {
  if (!isAnalyzing) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-5">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
        <h3 className="text-xl font-semibold text-blue-600 mb-2">
          Analizando PDF con IA
        </h3>
        <p className="text-gray-700 mb-4">{statusMessage}</p>

        <div className="w-full bg-gray-100 rounded-full h-5 mb-4 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>

        <p className="text-sm text-gray-500 italic">
          Esto puede tomar unos segundos. Por favor, no cierres esta ventana.
        </p>
      </div>
    </div>
  );
};

export default AnalysisModal;
