interface TypingIndicatorProps {
  userName?: string;
  size?: 'small' | 'medium' | 'large';
  style?: 'dots' | 'text';
  message?: string;
  showAvatar?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName }) => {
  return (
    <div className="typing-indicator-container">
      <div className="typing-dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      <span className="typing-indicator-message">
        {userName} está escribiendo...
      </span>
    </div>
  );
};

export default TypingIndicator;
