// AssistantIA.tsx
import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import './Dashboard.css'; // Import the main CSS for styling

// Define a type for chat messages
interface Message {
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

// Dummy Cloud Function call service
const askChatbot = async (query: string): Promise<string> => {
  console.log(`Calling mock Cloud Function with query: "${query}"`);
  // Simulate API call delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        'This is a mock AI response to your question about the document. The actual functionality would be handled by a Cloud Function.',
      );
    }, 2000); // 2-second delay
  });
};

const AssistantIA: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (input.trim() === '') return;

    // 1. Add user's message to the state
    const userMessage: Message = {
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Call the mock AI service
      const assistantResponse = await askChatbot(input);

      // 3. Add the assistant's response to the state
      const assistantMessage: Message = {
        text: assistantResponse,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage: Message = {
        text: 'Sorry, something went wrong. Please try again.',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      // 4. Remove loading indicator
      setIsLoading(false);
    }
  };

  return (
    <div className="assistant-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat-state">
            <p>👋 Hola! Estoy listo para ayudarte a estudiar.</p>
            <p>Pregunta sobre tu documento y te responderé.</p>
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
        <button type="submit" disabled={isLoading}>
          Enviar
        </button>
      </form>
    </div>
  );
};

export default AssistantIA;
