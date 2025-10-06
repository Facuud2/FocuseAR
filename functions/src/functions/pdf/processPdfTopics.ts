import { onRequest } from 'firebase-functions/https';
import { GEMINI_API_KEY, initializeGeminiAI } from '../../config/gemini';
import {
  corsHandler,
  addCorsHeaders,
  handleOptionsRequest,
} from '../../utils/cors';
import { validateRequiredFields } from '../../utils/validation';

export const processPdfTopics = onRequest(
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

      const { text, subjectName } = req.body || {};

      // Validación usando helper
      const validationError = validateRequiredFields(req.body, [
        'text',
        'subjectName',
      ]);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      try {
        const prompt = `Eres un asistente que extrae los temas principales de un programa de materia. Devuelve un JSON con la forma: {"topics":[{"id":"tema_1","name":"Tema 1","order":1}], "summary":"Resumen breve"}.\nMateria: ${subjectName}\nTexto:\n${String(text).substring(0, 8000)}`;

        console.log(`Procesando temas del PDF para materia: ${subjectName}`);

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

        let textResp = response.text || '';
        textResp = textResp
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();

        try {
          const parsed = JSON.parse(textResp);
          console.log(
            `✅ Temas extraídos exitosamente: ${parsed.topics?.length || 0} temas`,
          );
          res.json({ parsed, source: 'gemini' });
        } catch {
          console.warn('⚠️ No se pudo parsear JSON, devolviendo respuesta raw');
          res.json({ raw_response: textResp, source: 'gemini' });
        }
      } catch (error: unknown) {
        console.error('❌ Error procesando PDF:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
          error: 'Error al procesar el PDF con Gemini',
          details: errorMessage,
        });
      }
    });
  },
);
