import { onRequest } from 'firebase-functions/https';
import { GEMINI_API_KEY, initializeGeminiAI } from '../../config/gemini';
import {
  corsHandler,
  addCorsHeaders,
  handleOptionsRequest,
} from '../../utils/cors';
import { db } from '../../firebaseAdmin';
import crypto from 'crypto';

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

      // Normalizar y limitar la pregunta para cache y prompt
      // - quitar acentos/diacríticos
      // - pasar a minúsculas
      // - eliminar puntuación
      // - colapsar espacios
      function normalizeQuestion(str: string): string {
        const s = String(str || '')
          // NFD then remove diacritics
          .normalize('NFD');
        // More robust removal of diacritics
        const base = s.normalize('NFD');
        const noDiacritics = base.replace(/[\u0300-\u036f]/g, '');
        return noDiacritics
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 500);
      }

      const normalizedQuestion = normalizeQuestion(question);
      const normalizedMaterial = normalizeQuestion(String(material || ''));
      const normalizedTopic = normalizeQuestion(String(topic || ''));

      // Generar llave de caché usando values normalizados
      const cacheKey = crypto
        .createHash('sha256')
        .update(
          `${userId}|${normalizedMaterial || ''}|${normalizedTopic || ''}|${normalizedQuestion}`,
        )
        .digest('hex');

      const cacheRef = db.collection('ai_cache').doc(cacheKey);

      // Revisar caché antes de llamar a Gemini
      try {
        const cacheSnap = await cacheRef.get();
        if (cacheSnap.exists) {
          const cached = cacheSnap.data();
          console.log('Cache hit for askGeminiBot:', cacheKey);
          res.json({
            response: cached?.answer || cached?.response || '',
            context: { material: material || null, topic: topic || null },
            source: 'gemini-bot-cache',
            cachedAt: cached?.cachedAt || null,
          });
          return;
        }
      } catch (cacheErr) {
        console.warn('Error leyendo cache de askGeminiBot:', cacheErr);
        // Continuar sin cache si falla
      }

      try {
        // Prompt conciso: pedir respuesta breve (1-4 frases) y sin formato
        const prompt = `Eres un asistente educativo. Responde de forma clara y breve (máx. 1-4 frases), usando lenguaje sencillo. No uses títulos, listas ni Markdown. Si no sabes la respuesta, dilo de forma honesta.
Contexto de la materia: ${String(material || '').substring(0, 400)}
Tema: ${String(topic || '').substring(0, 200)}
Pregunta: ${String(question).substring(0, 500)}`;

        console.log(
          'Consultando a Gemini Bot con prompt:',
          prompt.substring(0, 200) + '...',
        );

        const response = await callGeminiWithRetry(prompt);

        // Normalizar texto de respuesta
        const textResp =
          response && response.text ? String(response.text).trim() : '';

        // Guardar en cache (intentar, pero no bloquear la respuesta si falla)
        try {
          await cacheRef.set({
            userId,
            material: material || null,
            topic: topic || null,
            question,
            normalizedQuestion,
            answer: textResp,
            cachedAt: new Date().toISOString(),
          });
        } catch (setErr) {
          console.warn('No se pudo guardar cache en askGeminiBot:', setErr);
        }

        res.json({
          response: textResp,
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
