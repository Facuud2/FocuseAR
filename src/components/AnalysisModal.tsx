import React from 'react';
import './AnalysisModal.css';

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
    <div className="analysis-modal">
      <div className="analysis-modal-content">
        <div className="modal-header">
          <i className="fas fa-cog modal-icon animate-spin"></i>
          <h3 className="text-xl font-semibold text-gray-800">
            Analizando PDF
          </h3>
          <p className="text-gray-600 text-sm italic">
            Esto puede tardar unos segundos...
          </p>
        </div>
        <div className="modal-body">
          <p className="status-message">{statusMessage}</p>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}>
              <span className="progress-text">{progress}%</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <p className="note-text">Por favor, no cierres esta ventana.</p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
