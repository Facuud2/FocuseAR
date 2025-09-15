import React from 'react';

// Se ha actualizado la interfaz para incluir los nuevos estilos 'wave' y 'pulse'.
interface TypingIndicatorProps {
  userName?: string;
  size?: 'small' | 'medium' | 'large';
  style?: 'dots' | 'text' | 'wave' | 'pulse';
  message?: string;
  showAvatar?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userName,
  style = 'dots',
}) => {
  // Ahora el componente usa un `switch` para renderizar el estilo correcto según la prop.
  const renderIndicator = () => {
    switch (style) {
      case 'dots':
        return (
          <div className="typing-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        );
      case 'wave':
        return (
          <div className="typing-wave">
            <span className="wave-dot"></span>
            <span className="wave-dot"></span>
            <span className="wave-dot"></span>
          </div>
        );
      case 'pulse':
        return (
          <div className="typing-pulse">
            <div className="pulse-circle"></div>
          </div>
        );
      default:
        return (
          <div className="typing-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        );
    }
  };

  return (
    <div className="typing-indicator-container">
      {renderIndicator()}
      <span className="typing-indicator-message">
        {userName} está escribiendo...
      </span>
    </div>
  );
};

export default TypingIndicator;
