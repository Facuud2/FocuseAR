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
  emptyStateMessage = 'No hay mensajes aún. ¡Inicia la conversación!',
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const scrollToBottom = (behavior: 'auto' | 'smooth' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;

      if (isAtBottom) {
        setIsUserScrolledUp(false);
        setHasNewMessages(false);
      } else {
        setIsUserScrolledUp(true);
      }
    }
  };

  useEffect(() => {
    if (autoScroll && !isUserScrolledUp) {
      scrollToBottom('smooth');
    } else if (autoScroll && isUserScrolledUp) {
      setHasNewMessages(true);
    }
  }, [messages, autoScroll, isUserScrolledUp]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom('auto'), 100);
    }
  }, [messages.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const forceScrollToBottom = () => {
    setIsUserScrolledUp(false);
    setHasNewMessages(false);
    scrollToBottom('smooth');
  };

  return (
    <div className="chat-history-wrapper">
      <div
        ref={containerRef}
        className="chat-history-container"
        style={{ height: height }}
      >
        {messages.length === 0 && !isLoading && (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <p className="empty-state-message">{emptyStateMessage}</p>
          </div>
        )}

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

        {showTypingIndicator && (
          <TypingIndicator
            userName="Asistente IA"
            size="medium"
            style="dots"
            message="Asistente IA está escribiendo..."
            showAvatar={true}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {hasNewMessages && isUserScrolledUp && (
        <div className="scroll-to-bottom-btn-wrapper">
          <button
            onClick={forceScrollToBottom}
            className="scroll-to-bottom-btn"
          >
            <span>📩</span>
            Nuevos mensajes
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;
