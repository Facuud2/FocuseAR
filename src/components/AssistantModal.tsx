import React, { useState, type JSX } from 'react';
import AssistantIA from './AssistantIA';
import { MessageSquare, X } from 'lucide-react';
import './AssistantModal.css'; // Crea este archivo si necesitas estilos específicos

export const AssistantModal: React.FC = (): JSX.Element => {
  const [showChatModal, setShowChatModal] = useState(false);

  return (
    <>
      {/* Botón para abrir el modal */}
      <div className="assistant-button-panel">
        <h3 className="panel-title">Asistente de IA</h3>
        <button
          className="start-chat-btn"
          onClick={() => setShowChatModal(true)}
        >
          <MessageSquare size={20} />
          <span>Iniciar Nueva Conversación</span>
        </button>
      </div>

      {/* Modal para el asistente de IA */}
      {showChatModal && (
        <div className="modal-overlay" onClick={() => setShowChatModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="panel-title-container">
              <h3 className="modal-title">Asistente de IA</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowChatModal(false)}
              >
                <X size={32} />
              </button>
            </div>
            <AssistantIA />
          </div>
        </div>
      )}
    </>
  );
};
