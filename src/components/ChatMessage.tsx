import TypingIndicator from './TypingIndicator';

// Definimos los tipos de mensaje que puede tener nuestro chat
interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  userName?: string;
  isLoading?: boolean;
  messageType?: 'text' | 'system' | 'error';
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser,
  timestamp,
  userName,
  isLoading = false,
  messageType = 'text',
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  if (messageType === 'system' || messageType === 'error') {
    return (
      <div className="system-message">
        <div className="system-message-bubble">{message}</div>
      </div>
    );
  }

  return (
    <div className={`chat-message-item ${isUser ? 'is-user' : 'is-ai'}`}>
      <div className="message-content">
        {userName && !isUser && (
          <span className="message-sender-name">{userName}</span>
        )}
        <div className="message-bubble">
          <p>{message}</p>
        </div>
        {timestamp && (
          <span className="message-info">{formatTime(timestamp)}</span>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
