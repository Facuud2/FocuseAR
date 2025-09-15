import { askGeminiBot } from '../services/aiChatService';
import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserMaterialsAndTopics } from '../services/chatbotService';
import type { ChatbotMaterial } from '../services/chatbotService';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import './Chatbot.css';

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
}

const CompleteChat: React.FC<CompleteChatProps & { onClose?: () => void }> = ({
  title = '💬 Chat de Planificación',
  height = '420px',
  welcomeMessage = '¿Sobre qué materia quieres consultar?',
  assistantName = 'Asistente IA',
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [materials, setMaterials] = useState<ChatbotMaterial[]>([]);
  const [step, setStep] = useState<'materia' | 'topic' | 'done'>('materia');
  const [selectedMaterialIdx, setSelectedMaterialIdx] = useState<number | null>(
    null,
  );
  const { user } = useAuth();

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!user) return;
      const mats = await getUserMaterialsAndTopics(user.uid);
      setMaterials(mats);
      let menu = '';
      mats.forEach((mat, idx) => {
        let nombre =
          mat.materialName && mat.materialName.trim() !== ''
            ? mat.materialName
            : `Materia ${idx + 1}`;
        nombre = nombre
          .replace(/^Plan de Estudio\s*-\s*/i, '')
          .replace(/\s*-\s*Primer Parcial$/i, '')
          .trim();
        menu += `${idx + 1}. ${nombre}\n`;
      });
      setMessages([
        {
          id: 'menu',
          message: welcomeMessage + '\n' + menu,
          isUser: false,
          timestamp: new Date(),
          userName: assistantName,
          messageType: 'text',
        },
      ]);
    };
    fetchMaterials();
  }, [user]);

  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      setIsLoading(true);
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        message: messageText,
        isUser: true,
        timestamp: new Date(),
        messageType: 'text',
      };
      addMessage(userMessage);

      setIsTyping(true);
      if (step === 'materia') {
        const idx = parseInt(messageText.trim(), 10) - 1;
        if (!isNaN(idx) && materials[idx]) {
          setSelectedMaterialIdx(idx);
          setStep('topic');
          const mat = materials[idx];
          let nombre =
            mat.materialName && mat.materialName.trim() !== ''
              ? mat.materialName
              : `Materia ${idx + 1}`;
          nombre = nombre
            .replace(/^Plan de Estudio\s*-\s*/i, '')
            .replace(/\s*-\s*Primer Parcial$/i, '')
            .trim();
          const topics = mat.topics;
          let menu = `Has seleccionado: ${nombre}\nEstos son los temas disponibles:\n`;
          topics.forEach((topic, i) => {
            menu += `${i + 1}. ${topic}\n`;
          });
          setTimeout(() => {
            addMessage({
              id: `topics-menu-${Date.now()}`,
              message: menu,
              isUser: false,
              timestamp: new Date(),
              userName: assistantName,
              messageType: 'text',
            });
            setIsTyping(false);
            setIsLoading(false);
          }, 1500);
        } else {
          const menu = materials
            .map((mat, idx) => {
              let nombre =
                mat.materialName && mat.materialName.trim() !== ''
                  ? mat.materialName
                  : `Materia ${idx + 1}`;
              nombre = nombre
                .replace(/^Plan de Estudio\s*-\s*/i, '')
                .replace(/\s*-\s*Primer Parcial$/i, '')
                .trim();
              return `${idx + 1}. ${nombre}\n`;
            })
            .join('');
          setTimeout(() => {
            addMessage({
              id: `materia-error-${Date.now()}`,
              message: `Por favor, elige una materia válida usando el número correspondiente.\n\n${menu}`,
              isUser: false,
              timestamp: new Date(),
              userName: assistantName,
              messageType: 'text',
            });
            setIsTyping(false);
            setIsLoading(false);
          }, 1500);
        }
        return;
      } else if (step === 'topic' && selectedMaterialIdx !== null) {
        const topics = materials[selectedMaterialIdx].topics;
        const idx = parseInt(messageText.trim(), 10) - 1;
        if (!isNaN(idx) && topics[idx]) {
          setStep('done');
          setTimeout(() => {
            addMessage({
              id: `topic-selected-${Date.now()}`,
              message: `Has seleccionado el tema: ${topics[idx]}\nAhora puedes escribir tu pregunta sobre este tema.`,
              isUser: false,
              timestamp: new Date(),
              userName: assistantName,
              messageType: 'text',
            });
            setIsTyping(false);
            setIsLoading(false);
          }, 1500);
        } else {
          const topicsMenu = materials[selectedMaterialIdx].topics
            .map((topic, i) => `${i + 1}. ${topic}\n`)
            .join('');
          setTimeout(() => {
            addMessage({
              id: `topic-error-${Date.now()}`,
              message: `Por favor, elige un tema válido usando el número correspondiente.\n\nTemas disponibles:\n${topicsMenu}`,
              isUser: false,
              timestamp: new Date(),
              userName: assistantName,
              messageType: 'text',
            });
            setIsTyping(false);
            setIsLoading(false);
          }, 1500);
        }
        return;
      } else if (step === 'done' && selectedMaterialIdx !== null && user) {
        const mat = materials[selectedMaterialIdx];
        const selectedTopicIdx = messages
          .slice()
          .reverse()
          .find((msg) => msg.id.startsWith('topic-selected-'))
          ?.message.match(/tema: (.+)\n/);
        let topicName = '';
        if (selectedTopicIdx && selectedTopicIdx[1]) {
          topicName = selectedTopicIdx[1];
        } else {
          topicName = mat.topics[0] || '';
        }
        try {
          const aiResponse = await askGeminiBot({
            userId: user.uid,
            material: mat.materialName,
            topic: topicName,
            question: messageText,
          });
          setTimeout(() => {
            addMessage({
              id: `ai-response-${Date.now()}`,
              message:
                aiResponse.answer +
                (aiResponse.source ? `\n\n[Fuente: ${aiResponse.source}]` : ''),
              isUser: false,
              timestamp: new Date(),
              userName: assistantName,
              messageType: 'text',
            });
            setIsTyping(false);
            setIsLoading(false);
          }, 1500);
          return;
        } catch (error) {
          let errorMsg = 'Ocurrió un error al consultar la IA: ';
          if (error && typeof error === 'object' && 'message' in error) {
            errorMsg +=
              (error as { message?: string }).message ?? 'Error desconocido';
          } else {
            errorMsg += 'Error desconocido';
          }
          addMessage({
            id: `ai-error-${Date.now()}`,
            message: errorMsg,
            isUser: false,
            timestamp: new Date(),
            userName: assistantName,
            messageType: 'error',
          });
        }
        setIsTyping(false);
        setIsLoading(false);
      } else {
        setIsTyping(false);
        setIsLoading(false);
      }
    },
    [
      addMessage,
      step,
      materials,
      assistantName,
      selectedMaterialIdx,
      user,
      messages,
    ],
  );

  const clearChat = () => {
    let menu = '';
    materials.forEach((mat, idx) => {
      let nombre =
        mat.materialName && mat.materialName.trim() !== ''
          ? mat.materialName
          : `Materia ${idx + 1}`;
      nombre = nombre
        .replace(/^Plan de Estudio\s*-\s*/i, '')
        .replace(/\s*-\s*Primer Parcial$/i, '')
        .trim();
      menu += `${idx + 1}. ${nombre}\n`;
    });
    setMessages([
      {
        id: 'menu-new',
        message: welcomeMessage + '\n' + menu,
        isUser: false,
        timestamp: new Date(),
        userName: assistantName,
        messageType: 'text',
      },
    ]);
    setStep('materia');
    setSelectedMaterialIdx(null);
    setIsTyping(false);
    setIsLoading(false);
  };

  return (
    <div className="chat-container" role="region">
      <div className="chat-header">
        <span className="chat-header-title">{title}</span>
        <div className="chat-header-actions">
          <button
            onClick={clearChat}
            className="chat-header-btn"
            title="Limpiar chat"
            aria-label="Limpiar chat"
          >
            🗑️
          </button>
          <button
            onClick={onClose}
            className="chat-header-btn close"
            title="Cerrar chat"
            aria-label="Cerrar chat"
          >
            –
          </button>
        </div>
      </div>

      <div className="chat-main" style={{ height: height }}>
        {step !== 'materia' && (
          <div className="chat-back-btn">
            <button onClick={clearChat} tabIndex={0}>
              ← Volver al inicio
            </button>
          </div>
        )}
        <ChatHistory
          messages={messages}
          height="100%"
          autoScroll={true}
          showTypingIndicator={isTyping}
          emptyStateMessage="¡Empieza la conversación! Pregúntame sobre planificación de estudios."
        />
        <div className="chat-input-container">
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

      <div className="chat-footer">
        💡 Este es un chat de demostración que simula respuestas automáticas
      </div>
    </div>
  );
};

export default CompleteChat;
