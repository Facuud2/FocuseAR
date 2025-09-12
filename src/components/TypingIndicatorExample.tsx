import React, { useState, useEffect } from 'react';
import TypingIndicator from './TypingIndicator';

const TypingIndicatorExample: React.FC = () => {
  const [currentStyle, setCurrentStyle] = useState<'dots' | 'wave' | 'pulse'>('dots');
  const [currentSize, setCurrentSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showDemo, setShowDemo] = useState(false);

  // Ciclo automático de demostración
  useEffect(() => {
    if (showDemo) {
      const interval = setInterval(() => {
        setCurrentStyle(prev => {
          if (prev === 'dots') return 'wave';
          if (prev === 'wave') return 'pulse';
          return 'dots';
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [showDemo]);

  const styles: Array<'dots' | 'wave' | 'pulse'> = ['dots', 'wave', 'pulse'];
  const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#F9FAFB',
      borderRadius: '16px'
    }}>
      
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        textAlign: 'center',
        color: '#1F2937'
      }}>
        ⌨️ Indicadores de "IA está escribiendo..."
      </h2>

      {/* Controles */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '30px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        
        {/* Selector de estilo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
            Estilo de animación:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {styles.map(style => (
              <button
                key={style}
                onClick={() => setCurrentStyle(style)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: currentStyle === style ? '#3B82F6' : '#E5E7EB',
                  color: currentStyle === style ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {style === 'dots' ? '• • •' : style === 'wave' ? '≋≋≋' : '●'}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de tamaño */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
            Tamaño:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {sizes.map(size => (
              <button
                key={size}
                onClick={() => setCurrentSize(size)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: currentSize === size ? '#10B981' : '#E5E7EB',
                  color: currentSize === size ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle demo automático */}
        <button
          onClick={() => setShowDemo(!showDemo)}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: showDemo ? '#F59E0B' : '#6B7280',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {showDemo ? '⏸️ Pausar demo' : '▶️ Demo automático'}
        </button>
      </div>

      {/* Área de demostración */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid #E5E7EB',
        minHeight: '200px'
      }}>
        
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#374151'
        }}>
          Vista previa en tiempo real:
        </h3>

        {/* Ejemplo actual */}
        <TypingIndicator
          userName="Asistente IA"
          size={currentSize}
          style={currentStyle}
          message="está escribiendo..."
          showAvatar={true}
        />

        {/* Variaciones adicionales */}
        <TypingIndicator
          userName="Tutor de Matemáticas"
          size={currentSize}
          style={currentStyle}
          message="preparando ejercicios..."
          showAvatar={true}
          dotColor="#10B981"
          backgroundColor="#ECFDF5"
        />

        <TypingIndicator
          userName="Planificador"
          size={currentSize}
          style={currentStyle}
          message="creando tu horario..."
          showAvatar={true}
          dotColor="#F59E0B"
          backgroundColor="#FFFBEB"
        />
      </div>

      {/* Comparación de todos los estilos */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #E5E7EB'
      }}>
        
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#374151'
        }}>
          Comparación de estilos:
        </h3>

        <div style={{
          display: 'grid',
          gap: '16px'
        }}>
          
          {/* Estilo dots */}
          <div>
            <h4 style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Puntos rebotantes (dots):</h4>
            <TypingIndicator
              userName="IA"
              size="medium"
              style="dots"
              message="está escribiendo..."
              showAvatar={true}
            />
          </div>

          {/* Estilo wave */}
          <div>
            <h4 style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Onda (wave):</h4>
            <TypingIndicator
              userName="IA"
              size="medium"
              style="wave"
              message="está escribiendo..."
              showAvatar={true}
            />
          </div>

          {/* Estilo pulse */}
          <div>
            <h4 style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Pulso (pulse):</h4>
            <TypingIndicator
              userName="IA"
              size="medium"
              style="pulse"
              message="está escribiendo..."
              showAvatar={true}
            />
          </div>
        </div>
      </div>

      {/* Información técnica */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #E5E7EB'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '12px',
          color: '#374151'
        }}>
          ✨ Características del TypingIndicator:
        </h3>
        <ul style={{
          fontSize: '14px',
          color: '#6B7280',
          lineHeight: '1.6',
          margin: 0,
          paddingLeft: '20px'
        }}>
          <li>🎨 <strong>3 estilos de animación:</strong> Puntos rebotantes, onda y pulso</li>
          <li>📏 <strong>3 tamaños:</strong> Small, medium, large</li>
          <li>🎭 <strong>Personalizable:</strong> Colores, mensajes y avatares</li>
          <li>⚡ <strong>Optimizado:</strong> Animaciones CSS suaves y eficientes</li>
          <li>🔄 <strong>Responsive:</strong> Se adapta a diferentes contenedores</li>
          <li>🎯 <strong>Accesible:</strong> Estados claros para usuarios</li>
          <li>🛠️ <strong>Reutilizable:</strong> Fácil integración en cualquier chat</li>
        </ul>
      </div>
    </div>
  );
};

export default TypingIndicatorExample;