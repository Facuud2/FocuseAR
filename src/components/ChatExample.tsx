import React, { useState } from 'react';
import ChatMessage from './ChatMessage';

// Ejemplo de uso del componente ChatMessage
const ChatExample: React.FC = () => {
  const [messages] = useState([
    {
      id: 1,
      message: "¡Hola! ¿En qué puedo ayudarte hoy?",
      isUser: false,
      timestamp: new Date(Date.now() - 300000), // 5 minutos atrás
      userName: "Asistente",
      messageType: 'text' as const
    },
    {
      id: 2,
      message: "Necesito ayuda con mi asignatura de matemáticas",
      isUser: true,
      timestamp: new Date(Date.now() - 240000), // 4 minutos atrás
    },
    {
      id: 3,
      message: "Usuario se unió al chat",
      isUser: false,
      timestamp: new Date(Date.now() - 180000), // 3 minutos atrás
      messageType: 'system' as const
    },
    {
      id: 4,
      message: "Perfecto, puedo ayudarte con matemáticas. ¿Qué tema específico te interesa?",
      isUser: false,
      timestamp: new Date(Date.now() - 120000), // 2 minutos atrás
      userName: "Asistente",
    },
    {
      id: 5,
      message: "Estoy teniendo problemas con las ecuaciones cuadráticas",
      isUser: true,
      timestamp: new Date(Date.now() - 60000), // 1 minuto atrás
    }
  ]);

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
        Ejemplo de Chat
      </h2>
      
      <div className="h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.message}
            isUser={msg.isUser}
            timestamp={msg.timestamp}
            userName={msg.userName}
            messageType={msg.messageType}
            avatar={msg.isUser ? 
              "https://via.placeholder.com/32/3B82F6/FFFFFF?text=U" : 
              "https://via.placeholder.com/32/10B981/FFFFFF?text=A"
            }
          />
        ))}
        
        {/* Ejemplo de mensaje cargando */}
        <ChatMessage
          message=""
          isUser={false}
          userName="Asistente"
          isLoading={true}
          avatar="https://via.placeholder.com/32/10B981/FFFFFF?text=A"
        />
      </div>
      
      <div className="mt-4 p-3 bg-gray-100 rounded-lg">
        <h3 className="font-semibold text-sm text-gray-700 mb-2">Características del componente:</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Burbujas de chat diferenciadas por usuario</li>
          <li>• Timestamps formateados</li>
          <li>• Avatares opcionales</li>
          <li>• Mensajes del sistema</li>
          <li>• Indicador de carga</li>
          <li>• Responsive y accesible</li>
        </ul>
      </div>
    </div>
  );
};

export default ChatExample;