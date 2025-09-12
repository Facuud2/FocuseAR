import React, { useState } from 'react';
import ChatMessage from './ChatMessage';

// Ejemplo de uso del componente ChatMessage
const ChatExample: React.FC = () => {
  const [messages] = useState([
    {
      id: 1,
      message: '¡Hola! ¿En qué puedo ayudarte hoy?',
      isUser: false,
      timestamp: new Date(Date.now() - 300000), // 5 minutos atrás
      userName: 'Asistente',
      messageType: 'text' as const,
    },
    {
      id: 2,
      message: 'Necesito ayuda con mi asignatura de matemáticas',
      isUser: true,
      timestamp: new Date(Date.now() - 240000), // 4 minutos atrás
    },
    {
      id: 3,
      message:
        'Perfecto, puedo ayudarte con matemáticas. ¿Qué tema específico te interesa?',
      isUser: false,
      timestamp: new Date(Date.now() - 120000), // 2 minutos atrás
      userName: 'Asistente',
    },
    {
      id: 4,
      message: 'Estoy teniendo problemas con las ecuaciones cuadráticas',
      isUser: true,
      timestamp: new Date(Date.now() - 60000), // 1 minuto atrás
    },
  ]);

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '20px',
          textAlign: 'center',
          color: '#374151',
        }}
      >
        💬 Ejemplo de Chat
      </h2>

      <div
        style={{
          height: '300px',
          overflowY: 'auto',
          padding: '15px',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
        }}
      >
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.message}
            isUser={msg.isUser}
            timestamp={msg.timestamp}
            userName={msg.userName}
            messageType={msg.messageType}
          />
        ))}

        {/* Ejemplo de mensaje cargando */}
        <ChatMessage
          message=""
          isUser={false}
          userName="Asistente"
          isLoading={true}
        />
      </div>

      <div
        style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#F3F4F6',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#6B7280',
        }}
      >
        <strong>✨ Características del componente:</strong>
        <br />• Burbujas diferenciadas por usuario
        <br />• Timestamps y estados de carga
        <br />• Diseño responsive y moderno
      </div>
    </div>
  );
};

export default ChatExample;
