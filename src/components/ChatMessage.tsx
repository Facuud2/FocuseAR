import React from 'react';

// Tipo de dato para representar un mensaje del chat
export type ChatMsg = {
  id: string | number;
  text?: string;
  sender: 'user' | 'ai';
  timestamp?: string;
  loading?: boolean;
};

// Componente que muestra un mensaje de chat
const ChatMessage: React.FC<{ message: ChatMsg }> = ({ message }) => {
  return (
    // Contenedor principal del mensaje, cambia la clase según sea de usuario o IA
    <div
      className={`chat-message ${message.sender === 'user' ? 'user' : 'ai'}`}
    >
      <div className="bubble">
        {message.loading ? (
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : (
          <div className="text">{message.text}</div>
        )}
        {message.timestamp && (
          <div className="ts">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};
// Exporta el componente para poder usarlo en otros archivos
export default ChatMessage;
