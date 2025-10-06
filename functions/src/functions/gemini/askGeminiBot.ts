import { onRequest } from 'firebase-functions/https';
import { GEMINI_API_KEY, initializeGeminiAI } from '../../config/gemini';
import {
  corsHandler,
  addCorsHeaders,
  handleOptionsRequest,
} from '../../utils/cors';

export const askGeminiBot = onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1', timeoutSeconds: 120 },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      handleOptionsRequest(res);
      return;
    }

    corsHandler(req, res, async () => {
      addCorsHeaders(res);
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido. Usa POST.' });
        return;
      }

      const { userId, material, topic, question } = req.body;

      // Función auxiliar para reintentos
      async function callGeminiWithRetry(
        prompt: string,
        maxRetries = 3,
        delayMs = 1000,
      ) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const ai = initializeGeminiAI();
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: [
                {
                  role: 'user',
                  parts: [{ text: prompt }],
                },
              ],
            });
            return response;
          } catch (error: unknown) {
            lastError = error;
            const status =
              typeof error === 'object' && error !== null && 'status' in error
                ? (error as { status?: number }).status
                : undefined;
            if (status !== 503 || attempt === maxRetries) {
              throw error;
            }
            // Esperar antes de reintentar
            await new Promise((res) => setTimeout(res, delayMs));
            console.log(
              `Reintentando después de ${delayMs}ms (intento ${attempt}/${maxRetries})...`,
            );
          }
        }
        throw lastError;
      }

      // Validación básica
      if (!userId || !question) {
        res.status(400).json({
          error: "Los campos 'userId' y 'question' son requeridos.",
        });
        return;
      }

      try {
        const prompt = `Eres un asistente educativo especializado. 
        ${material ? `Contexto de la materia: ${material}` : ''}
        ${topic ? `Tema específico: ${topic}` : ''}
        
        Pregunta del estudiante: ${question}
        
        Por favor, proporciona una respuesta clara, educativa y útil. Si es un concepto complejo, desglósalo en pasos o ejemplos.`;

        console.log(
          'Consultando a Gemini Bot con prompt:',
          prompt.substring(0, 200) + '...',
        );

        const response = await callGeminiWithRetry(prompt);

        res.json({
          response: response.text,
          context: {
            material: material || null,
            topic: topic || null,
          },
          source: 'gemini-bot',
        });
      } catch (error: unknown) {
        console.error('Error en askGeminiBot:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
          error: 'Error al procesar la consulta con Gemini',
          details: errorMessage,
        });
      }
    });
  },
);
