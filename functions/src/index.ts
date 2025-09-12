/**
 * Instrucciones para geminiResponse (resumen con Gemini API)
 *
 * 1. Instala dependencias:
 *    npm install @google/genai
 *
 * 2. Configura el secreto de la API Key:
 *    firebase functions:secrets:set GEMINI_API_KEY
 *
 * 3. Compila el código:
 *    npm run build
 *
 * 4. Prueba localmente con el emulador:
 *    firebase emulators:start --only functions
 *
 * 5. Haz un POST a la función:
 *    Invoke-WebRequest -Uri "GEMINI_ENDPOINT"
 *    -Method POST
 *    -Headers @{"Content-Type"="application/json"}
 *    -Body '{"text": "Tu texto aquí"}'
 *    -OutFile "respuesta_gemini.json" (en caso de que se saque así)
 * 6. Despliega a la nube:
 *    firebase deploy --only functions
 *
 * 7. Prueba en la nube usando la URL pública que te da Firebase.
 *
 * 8. Ejemplo de uso desde cualquier lugar (PowerShell):
 *    Invoke-WebRequest -Uri "GEMINI_ENDPOINT" \
 *      -Method POST \
 *      -Headers @{"Content-Type"="application/json"} \
 *      -Body '{"text": "Tu texto aquí"}' \
 *      -OutFile "respuesta_gemini_nube.json"
 *    # Luego puedes ver la respuesta con:
 *    Get-Content .\respuesta_gemini_nube.json
 *
 *
 */
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions';
import cors from 'cors';
import { onRequest } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const corsHandler = cors({ origin: true });

// Función principal con CORS habilitado para desarrollo y producción
export const geminiResponse = onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1', timeoutSeconds: 120 },
  async (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido. Usa POST.' });
        return;
      }
      // Log del body recibido
      console.log('Body recibido:', req.body);
      const { text } = req.body;
      if (!text) {
        res.status(400).json({ error: "Falta el campo 'text' en el body." });
        return;
      }
      try {
        const ai = new GoogleGenAI({});

        // Detectar si es un prompt de extracción de temas (contiene Base64 o palabras clave)
        const isTopicExtraction =
          text.includes('TAREA: Analiza el programa') ||
          text.includes('FORMATO DE RESPUESTA (JSON)') ||
          text.includes('Base64');

        let prompt;
        if (isTopicExtraction) {
          // Limitar el tamaño del prompt para evitar errores de tokens
          prompt = text.substring(0, 8000);
          console.log('Procesando extracción de temas del PDF');
        } else {
          // Para resúmenes normales, usar el formato original
          prompt = `Resume el siguiente texto en español: ${text.substring(0, 8000)}`;
          console.log('Procesando resumen normal');
        }

        console.log(
          'Enviando a Gemini (primeros 200 chars):',
          prompt.substring(0, 200),
        );
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
          });
          console.log('Respuesta cruda de Gemini:', response);

          // Devolver en formato compatible
          if (isTopicExtraction) {
            res.json({ raw_response: response.text, source: 'gemini' });
          } else {
            res.json({ summary: response.text, source: 'gemini' });
          }
        } catch (geminiError) {
          console.error('Error al llamar a Gemini:', geminiError);
          res.status(500).json({
            error: 'Error al llamar a Gemini',
            details:
              geminiError instanceof Error ? geminiError.message : geminiError,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error interno';
        console.error('Error en geminiResponse (bloque externo):', error);
        res.status(500).json({ error: message });
      }
    });
  },
);

// Función de prueba mantenida para compatibilidad
export const geminiResponseTest = functions.https.onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1' },
  async (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido. Usa POST.' });
        return;
      }
      // Log del body recibido
      console.log('Body recibido (test):', req.body);
      const { text } = req.body;
      if (!text) {
        res.status(400).json({ error: "Falta el campo 'text' en el body." });
        return;
      }
      try {
        const ai = new GoogleGenAI({});
        // Prompt fijo para extraer temas, fechas y resumen
        const prompt = `Analiza el siguiente texto extraído de un cronograma académico o material de clase. Devuélveme:\n1. Una lista de los temas importantes que se mencionan.\n2. Una lista de fechas relevantes (con su evento o tema asociado).\n3. Un resumen general de lo que se habla en el texto.\nResponde en español, en formato claro y estructurado. Texto a analizar:\n${text}`;
        console.log('Enviando a Gemini (test):', prompt);
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        });
        console.log('Respuesta cruda de Gemini (test):', response);
        res.json({ summary: response.text, source: 'gemini' });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error interno';
        console.error('Error en geminiResponseTest:', error);
        res.status(500).json({ error: message });
      }
    });
  },
);
