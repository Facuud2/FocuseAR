import React, { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

// Definimos el tipo de mensaje para el historial
interface Message {
  id: string | number;
  message: string;
  isUser: boolean;
  timestamp: Date;
  userName?: string;
  messageType?: 'text' | 'system' | 'error';
  isLoading?: boolean;
}

interface ChatHistoryProps {
  messages: Message[];
  isLoading?: boolean;
  height?: string;
  autoScroll?: boolean;
  showTypingIndicator?: boolean;
  emptyStateMessage?: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  isLoading = false,
  height = '400px',
  autoScroll = true,
  showTypingIndicator = false,
  emptyStateMessage = 'No hay mensajes aún. ¡Inicia la conversación!'
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Agregar estilo CSS para la animación
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-10px);
        }
        60% {
          transform: translateY(-5px);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Función para hacer scroll al final
  const scrollToBottom = (behavior: 'auto' | 'smooth' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Función para verificar si el usuario ha hecho scroll hacia arriba
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10; // 10px de tolerancia
      
      if (isAtBottom) {
        setIsUserScrolledUp(false);
        setHasNewMessages(false);
      } else {
        setIsUserScrolledUp(true);
      }
    }
  };

  // Auto-scroll cuando llegan mensajes nuevos
  useEffect(() => {
    if (autoScroll && !isUserScrolledUp) {
      scrollToBottom('smooth');
    } else if (autoScroll && isUserScrolledUp) {
      setHasNewMessages(true);
    }
  }, [messages, autoScroll, isUserScrolledUp]);

  // Scroll inicial (inmediato)
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom('auto'), 100);
    }
  }, []);

  // Agregar listener de scroll
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Función para forzar scroll al final
  const forceScrollToBottom = () => {
    setIsUserScrolledUp(false);
    setHasNewMessages(false);
    scrollToBottom('smooth');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: height,
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
      position: 'relative'
    }}>
      
      {/* Header del chat */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isLoading ? '#F59E0B' : '#10B981'
          }} />
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
          }}>
            {isLoading ? 'Conectando...' : 'Chat Activo'}
          </span>
        </div>
        
        <span style={{
          fontSize: '12px',
          color: '#6B7280'
        }}>
          {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Contenedor de mensajes */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#F9FAFB'
        }}
      >
        {/* Estado vacío */}
        {messages.length === 0 && !isLoading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              💬
            </div>
            <p style={{
              fontSize: '14px',
              margin: 0
            }}>
              {emptyStateMessage}
            </p>
          </div>
        )}

        {/* Lista de mensajes */}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.message}
            isUser={msg.isUser}
            timestamp={msg.timestamp}
            userName={msg.userName}
            messageType={msg.messageType}
            isLoading={msg.isLoading}
          />
        ))}

        {/* Indicador de escritura */}
        {showTypingIndicator && (
          <TypingIndicator
            userName="Asistente IA"
            size="medium"
            style="dots"
            message="está escribiendo..."
            showAvatar={true}
          />
        )}

        {/* Referencia para scroll automático */}
        <div ref={messagesEndRef} />
      </div>

      {/* Botón flotante para nuevos mensajes */}
      {hasNewMessages && isUserScrolledUp && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: '16px',
          zIndex: 10
        }}>
          <button
            onClick={forceScrollToBottom}
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              animation: 'bounce 2s infinite'
            }}
          >
            <span>📩</span>
            Nuevos mensajes
          </button>
        </div>
      )}

      {/* Footer con información */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB',
        fontSize: '11px',
        color: '#9CA3AF',
        textAlign: 'center'
      }}>
        {autoScroll ? '📍 Auto-scroll activado' : '⏸️ Auto-scroll pausado'}
      </div>
    </div>
  );
};

export default ChatHistory;