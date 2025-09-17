import React, { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

// Interfaz para los mensajes de conversación
interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | { toDate: () => Date }; // Firestore Timestamp
  messageType?: 'text' | 'system' | 'error';
}

// Interfaz para la conversación completa
interface Conversation {
  id: string;
  userId: string;
  title?: string;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
  messages: ConversationMessage[];
}

interface ConversationHistoryProps {
  conversationId: string;
  height?: string;
  autoScroll?: boolean;
  showTypingIndicator?: boolean;
  emptyStateMessage?: string;
  onConversationLoad?: (conversation: Conversation | null) => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversationId,
  height = '400px',
  autoScroll = true,
  showTypingIndicator = false,
  emptyStateMessage = 'No hay mensajes en esta conversación.',
  onConversationLoad,
}) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    if (!conversationId) {
      setConversation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Configurar listener en tiempo real para la conversación
    const conversationRef = doc(db, 'ai_conversations', conversationId);
    const unsubscribe = onSnapshot(
      conversationRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const conversationData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          } as Conversation;

          setConversation(conversationData);
          onConversationLoad?.(conversationData);
        } else {
          setConversation(null);
          setError('Conversación no encontrada');
          onConversationLoad?.(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar conversación:', error);
        setError('Error al cargar la conversación');
        setLoading(false);
        onConversationLoad?.(null);
      },
    );

    return () => unsubscribe();
  }, [conversationId, onConversationLoad]);

  useEffect(() => {
    if (autoScroll && !isUserScrolledUp && conversation?.messages) {
      scrollToBottom('smooth');
    } else if (autoScroll && isUserScrolledUp && conversation?.messages) {
      setHasNewMessages(true);
    }
  }, [conversation?.messages, autoScroll, isUserScrolledUp]);

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

  if (loading) {
    return (
      <div className="chat-history-wrapper">
        <div className="chat-history-container" style={{ height: height }}>
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <p className="empty-state-message">Cargando conversación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-history-wrapper">
        <div className="chat-history-container" style={{ height: height }}>
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <p className="empty-state-message">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (
    !conversation ||
    !conversation.messages ||
    conversation.messages.length === 0
  ) {
    return (
      <div className="chat-history-wrapper">
        <div className="chat-history-container" style={{ height: height }}>
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <p className="empty-state-message">{emptyStateMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-history-wrapper">
      <div
        ref={containerRef}
        className="chat-history-container"
        style={{ height: height }}
      >
        {conversation.messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.content}
            isUser={msg.role === 'user'}
            timestamp={
              msg.timestamp instanceof Date
                ? msg.timestamp
                : typeof msg.timestamp === 'object' && 'toDate' in msg.timestamp
                  ? msg.timestamp.toDate()
                  : new Date()
            }
            userName={msg.role === 'assistant' ? 'Asistente IA' : undefined}
            messageType={msg.messageType || 'text'}
            isLoading={false}
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

export default ConversationHistory;
