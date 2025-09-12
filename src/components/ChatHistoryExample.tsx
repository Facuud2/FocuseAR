import React, { useState, useEffect } from 'react';
import ChatHistory from './ChatHistory';

// Tipo para los mensajes del ejemplo
interface ExampleMessage {
  id: number;
  message: string;
  isUser: boolean;
  timestamp: Date;
  userName?: string;
  messageType?: 'text' | 'system' | 'error';
}

// Ejemplo de uso del componente ChatHistory
const ChatHistoryExample: React.FC = () => {
  const [messages, setMessages] = useState<ExampleMessage[]>([
    {
      id: 1,
      message: '¡Bienvenido al chat! ¿En qué puedo ayudarte hoy?',
      isUser: false,
      timestamp: new Date(Date.now() - 600000), // 10 minutos atrás
      userName: 'Asistente IA',
      messageType: 'text' as const,
    },
    {
      id: 2,
      message: 'Hola, necesito ayuda con mi planificación de estudios',
      isUser: true,
      timestamp: new Date(Date.now() - 540000), // 9 minutos atrás
    },
    {
      id: 3,
      message: 'Usuario se conectó al chat',
      isUser: false,
      timestamp: new Date(Date.now() - 480000), // 8 minutos atrás
      messageType: 'system' as const,
    },
    {
      id: 4,
      message:
        'Perfecto, puedo ayudarte a crear un plan de estudios personalizado. ¿Qué materias estás cursando?',
      isUser: false,
      timestamp: new Date(Date.now() - 420000), // 7 minutos atrás
      userName: 'Asistente IA',
    },
    {
      id: 5,
      message:
        'Estoy cursando Matemáticas, Física y Química. Tengo exámenes en 2 semanas',
      isUser: true,
      timestamp: new Date(Date.now() - 360000), // 6 minutos atrás
    },
    {
      id: 6,
      message:
        'Excelente información. Voy a crear un plan optimizado para tus 3 materias considerando el tiempo disponible.',
      isUser: false,
      timestamp: new Date(Date.now() - 300000), // 5 minutos atrás
      userName: 'Asistente IA',
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Función para simular un nuevo mensaje
  const addMessage = () => {
    const isUserMessage = Math.random() > 0.5;
    const newMessage: ExampleMessage = {
      id: Date.now(),
      message: `Nuevo mensaje agregado a las ${new Date().toLocaleTimeString()}`,
      isUser: isUserMessage,
      timestamp: new Date(),
      userName: !isUserMessage ? 'Asistente IA' : undefined,
      messageType: 'text',
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  // Función para simular indicador de escritura
  const simulateTyping = () => {
    setShowTyping(true);
    setTimeout(() => {
      setShowTyping(false);
      addMessage();
    }, 2000);
  };

  // Función para limpiar historial
  const clearHistory = () => {
    setMessages([]);
  };

  // Simular carga inicial
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, []);

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#F3F4F6',
        borderRadius: '16px',
      }}
    >
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          textAlign: 'center',
          color: '#1F2937',
        }}
      >
        📚 Historial de Chat - Planificador de Estudios
      </h2>

      {/* Controles del ejemplo */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={addMessage}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ➕ Agregar mensaje
        </button>

        <button
          onClick={simulateTyping}
          style={{
            padding: '8px 16px',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ⌨️ Simular escritura
        </button>

        <button
          onClick={() => setAutoScroll(!autoScroll)}
          style={{
            padding: '8px 16px',
            backgroundColor: autoScroll ? '#F59E0B' : '#6B7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {autoScroll ? '⏸️ Pausar scroll' : '▶️ Activar scroll'}
        </button>

        <button
          onClick={clearHistory}
          style={{
            padding: '8px 16px',
            backgroundColor: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          🗑️ Limpiar
        </button>
      </div>

      {/* Componente ChatHistory */}
      <ChatHistory
        messages={messages}
        isLoading={isLoading}
        height="500px"
        autoScroll={autoScroll}
        showTypingIndicator={showTyping}
        emptyStateMessage="El chat está vacío. ¡Comienza agregando un mensaje!"
      />

      {/* Información del componente */}
      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#374151',
          }}
        >
          ✨ Características del ChatHistory:
        </h3>
        <ul
          style={{
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '1.6',
            margin: 0,
            paddingLeft: '20px',
          }}
        >
          <li>
            📜 <strong>Historial completo:</strong> Muestra todos los mensajes
            con scroll automático
          </li>
          <li>
            📊 <strong>Estado visual:</strong> Indicador de conexión y contador
            de mensajes
          </li>
          <li>
            🔄 <strong>Auto-scroll:</strong> Se desplaza automáticamente a
            nuevos mensajes
          </li>
          <li>
            ⌨️ <strong>Indicador de escritura:</strong> Muestra cuando alguien
            está escribiendo
          </li>
          <li>
            🚫 <strong>Estado vacío:</strong> Mensaje personalizable cuando no
            hay mensajes
          </li>
          <li>
            📱 <strong>Responsive:</strong> Se adapta a diferentes tamaños de
            pantalla
          </li>
          <li>
            🎨 <strong>Personalizable:</strong> Altura, mensajes vacíos y
            comportamiento configurable
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ChatHistoryExample;
