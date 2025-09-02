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
 *    Invoke-WebRequest -Uri "http://localhost:5001/tu-proyecto/us-central1/geminiResponse"
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
 *    Invoke-WebRequest -Uri "https://us-central1-proyecto-final-universitario.cloudfunctions.net/geminiResponse" \
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

import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

export const geminiResponse = onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método no permitido. Usa POST.' });
      return;
    }
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ error: "Falta el campo 'text' en el body." });
      return;
    }
    try {
      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Resume el siguiente texto en español: ${text}`,
      });
      res.json({ summary: response.text, source: 'gemini' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno';
      res.status(500).json({ error: message });
    }
  },
);
