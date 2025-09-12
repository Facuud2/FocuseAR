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
  placeholder = "Escribe tu mensaje...",
  maxLength = 500,
  showCharCount = true,
  allowMultiline = true,
  isLoading = false,
  autoFocus = false
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus cuando se monte el componente
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Función para enviar mensaje
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && !isLoading) {
      onSendMessage(trimmedMessage);
      setMessage('');
      // Resetear altura del textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Manejar teclas especiales
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (allowMultiline && e.shiftKey) {
        // Shift + Enter = nueva línea
        return;
      } else {
        // Enter = enviar mensaje
        e.preventDefault();
        handleSend();
      }
    }
  };

  // Auto-resize del textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
      
      // Auto-resize
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  };

  // Calcular color del contador de caracteres
  const getCharCountColor = () => {
    const percentage = message.length / maxLength;
    if (percentage > 0.9) return '#EF4444'; // Rojo
    if (percentage > 0.7) return '#F59E0B'; // Amarillo
    return '#6B7280'; // Gris
  };

  // Verificar si se puede enviar
  const canSend = message.trim().length > 0 && !disabled && !isLoading;

  return (
    <div style={{
      border: `2px solid ${isFocused ? '#3B82F6' : '#E5E7EB'}`,
      borderRadius: '16px',
      backgroundColor: '#FFFFFF',
      padding: '12px',
      transition: 'all 0.2s ease',
      boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none'
    }}>
      
      {/* Área de texto principal */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '12px'
      }}>
        
        {/* Textarea */}
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            style={{
              width: '100%',
              minHeight: '44px',
              maxHeight: '120px',
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#F9FAFB',
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              color: disabled ? '#9CA3AF' : '#1F2937'
            }}
            rows={1}
          />
          
          {/* Overlay para mostrar estados */}
          {(disabled || isLoading) && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#6B7280'
            }}>
              {isLoading ? '⏳ Enviando...' : '🔒 Chat deshabilitado'}
            </div>
          )}
        </div>

        {/* Botón de envío */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: canSend ? '#3B82F6' : '#E5E7EB',
            color: canSend ? '#FFFFFF' : '#9CA3AF',
            cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'all 0.2s ease',
            transform: canSend ? 'scale(1)' : 'scale(0.95)',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            if (canSend) {
              e.currentTarget.style.backgroundColor = '#2563EB';
            }
          }}
          onMouseLeave={(e) => {
            if (canSend) {
              e.currentTarget.style.backgroundColor = '#3B82F6';
            }
          }}
        >
          {isLoading ? '⏳' : '📤'}
        </button>
      </div>

      {/* Barra inferior con información */}
      <div style={{
        marginTop: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#6B7280'
      }}>
        
        {/* Ayuda de uso */}
        <div>
          {allowMultiline && (
            <span>
              💡 <strong>Enter</strong> envía, <strong>Shift+Enter</strong> nueva línea
            </span>
          )}
        </div>

        {/* Contador de caracteres */}
        {showCharCount && (
          <div style={{
            color: getCharCountColor(),
            fontWeight: message.length > maxLength * 0.8 ? '600' : '400'
          }}>
            {message.length}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;