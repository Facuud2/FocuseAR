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
import { db } from './firebaseAdmin';
import crypto from 'crypto';

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const corsHandler = cors({ origin: true });

// Helper para añadir cabeceras CORS explícitas (útil para Cloud Run / Gen2)
function addCorsHeaders(res: {
  setHeader: (name: string, value: string) => void;
}) {
  // Ajusta el origen según tu entorno de producción
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/* ELIMINAR MÁS ADELANTE
// Función principal con CORS habilitado para desarrollo y producción
export const geminiResponse = onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1', timeoutSeconds: 120 },
  async (req, res) => {
    // Responder preflight OPTIONS rápidamente
    if (req.method === 'OPTIONS') {
      addCorsHeaders(res);
      res.status(204).send('');
      return;
    }

    corsHandler(req, res, async () => {
      addCorsHeaders(res);
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
*/
// Función de prueba mantenida para compatibilidad
export const geminiResponseTest = functions.https.onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1' },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      addCorsHeaders(res);
      res.status(204).send('');
      return;
    }

    corsHandler(req, res, async () => {
      addCorsHeaders(res);
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

// -----------------------------
// Función: Preguntas sobre materias de estudio
// Recibe: { userId, material, topic, question }
// Responde: { answer: string, source: 'cache'|'gemini', cachedAt?: string } o { error: string }
// -----------------------------

export const askGeminiBot = onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1', timeoutSeconds: 120 },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      addCorsHeaders(res);
      res.status(204).send('');
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
            const ai = new GoogleGenAI({});
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
          }
        }
        throw lastError;
      }
      if (!userId || !material || !topic || !question) {
        res.status(400).json({
          error: 'Faltan campos requeridos: userId, material, topic, question.',
        });
        return;
      }
      try {
        // Normalización básica de la pregunta
        function normalize(str: string): string {
          return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // quitar tildes
            .replace(/[^a-z0-9áéíóúüñ\s]/gi, '') // quitar signos
            .replace(/\s+/g, ' ') // espacios múltiples a uno
            .trim();
        }
        const normalizedQuestion = normalize(question);
        // Crear un hash único para la combinación de pregunta normalizada
        const cacheKey = crypto
          .createHash('sha256')
          .update(`${userId}|${material}|${topic}|${normalizedQuestion}`)
          .digest('hex');
        const cacheRef = db.collection('ai_cache').doc(cacheKey);
        // Buscar en caché
        const cacheSnap = await cacheRef.get();
        if (cacheSnap.exists) {
          const cached = cacheSnap.data();
          if (cached) {
            res.json({
              answer: cached.answer,
              source: 'cache',
              cachedAt: cached.cachedAt,
            });
            return;
          }
        }
        // Si no hay caché, llamar a Gemini
        const prompt = `Responde de forma breve, clara y sencilla, como si explicaras a un estudiante universitario. No uses formato Markdown, títulos, ni listas largas. Limítate a 3-4 frases simples. Si no sabes la respuesta, dilo de forma amable.
        Materia: ${material}
        Tema: ${topic}
        Pregunta: ${question}`;
        const response = await callGeminiWithRetry(prompt, 3, 1000);
        // Guardar en caché
        await cacheRef.set({
          userId,
          material,
          topic,
          question,
          normalizedQuestion,
          answer: response.text,
          cachedAt: new Date().toISOString(),
        });
        res.json({ answer: response.text, source: 'gemini' });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error interno';
        console.error('Error en askGemini:', error);
        res.status(500).json({ error: message });
      }
    });
  },
);

