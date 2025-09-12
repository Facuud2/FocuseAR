import React from 'react';

// Definimos los tipos de mensaje que puede tener nuestro chat
interface ChatMessageProps {
  message: string;           // El contenido del mensaje
  isUser: boolean;          // Si es del usuario o del sistema/bot
  timestamp?: Date;         // Cuándo se envió el mensaje (opcional)
  avatar?: string;          // URL del avatar (opcional)
  userName?: string;        // Nombre del usuario (opcional)
  isLoading?: boolean;      // Si el mensaje se está cargando
  messageType?: 'text' | 'system' | 'error'; // Tipo de mensaje
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser,
  timestamp,
  avatar,
  userName,
  isLoading = false,
  messageType = 'text'
}) => {
  // Función para formatear la hora
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Función para obtener los estilos según el tipo de mensaje
  const getMessageStyles = () => {
    if (messageType === 'system') {
      return 'bg-gray-200 text-gray-600 text-center italic';
    }
    if (messageType === 'error') {
      return 'bg-red-100 text-red-700 border border-red-200';
    }
    return isUser 
      ? 'bg-blue-500 text-white rounded-br-sm' 
      : 'bg-gray-100 text-gray-800 rounded-bl-sm';
  };

  // Componente de indicador de carga
  const LoadingDots = () => (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
    </div>
  );

  // Si es un mensaje del sistema, mostrarlo de manera diferente
  if (messageType === 'system') {
    return (
      <div className="flex justify-center mb-4">
        <div className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-xs">
          {message}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-xs lg:max-w-md`}>
        
        {/* Avatar del usuario/bot */}
        {avatar && (
          <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`}>
            <img
              className="w-8 h-8 rounded-full object-cover"
              src={avatar}
              alt={userName || (isUser ? 'Usuario' : 'Bot')}
            />
          </div>
        )}

        {/* Contenedor del mensaje */}
        <div className="flex flex-col">
          
          {/* Nombre del usuario (si no es el usuario actual) */}
          {userName && !isUser && (
            <span className="text-xs text-gray-500 mb-1 px-3">
              {userName}
            </span>
          )}

          {/* Burbuja del mensaje */}
          <div className={`
            px-4 py-2 rounded-lg shadow-sm
            ${getMessageStyles()}
          `}>
            {isLoading ? (
              <LoadingDots />
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message}
              </p>
            )}
          </div>

          {/* Timestamp */}
          {timestamp && (
            <span className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'} px-1`}>
              {formatTime(timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;