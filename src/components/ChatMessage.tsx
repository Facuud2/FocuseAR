import React from 'react';
import TypingIndicator from './TypingIndicator';

// Definimos los tipos de mensaje que puede tener nuestro chat
interface ChatMessageProps {
  message: string;           // El contenido del mensaje
  isUser: boolean;          // Si es del usuario o del sistema/bot
  timestamp?: Date;         // Cuándo se envió el mensaje (opcional)
  userName?: string;        // Nombre del usuario (opcional)
  isLoading?: boolean;      // Si el mensaje se está cargando
  messageType?: 'text' | 'system' | 'error'; // Tipo de mensaje
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser,
  timestamp,
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

  // Si está cargando, mostrar el indicador de escritura
  if (isLoading) {
    return (
      <TypingIndicator
        userName={userName}
        size="medium"
        style="dots"
        message="está escribiendo..."
        showAvatar={true}
      />
    );
  }

  // Si es un mensaje del sistema, mostrarlo de manera diferente
  if (messageType === 'system') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <div style={{
          padding: '6px 12px',
          borderRadius: '16px',
          backgroundColor: '#E5E7EB',
          color: '#6B7280',
          fontSize: '12px',
          fontStyle: 'italic'
        }}>
          {message}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      marginBottom: '16px',
      justifyContent: isUser ? 'flex-end' : 'flex-start'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        maxWidth: '70%',
        alignItems: 'flex-end'
      }}>
        
        {/* Contenedor del mensaje */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Nombre del usuario (si no es el usuario actual) */}
          {userName && !isUser && (
            <span style={{
              fontSize: '12px',
              color: '#6B7280',
              marginBottom: '4px',
              paddingLeft: '12px'
            }}>
              {userName}
            </span>
          )}

          {/* Burbuja del mensaje */}
          <div 
            style={{
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: isUser ? '#3B82F6' : '#F3F4F6',
              color: isUser ? 'white' : '#1F2937',
              maxWidth: '250px',
              wordWrap: 'break-word',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              borderBottomRightRadius: isUser ? '4px' : '18px',
              borderBottomLeftRadius: isUser ? '18px' : '4px'
            }}
          >
            {isLoading ? (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#9CA3AF',
                  borderRadius: '50%',
                  animation: 'bounce 1s infinite'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#9CA3AF',
                  borderRadius: '50%',
                  animation: 'bounce 1s infinite 0.1s'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#9CA3AF',
                  borderRadius: '50%',
                  animation: 'bounce 1s infinite 0.2s'
                }}></div>
              </div>
            ) : (
              <p style={{
                fontSize: '14px',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {message}
              </p>
            )}
          </div>

          {/* Timestamp */}
          {timestamp && (
            <span style={{
              fontSize: '11px',
              color: '#9CA3AF',
              marginTop: '4px',
              textAlign: isUser ? 'right' : 'left',
              paddingLeft: isUser ? '0' : '4px',
              paddingRight: isUser ? '4px' : '0'
            }}>
              {formatTime(timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;