// -----------------------------
// Función: Procesar PDF y extraer temas
// Recibe: { text: string, subjectName: string }
// Responde: { parsed: {...} } o { raw_response: string }
// -----------------------------
export const processPdfTopics = onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1', timeoutSeconds: 120 },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      addCorsHeaders(res);
      res.status(204).send('');
      return;
    }

    corsHandler(req, res, async () => {
      addCorsHeaders(res);
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido. Usa POST.' });
        return;
      }

      const { text, subjectName } = req.body || {};
      if (!text || !subjectName) {
        res
          .status(400)
          .json({ error: "Faltan campos: 'text' o 'subjectName'" });
        return;
      }

      try {
        const prompt = `Eres un asistente que extrae los temas principales de un programa de materia. Devuelve un JSON con la forma: {"topics":[{"id":"tema_1","name":"Tema 1","order":1}], "summary":"Resumen breve"}.\nMateria: ${subjectName}\nTexto:\n${String(text).substring(0, 8000)}`;
        const ai = new GoogleGenAI({});
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
          res.json({ parsed, source: 'gemini' });
        } catch {
          res.json({ raw_response: textResp, source: 'gemini' });
        }
      } catch (error) {
        console.error('Error en processPdfTopics:', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Error interno',
        });
      }
    });
  },
);

// -----------------------------
// Función: Generar Plan de estudios
// Recibe: { subjectName, eventName, examDate, topics: string[], studyDates: string[], weekDays?: number[] }
// Responde: { plan: {...} } o { raw_response: string }
// -----------------------------
export const generateStudyPlan = onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1', timeoutSeconds: 300 },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      addCorsHeaders(res);
      res.status(204).send('');
      return;
    }

    corsHandler(req, res, async () => {
      addCorsHeaders(res);
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido. Usa POST.' });
        return;
      }

      const { subjectName, eventName, examDate, topics, studyDates, weekDays } =
        req.body || {};
      if (
        !subjectName ||
        !topics ||
        !Array.isArray(topics) ||
        !studyDates ||
        !Array.isArray(studyDates)
      ) {
        res.status(400).json({
          error: "Campos requeridos: 'subjectName', 'topics[]', 'studyDates[]'",
        });
        return;
      }

      try {
        const weekDayNames = [
          'domingo',
          'lunes',
          'martes',
          'miércoles',
          'jueves',
          'viernes',
          'sábado',
        ];
        const prompt = `Eres un asistente especializado en crear planes de estudio personalizados.

DATOS:
- Materia: ${subjectName}
- Evento: ${eventName || 'No especificado'}
- Fecha del examen: ${examDate || 'No especificada'}
- Días disponibles (${studyDates.length}): ${studyDates.join(', ')}
- Días de la semana: ${weekDays && Array.isArray(weekDays) ? weekDays.map((d: number) => weekDayNames[d]).join(', ') : 'No especificado'}

TEMAS:
${topics.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}

INSTRUCCIONES (optimiza, usa días y permite descansos):
1) Distribuye TODOS los temas entre las fechas disponibles, intentando usar la mayor cantidad de días posible. Si existen la capacidad de dias suficientes para los temas, podes dejar dias libres en según creas conveniente (estos se deberán dejar sin marcar la fecha y no se deberán incluir en el objeto).
2) No incluyas días con solo recomendaciones en el array 'days' - si un día no tiene topics asignados, omítelo.
3) Optimiza la carga diaria: prioriza distribuir sesiones cortas para reducir fatiga y equilibrar el tiempo entre días.
4) Para cada día, devuelve un objeto con:
  - date: 'YYYY-MM-DD'
  - dayNumber: número (1 = primer día del plan)
  - topics: lista de objetos { name, summary, estimatedTime } donde:
     - summary: máximo 1 frase, máximo 20 palabras
     - estimatedTime: tiempo estimado EN HORAS (puede ser decimal con 1 cifra, p.ej. 1.5) — NO en minutos
  - totalTime: suma de estimatedTime del día (EN HORAS, decimal posible)
  - recommendations: texto breve, máximo 3 frases
  - completed: false
4) Además incluye:
  - title: título corto del plan
  - summary: resumen general (1-2 frases)
  - finalRecommendations: recomendaciones finales (máx. 3 frases)

RESTRICCIONES CLARAS:
- Resumen por topic: 1 frase, <=20 palabras.
- Recommendations: máximo 3 frases.
- estimatedTime y totalTime deben expresarse en HORAS (no en minutos).
- Maximiza el uso de los días disponibles y minimiza la carga por día cuando sea posible.

SALIDA:
- Devuelve SOLO un JSON válido con ESTA ESTRUCTURA EXACTA:
{"title":"...","summary":"...","days":[{"date":"YYYY-MM-DD","dayNumber":1,"topics":[{"name":"","summary":"","estimatedTime":1.5}],"totalTime":2.0,"recommendations":"","completed":false}],"finalRecommendations":"..."}

- No agregues texto fuera del JSON, ni explicaciones, ni etiquetas de código ni listas adicionales.

Genera el JSON ahora.`;

        const ai = new GoogleGenAI({});
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
          res.json({ plan: parsed, source: 'gemini' });
        } catch {
          res.json({ raw_response: textResp, source: 'gemini' });
        }
      } catch (error) {
        console.error('Error en generateStudyPlan:', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Error interno',
        });
      }
    });
  },
);

