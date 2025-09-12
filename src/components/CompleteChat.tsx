import React, { useState, useCallback } from 'react';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';

// Tipo para los mensajes del chat completo
interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
  userName?: string;
  messageType?: 'text' | 'system' | 'error';
  isLoading?: boolean;
}

interface CompleteChatProps {
  title?: string;
  height?: string;
  welcomeMessage?: string;
  assistantName?: string;
  simulateTyping?: boolean;
}

const CompleteChat: React.FC<CompleteChatProps> = ({
  title = "💬 Chat Completo",
  height = "600px",
  welcomeMessage = "¡Hola! Soy tu asistente de planificación de estudios. ¿En qué puedo ayudarte?",
  assistantName = "Asistente IA",
  simulateTyping = true
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      message: welcomeMessage,
      isUser: false,
      timestamp: new Date(),
      userName: assistantName,
      messageType: 'text'
    }
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Función para agregar un mensaje
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Función para simular respuesta del asistente
  const simulateAssistantResponse = useCallback((userMessage: string) => {
    if (!simulateTyping) return;

    // Mostrar indicador de escritura
    setIsTyping(true);

    // Simular tiempo de respuesta
    setTimeout(() => {
      setIsTyping(false);
      
      // Generar respuesta basada en el mensaje del usuario
      let response = '';
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes('ayuda') || lowerMessage.includes('ayudar')) {
        response = "¡Por supuesto! Puedo ayudarte con la planificación de estudios, crear horarios personalizados y darte consejos para mejorar tu rendimiento académico. ¿Qué necesitas específicamente?";
      } else if (lowerMessage.includes('matematicas') || lowerMessage.includes('matemáticas')) {
        response = "Matemáticas es una materia que requiere práctica constante. Te recomiendo estudiar 30 minutos diarios, resolver ejercicios variados y revisar conceptos básicos regularmente. ¿En qué tema específico necesitas ayuda?";
      } else if (lowerMessage.includes('examen') || lowerMessage.includes('examenes')) {
        response = "Para prepararte para exámenes, te sugiero: 1) Crear un cronograma de estudio, 2) Hacer resúmenes y mapas conceptuales, 3) Practicar con exámenes anteriores, 4) Estudiar en grupos. ¿Cuándo es tu próximo examen?";
      } else if (lowerMessage.includes('tiempo') || lowerMessage.includes('horario')) {
        response = "La gestión del tiempo es clave para el éxito académico. Te ayudo a crear un horario equilibrado que incluya tiempo de estudio, descanso y actividades personales. ¿Cuántas horas al día puedes dedicar al estudio?";
      } else if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('buenas')) {
        response = "¡Hola! Me alegra verte por aquí. Estoy aquí para ayudarte a optimizar tu tiempo de estudio y crear planes personalizados. ¿Qué materias estás cursando actualmente?";
      } else {
        response = `Entiendo tu consulta sobre "${userMessage}". Como asistente de planificación, puedo ayudarte a organizar mejor tus estudios. ¿Te gustaría que creemos un plan de estudio personalizado?`;
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        message: response,
        isUser: false,
        timestamp: new Date(),
        userName: assistantName,
        messageType: 'text'
      };

      addMessage(assistantMessage);
    }, 1500 + Math.random() * 1000); // Tiempo aleatorio entre 1.5-2.5 segundos
  }, [simulateTyping, assistantName, addMessage]);

  // Manejar envío de mensaje
  const handleSendMessage = useCallback((messageText: string) => {
    setIsLoading(true);

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      message: messageText,
      isUser: true,
      timestamp: new Date(),
      messageType: 'text'
    };

    addMessage(userMessage);

    // Simular proceso de envío
    setTimeout(() => {
      setIsLoading(false);
      simulateAssistantResponse(messageText);
    }, 500);
  }, [addMessage, simulateAssistantResponse]);

  // Función para limpiar chat
  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-new',
        message: welcomeMessage,
        isUser: false,
        timestamp: new Date(),
        userName: assistantName,
        messageType: 'text'
      }
    ]);
    setIsTyping(false);
    setIsLoading(false);
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      
      {/* Header del chat */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#3B82F6',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600'
          }}>
            {title}
          </h2>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '14px',
            opacity: 0.9
          }}>
            Tu asistente personal de estudios
          </p>
        </div>
        
        <button
          onClick={clearChat}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          🗑️ Limpiar
        </button>
      </div>

      {/* Contenedor principal */}
      <div style={{
        height: height,
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Historial de mensajes */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <ChatHistory
            messages={messages}
            height="100%"
            autoScroll={true}
            showTypingIndicator={isTyping}
            emptyStateMessage="¡Empieza la conversación! Pregúntame sobre planificación de estudios."
          />
        </div>

        {/* Formulario de envío */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB'
        }}>
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={false}
            placeholder="Pregúntame sobre planificación de estudios..."
            maxLength={500}
            showCharCount={true}
            allowMultiline={true}
            isLoading={isLoading}
            autoFocus={true}
          />
        </div>
      </div>

      {/* Footer con información */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#F3F4F6',
        fontSize: '11px',
        color: '#6B7280',
        textAlign: 'center',
        borderTop: '1px solid #E5E7EB'
      }}>
        💡 Este es un chat de demostración que simula respuestas automáticas
      </div>
    </div>
  );
};

export default CompleteChat;