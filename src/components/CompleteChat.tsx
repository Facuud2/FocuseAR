import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserMaterialsAndTopics } from '../services/chatbotService';
import type { ChatbotMaterial } from '../services/chatbotService';
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
  // Al montar el componente, obtener materias y mostrar menú
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!user) return;
      const mats = await getUserMaterialsAndTopics(user.uid);
      setMaterials(mats);
      // Construir menú de materias
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Función para agregar un mensaje
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Función para simular respuesta del asistente (placeholder, se puede eliminar si se integra IA)
  const simulateAssistantResponse = useCallback(() => {}, []);

  // Manejar envío de mensaje
  const handleSendMessage = useCallback(
    (messageText: string) => {
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
      setTimeout(() => {
        setIsTyping(false);
        setIsLoading(false);
        // Conversación tipo menú
        if (step === 'materia') {
          // Buscar si el usuario eligió una materia por número
          const idx = parseInt(messageText.trim(), 10) - 1;
          if (!isNaN(idx) && materials[idx]) {
            setSelectedMaterialIdx(idx);
            setStep('topic');
            // Mostrar menú de topics
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
            addMessage({
              id: `topics-menu-${Date.now()}`,
              message: menu,
              isUser: false,
              timestamp: new Date(),
              userName: assistantName,
              messageType: 'text',
            });
          } else {
            // Reconstruir menú de materias
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
            addMessage({
              id: `materia-error-${Date.now()}`,
              message: `Por favor, elige una materia válida usando el número correspondiente.\n\n${menu}`,
              isUser: false,
              timestamp: new Date(),
              userName: assistantName,
              messageType: 'text',
            });
          }
        } else if (step === 'topic' && selectedMaterialIdx !== null) {
          // Buscar si el usuario eligió un topic por número
          const topics = materials[selectedMaterialIdx].topics;
          const idx = parseInt(messageText.trim(), 10) - 1;
          if (!isNaN(idx) && topics[idx]) {
            setStep('done');
            // Mostrar respuesta simple (puedes personalizar esto)
            addMessage({
              id: `topic-selected-${Date.now()}`,
              message: `Has seleccionado el tema: ${topics[idx]}\n¿Sobre qué aspecto de este tema quieres consultar? (Esta parte puede ser personalizada para lógica futura)`,
              isUser: false,
              timestamp: new Date(),
              userName: assistantName,
              messageType: 'text',
            });
          } else {
            // Reconstruir menú de topics
            const topicsMenu = materials[selectedMaterialIdx].topics
              .map((topic, i) => `${i + 1}. ${topic}\n`)
              .join('');
            addMessage({
              id: `topic-error-${Date.now()}`,
              message: `Por favor, elige un tema válido usando el número correspondiente.\n\nTemas disponibles:\n${topicsMenu}`,
              isUser: false,
              timestamp: new Date(),
              userName: assistantName,
              messageType: 'text',
            });
          }
        } else {
          // Lógica final o fallback
          simulateAssistantResponse();
        }
      }, 1500);
    },
    [
      addMessage,
      simulateAssistantResponse,
      step,
      materials,
      assistantName,
      selectedMaterialIdx,
    ],
  );

  // Función para limpiar chat
  const clearChat = () => {
    // Reconstruir el menú de materias igual que al abrir el chat
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
    <div
      style={{
        width: '100%',
        minWidth: 260,
        maxWidth: 400,
        margin: '0 auto',
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      aria-label="Chat de planificación de estudios"
      role="region"
    >
      {/* Header del chat */}
      <div
        style={{
          padding: '6px 12px',
          background: 'linear-gradient(90deg, #3B82F6 80%, #2563EB 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 'unset',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: 0.2 }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={clearChat}
            style={{
              backgroundColor: 'rgba(255,255,255,0.10)',
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              padding: '2px 7px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              minWidth: 'unset',
              minHeight: 'unset',
            }}
            title="Limpiar chat"
            aria-label="Limpiar chat"
          >
            🗑️
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '2px 7px',
              borderRadius: '5px',
              minWidth: 'unset',
              minHeight: 'unset',
            }}
            title="Cerrar chat"
            aria-label="Cerrar chat"
          >
            –
          </button>
        </div>
      </div>

      {/* Contenedor principal */}
      <div
        style={{
          height: height,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Botón volver al inicio */}
        {step !== 'materia' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '6px 12px 0 12px',
            }}
          >
            <button
              onClick={clearChat}
              style={{
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#2563EB',
                fontWeight: 500,
                fontSize: '13px',
                padding: '4px 12px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              tabIndex={0}
            >
              ← Volver al inicio
            </button>
          </div>
        )}
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
        <div
          style={{
            padding: '8px 10px',
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
          }}
        >
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
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#F3F4F6',
          fontSize: '11.5px',
          color: '#6B7280',
          textAlign: 'center',
          borderTop: '1px solid #E5E7EB',
          letterSpacing: 0.1,
        }}
      >
        💡 Este es un chat de demostración que simula respuestas automáticas
      </div>
    </div>
  );
};

export default CompleteChat;