// -----------------------------
// Función: generateStudyContent
// Recibe: { topic: string, subject: string, level?: string, contentType?: string }
// Responde: { content: {...} } o { raw_response: string }
// -----------------------------
export const generateStudyContent = onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1', timeoutSeconds: 180 },
  async (req, res) => {
    // Responder preflight OPTIONS rápidamente
    if (req.method === 'OPTIONS') {
      addCorsHeaders(res);
      res.status(204).send('');
      return;
    }

    corsHandler(req, res, async () => {
      addCorsHeaders(res);
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido. Usa POST.' });
        return;
      }

      const { topic, subject, level = 'universitario' } = req.body || {};
      if (!topic || !subject) {
        res.status(400).json({
          error: "Campos requeridos: 'topic' y 'subject'",
        });
        return;
      }

      try {
        const prompt = `Eres un profesor experto en ${subject}. 
Genera contenido educativo completo para el tema: "${topic}"
Nivel educativo: ${level}

INSTRUCCIONES:
1. Crea contenido estructurado y educativo de alta calidad
2. Adapta el lenguaje al nivel ${level}
3. Incluye ejemplos prácticos cuando sea relevante
4. Mantén un enfoque pedagógico claro

CONTENIDO A GENERAR:
1. Resumen: Explicación concisa del tema (150-250 palabras)
2. Conceptos Clave: 5-7 conceptos fundamentales con definiciones breves
3. Flashcards: 8-10 pares pregunta/respuesta para memorización
4. Preguntas de Práctica: 4-5 preguntas de aplicación con respuestas
5. Conexiones: Relación con otros temas de la materia
6. Consejos de Estudio: Recomendaciones específicas para dominar este tema
7. No tiene que tener contenido con formato markdown, títulos, ni listas largas.
8. practiceQuestions no debe tener más de 60 palabras por respuesta.

FORMATO DE SALIDA:
Devuelve SOLO un JSON válido con esta estructura exacta:
{
  "topic": "${topic}",
  "subject": "${subject}",
  "level": "${level}",
  "summary": "...",
  "keyConcepts": [
    {"concept": "...", "definition": "..."}
  ],
  "flashcards": [
    {"question": "...", "answer": "...", "difficulty": "easy|medium|hard"}
  ],
  "practiceQuestions": [
    {"question": "...", "answer": "...", "type": "application|analysis|synthesis"}
  ],
  "connections": [
    {"relatedTopic": "...", "relationship": "..."}
  ],
  "studyTips": [
    "..."
  ],
  "estimatedStudyTime": "X horas"
}

No agregues texto fuera del JSON, ni explicaciones adicionales, ni etiquetas de código.

Genera el contenido educativo ahora:`;

        const ai = new GoogleGenAI({});
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
          res.json({ content: parsed, source: 'gemini' });
        } catch (parseError) {
          console.log(
            'Error parsing JSON, returning raw response:',
            parseError,
          );
          res.json({ raw_response: textResp, source: 'gemini' });
        }
      } catch (error) {
        console.error('Error en generateStudyContent:', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Error interno',
        });
      }
    });
  },
);
