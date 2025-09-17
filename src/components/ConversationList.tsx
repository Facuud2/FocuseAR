import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';

// Interfaz para las conversaciones
interface ConversationItem {
  id: string;
  userId: string;
  title?: string;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date | { toDate: () => Date };
  }>;
}

interface ConversationListProps {
  onSelectConversation: (conversationId: string | null) => void;
  selectedConversationId: string | null;
  onNewConversation: () => void;
  onClose?: () => void;
  className?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedConversationId,
  onNewConversation,
  onClose,
  className = '',
}) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { deleteAIConversation } = useDatabase();

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Configurar listener en tiempo real para las conversaciones del usuario
    const conversationsQuery = query(
      collection(db, 'ai_conversations'),
      where('userId', '==', user.uid),
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (querySnapshot) => {
        const conversationsList: ConversationItem[] = [];
        querySnapshot.forEach((doc) => {
          conversationsList.push({
            id: doc.id,
            ...doc.data(),
          } as ConversationItem);
        });

        // Ordenar manualmente por updatedAt en orden descendente
        conversationsList.sort((a, b) => {
          const aTime =
            a.updatedAt instanceof Date
              ? a.updatedAt
              : typeof a.updatedAt === 'object' && 'toDate' in a.updatedAt
                ? a.updatedAt.toDate()
                : new Date(0);
          const bTime =
            b.updatedAt instanceof Date
              ? b.updatedAt
              : typeof b.updatedAt === 'object' && 'toDate' in b.updatedAt
                ? b.updatedAt.toDate()
                : new Date(0);
          return bTime.getTime() - aTime.getTime();
        });

        setConversations(conversationsList);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar conversaciones:', error);
        setError('Error al cargar las conversaciones');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const formatDate = (timestamp: Date | { toDate: () => Date }): string => {
    let date: Date;
    if (typeof timestamp === 'object' && 'toDate' in timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return 'Fecha desconocida';
    }

    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const getLastMessage = (conversation: ConversationItem): string => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return 'Sin mensajes';
    }

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const content = lastMessage.content;

    if (content.length > 60) {
      return content.substring(0, 60) + '...';
    }

    return content;
  };

  if (loading) {
    return (
      <div className={`conversation-list ${className}`}>
        <div className="conversation-list-header">
          <h3>💬 Conversaciones</h3>
          <div className="conversation-header-actions">
            <button
              onClick={onNewConversation}
              className="new-conversation-btn"
              title="Nueva conversación"
            >
              ➕
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="close-conversation-btn"
                title="Cerrar historial"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="conversation-list-content">
          <div className="conversation-list-loading">
            <div className="loading-spinner">⏳</div>
            <p>Cargando conversaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`conversation-list ${className}`}>
        <div className="conversation-list-header">
          <h3>💬 Conversaciones</h3>
          <div className="conversation-header-actions">
            <button
              onClick={onNewConversation}
              className="new-conversation-btn"
              title="Nueva conversación"
            >
              ➕
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="close-conversation-btn"
                title="Cerrar historial"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="conversation-list-content">
          <div className="conversation-list-error">
            <div className="error-icon">❌</div>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`conversation-list ${className}`}>
      <div className="conversation-list-header">
        <h3>💬 Conversaciones</h3>
        <div className="conversation-header-actions">
          <button
            onClick={onNewConversation}
            className="new-conversation-btn"
            title="Nueva conversación"
          >
            ➕
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="close-conversation-btn"
              title="Cerrar historial"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="conversation-list-content">
        {conversations.length === 0 ? (
          <div className="conversation-list-empty">
            <div className="empty-icon">💭</div>
            <p>No tienes conversaciones aún</p>
            <button
              onClick={onNewConversation}
              className="start-conversation-btn"
            >
              Iniciar primera conversación
            </button>
          </div>
        ) : (
          <div className="conversation-items">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${
                  selectedConversationId === conversation.id ? 'selected' : ''
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="conversation-item-content">
                  <div className="conversation-title">
                    {conversation.title || 'Conversación sin título'}
                  </div>
                  <div className="conversation-preview">
                    {getLastMessage(conversation)}
                  </div>
                  <div className="conversation-date">
                    {formatDate(conversation.updatedAt)}
                  </div>
                </div>
                <div className="conversation-item-actions">
                  <button
                    className="conversation-action-btn"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          '¿Estás seguro de que quieres eliminar esta conversación?',
                        )
                      ) {
                        try {
                          await deleteAIConversation(conversation.id);
                          console.log(
                            '✅ Conversación eliminada:',
                            conversation.id,
                          );
                        } catch (error) {
                          console.error(
                            '❌ Error al eliminar conversación:',
                            error,
                          );
                        }
                      }
                    }}
                    title="Eliminar conversación"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
