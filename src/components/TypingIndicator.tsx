import React from 'react';

interface TypingIndicatorProps {
  userName?: string;
  avatar?: string;
  showAvatar?: boolean;
  dotColor?: string;
  backgroundColor?: string;
  size?: 'small' | 'medium' | 'large';
  style?: 'dots' | 'wave' | 'pulse';
  message?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userName = "IA",
  avatar,
  showAvatar = true,
  dotColor = '#9CA3AF',
  backgroundColor = '#F3F4F6',
  size = 'medium',
  style = 'dots',
  message = "está escribiendo..."
}) => {
  // Configuraciones según el tamaño
  const sizeConfig = {
    small: { dotSize: '6px', padding: '8px 12px', fontSize: '12px' },
    medium: { dotSize: '8px', padding: '12px 16px', fontSize: '14px' },
    large: { dotSize: '10px', padding: '16px 20px', fontSize: '16px' }
  };

  const config = sizeConfig[size];

  // Componente de puntos animados
  const AnimatedDots = () => {
    if (style === 'dots') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            width: config.dotSize,
            height: config.dotSize,
            backgroundColor: dotColor,
            borderRadius: '50%',
            animation: 'typingBounce 1.4s infinite ease-in-out',
            animationDelay: '0ms'
          }} />
          <div style={{
            width: config.dotSize,
            height: config.dotSize,
            backgroundColor: dotColor,
            borderRadius: '50%',
            animation: 'typingBounce 1.4s infinite ease-in-out',
            animationDelay: '200ms'
          }} />
          <div style={{
            width: config.dotSize,
            height: config.dotSize,
            backgroundColor: dotColor,
            borderRadius: '50%',
            animation: 'typingBounce 1.4s infinite ease-in-out',
            animationDelay: '400ms'
          }} />
        </div>
      );
    }
    
    if (style === 'wave') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: '3px',
                height: config.dotSize,
                backgroundColor: dotColor,
                borderRadius: '2px',
                animation: 'typingWave 1.2s infinite ease-in-out',
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      );
    }

    // style === 'pulse'
    return (
      <div style={{
        width: config.dotSize,
        height: config.dotSize,
        backgroundColor: dotColor,
        borderRadius: '50%',
        animation: 'typingPulse 1.5s infinite ease-in-out'
      }} />
    );
  };

  return (
    <>
      {/* Agregar estilos CSS para las animaciones */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }

        @keyframes typingWave {
          0%, 40%, 100% {
            transform: scaleY(0.4);
          }
          20% {
            transform: scaleY(1);
          }
        }

        @keyframes typingPulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes typingGlow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
          }
        }
      `}</style>

      <div style={{
        display: 'flex',
        marginBottom: '16px',
        justifyContent: 'flex-start'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          maxWidth: '70%',
          alignItems: 'flex-end'
        }}>
          
          {/* Avatar (opcional) */}
          {showAvatar && (
            <div style={{
              marginRight: '8px',
              flexShrink: 0
            }}>
              {avatar ? (
                <img
                  src={avatar}
                  alt={userName}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  🤖
                </div>
              )}
            </div>
          )}

          {/* Contenedor del indicador */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Nombre del usuario */}
            {userName && (
              <span style={{
                fontSize: '12px',
                color: '#6B7280',
                marginBottom: '4px',
                paddingLeft: '12px'
              }}>
                {userName}
              </span>
            )}

            {/* Burbuja con indicador */}
            <div style={{
              padding: config.padding,
              borderRadius: '18px',
              backgroundColor: backgroundColor,
              border: '1px solid #E5E7EB',
              borderBottomLeftRadius: '4px',
              minWidth: '80px',
              animation: 'typingGlow 2s infinite ease-in-out'
            }}>
              
              {/* Contenido principal */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AnimatedDots />
                <span style={{
                  fontSize: config.fontSize,
                  color: '#6B7280',
                  fontStyle: 'italic'
                }}>
                  {message}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TypingIndicator;