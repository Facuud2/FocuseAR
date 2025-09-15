import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  showCharCount?: boolean;
  allowMultiline?: boolean;
  isLoading?: boolean;
  autoFocus?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Escribe tu mensaje...',
  maxLength = 500,
  showCharCount = true,
  allowMultiline = true,
  isLoading = false,
  autoFocus = false,
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && !isLoading) {
      onSendMessage(trimmedMessage);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (allowMultiline && e.shiftKey) {
        return;
      } else {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  };

  const getCharCountClass = () => {
    const percentage = message.length / maxLength;
    if (percentage > 0.9) return 'danger';
    if (percentage > 0.7) return 'warning';
    return '';
  };

  const canSend = message.trim().length > 0 && !disabled && !isLoading;

  return (
    <div className={`chat-input-wrapper ${isFocused ? 'is-focused' : ''}`}>
      <div className="chat-textarea-group">
        <div className="chat-textarea">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
          />
          {(disabled || isLoading) && (
            <div className="input-overlay">
              {isLoading ? '⏳ Enviando...' : '🔒 Chat deshabilitado'}
            </div>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="chat-send-btn"
        >
          {isLoading ? '⏳' : '📤'}
        </button>
      </div>
      <div className="chat-input-info">
        <div>
          {allowMultiline && (
            <span>
              💡 <strong>Enter</strong> envía, <strong>Shift+Enter</strong>{' '}
              nueva línea
            </span>
          )}
        </div>
        {showCharCount && (
          <div className={`char-counter ${getCharCountClass()}`}>
            {message.length}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
