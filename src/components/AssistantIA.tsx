// src/components/AssistantIA.tsx

import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import './Dashboard.css';
import { Send, Sparkles } from 'lucide-react';

interface Message {
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

// Simulamos la llamada a una Cloud Function de forma asíncrona.
const askChatbot = async (query: string): Promise<string> => {
  console.log(`Calling mock Cloud Function with query: "${query}"`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        '¡Hola! Soy tu asistente de estudio. Puedes preguntarme sobre tus documentos, planes de estudio o cualquier tema que necesites reforzar.',
      );
    }, 2000);
  });
};

const AssistantIA: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = {
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const assistantResponse = await askChatbot(input);
      const assistantMessage: Message = {
        text: assistantResponse,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage: Message = {
        text: 'Lo siento, algo salió mal. Por favor, inténtalo de nuevo.',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="assistant-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat-state">
            <Sparkles size={48} className="sparkle-icon" />
            <p>Hola, ¿en qué puedo ayudarte?</p>
            <p>Escribe tu pregunta para empezar.</p>
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`message-bubble ${message.sender}`}>
            <p>{message.text}</p>
            <span className="timestamp">{message.timestamp}</span>
          </div>
        ))}
        {isLoading && (
          <div className="loading-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} className="send-btn">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default AssistantIA;
