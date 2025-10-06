//posiblemente se borre

import cors from 'cors';
import { onRequest } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';
import * as admin from 'firebase-admin';
import { db } from './firebaseAdmin';
import crypto from 'crypto';

interface RawQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const corsHandler = cors({ origin: true });

// Definición de tipos para las carpetas
interface FolderData {
  name: string;
  path: string;
  userId: string;
}

// La interfaz RenameFolderData ya no es necesaria ya que obtenemos los datos directamente del body
// y el userId del token de autenticación

// Helper para añadir cabeceras CORS explícitas (útil para Cloud Run / Gen2)
function addCorsHeaders(res: {
  setHeader: (name: string, value: string) => void;
}) {
  // Ajusta el origen según tu entorno de producción
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/*
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
*/

// Nueva función: Consulta a Gemini sobre una materia y tema específico
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
            .replace(/[̀-ͤ]/g, '') // quitar tildes
            .replace(/[^a-z0-9áéíóúüñ\s]/gi, '') // quitar signos
            .replace(/\s+/g, ' ')
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
// Función: processPdfTopics
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
// Función: generateStudyPlan
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

      const { subjectName, eventName, examDate, topics, userId } =
        req.body || {};

      // Minimal validation: client must send subjectName, topics array, userId and examDate
      if (
        !subjectName ||
        !topics ||
        !Array.isArray(topics) ||
        !userId ||
        !examDate
      ) {
        res.status(400).json({
          error:
            "Campos requeridos: 'subjectName', 'topics[]', 'userId' y 'examDate'",
        });
        return;
      }

      // Helper: compute YYYY-MM-DD strings between start and end (inclusive) matching allowed weekdays
      function computeStudyDatesBetween(
        start: Date,
        end: Date,
        allowedWeekDays: number[],
      ) {
        const dates: string[] = [];
        const cur = new Date(start);
        while (cur <= end) {
          const wd = cur.getDay();
          if (allowedWeekDays.includes(wd)) {
            dates.push(cur.toISOString().slice(0, 10));
          }
          cur.setDate(cur.getDate() + 1);
        }
        return dates;
      }

      // Read user settings - must exist and contain selectedWeekDays
      const settingsRef = db.collection('user_settings').doc(String(userId));
      const settingsSnap = await settingsRef.get();
      if (!settingsSnap.exists) {
        res.status(400).json({
          error:
            'No se encontró configuración de usuario (user_settings) para este userId.',
        });
        return;
      }
      const settings = settingsSnap.data();
      const selectedWeekDays: number[] | undefined =
        settings && Array.isArray(settings.selectedWeekDays)
          ? settings.selectedWeekDays
          : undefined;
      if (!selectedWeekDays || selectedWeekDays.length === 0) {
        res.status(400).json({
          error:
            'La configuración de usuario no contiene días de estudio (selectedWeekDays).',
        });
        return;
      }

      // Parse examDate and compute studyDates between today and exam
      const now = new Date();
      const startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const parsedExam = new Date(String(examDate));
      if (isNaN(parsedExam.getTime())) {
        res.status(400).json({ error: "'examDate' no es una fecha válida." });
        return;
      }

      const studyDates = computeStudyDatesBetween(
        startDate,
        parsedExam,
        selectedWeekDays,
      );
      if (!studyDates || studyDates.length === 0) {
        res.status(400).json({
          error:
            'No hay días de estudio disponibles entre hoy y la fecha del examen según la configuración del usuario.',
        });
        return;
      }

      // Also compute calendar days between start and exam (inclusive)
      const msPerDay = 24 * 60 * 60 * 1000;
      const calendarDays =
        Math.floor((parsedExam.getTime() - startDate.getTime()) / msPerDay) + 1;

      try {
        // Build prompt: include computed studyDates info for the model to schedule topics.
        const prompt = `Eres un asistente especializado en crear planes de estudio personalizados.

DATOS:
- Materia: ${subjectName}
- Evento: ${eventName || 'No especificado'}
- Fecha del examen: ${examDate || 'No especificada'}
- Días calendario entre hoy y el examen: ${calendarDays}
- Número de fechas de estudio disponibles según la configuración del usuario: ${studyDates.length}
- Fechas disponibles: ${studyDates.join(', ')}

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
{"title":"...","summary":"...","days":[{"date":"YYYY-MM-DD","dayNumber":1,"topics":[{"name":"","summary":"","estimatedTime":1.5}],"totalTime":2.0,"recommendations":"","completed":false}],"finalRecommendations":""}

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
          res.json({ parsed, source: 'gemini' });
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
// Función: generateQuizFromMaterial
// Recibe: { materialId: string, userId: string }
// Responde: { success: true, quizId: string } o { error: string }
// -----------------------------
export const generateQuizFromMaterial = onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1', timeoutSeconds: 180 },
  async (req, res) => {
    // Reutilizamos tu manejador de CORS
    corsHandler(req, res, async () => {
      addCorsHeaders(res); // Y tus cabeceras personalizadas

      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido. Usa POST.' });
        return;
      }

      try {
        // 1. Validar los datos de entrada del frontend
        const { materialId, userId } = req.body;
        if (!materialId || !userId) {
          console.error('Faltan materialId o userId en la solicitud');
          res.status(400).json({ error: 'Faltan materialId o userId.' });
          return;
        }

        console.log(
          `Iniciando generación de quiz para material: ${materialId}`,
        );

        // 2. Obtener el documento de la materia desde Firestore usando tu 'db' importada
        const materialRef = db.collection('materials').doc(materialId);
        const materialDoc = await materialRef.get();

        if (!materialDoc.exists) {
          console.error(`Material con ID ${materialId} no encontrado.`);
          res.status(404).json({ error: 'Material no encontrado.' });
          return;
        }

        const materialData = materialDoc.data();
        const topics = materialData?.extractedTopics;

        if (!topics || !Array.isArray(topics) || topics.length === 0) {
          console.error(`El material ${materialId} no tiene temas extraídos.`);
          res.status(400).json({
            error: 'El material no contiene temas para generar un quiz.',
          });
          return;
        }

        // Definir la interfaz para los temas
        interface Topic {
          id?: string;
          name: string;
          // Agrega otras propiedades si son necesarias
        }

        // 3. Crear el prompt para la IA (Gemini)
        const topicList = topics.map((t: Topic) => `- ${t.name}`).join('\n');
        const prompt = `
          Eres un asistente experto en crear evaluaciones educativas.
          Basado en la siguiente lista de temas de la materia "${materialData?.subjectName || 'una materia'}", genera un quiz de 5 preguntas de opción múltiple.

          Temas:
          ${topicList}

          INSTRUCCIONES:
          - Cada pregunta debe tener 4 opciones de respuesta (A, B, C, D).
          - Solo una opción debe ser la correcta.
          - Las preguntas deben ser claras, relevantes y desafiantes a nivel universitario.
          - Devuelve la respuesta ÚNICAMENTE en formato JSON válido, sin texto adicional, explicaciones ni markdown.

          FORMATO JSON REQUERIDO:
          {
            "title": "Quiz de ${materialData?.subjectName || 'la Materia'}",
            "questions": [
              {
                "questionText": "Texto de la pregunta 1...",
                "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
                "correctAnswerIndex": 2
              },
              {
                "questionText": "Texto de la pregunta 2...",
                "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
                "correctAnswerIndex": 0
              }
            ]
          }
        `;

        console.log('Enviando prompt a Gemini para generar quiz...');

        // 4. Llamar a la API de Gemini usando tu instancia de GoogleGenAI
        const ai = new GoogleGenAI({}); // Ya tienes la API Key como secreto
        let response;
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Usamos flash para velocidad
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          });
        } catch (geminiApiError) {
          console.error(
            'Error calling Gemini API for quiz generation:',
            geminiApiError,
          );
          throw new Error(
            'Error al comunicarse con la API de Gemini para generar el quiz.',
          );
        }

        const responseText = response.text || '';
        if (!responseText) {
          console.error(
            'Gemini API returned an empty response for quiz generation.',
          );
          throw new Error('La respuesta de la IA para el quiz estaba vacía.');
        }

        // 5. Limpiar y parsear la respuesta JSON de la IA
        const cleanedJson = responseText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();

        let rawQuizData;
        try {
          rawQuizData = JSON.parse(cleanedJson);
        } catch (jsonError) {
          console.error('Error parsing JSON from Gemini response:', jsonError);
          console.error('Raw Gemini response:', cleanedJson);
          throw new Error('Error al parsear la respuesta JSON de Gemini.');
        }

        // Transform quizData to match the frontend's Quiz interface
        const quizData = {
          questions: rawQuizData.questions.map((q: RawQuestion) => ({
            question: q.questionText,
            options: q.options,
            correctAnswer: q.options[q.correctAnswerIndex],
          })),
          subjectName: materialData?.subjectName || 'Materia Desconocida',
          materialId: materialId,
          userId: userId,
          createdAt: new Date().toISOString(),
        };

        // 6. Guardar el nuevo quiz en una colección "quizzes" en Firestore
        const quizRef = db.collection('quizzes').doc(); // Genera un ID automático
        await quizRef.set({
          ...quizData,
          materialId: materialId,
          userId: userId,
          createdAt: new Date().toISOString(),
        });

        console.log(`Quiz guardado exitosamente con ID: ${quizRef.id}`);

        // 7. Enviar una respuesta de éxito al frontend
        res.status(200).json({
          success: true,
          quizId: quizRef.id,
          quizData: { ...quizData, id: quizRef.id },
        });
      } catch (error) {
        console.error('Error inesperado en generateQuizFromMaterial:', error);
        const message =
          error instanceof Error
            ? error.message
            : 'Error interno del servidor.';
        res.status(500).json({ error: message });
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

export const createFolder = onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      addCorsHeaders(res);
      res.status(204).send('');
      return;
    }

    corsHandler(req, res, async () => {
      addCorsHeaders(res);

      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
        return;
      }

      const { name, path, userId } = req.body as FolderData;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized: User ID not provided.' });
        return;
      }

      if (!name || !path) {
        res.status(400).json({ error: 'Missing args: "name" and "path".' });
        return;
      }

      try {
        const folderRef = db.collection('folders').doc();
        const newPath = `${path}${folderRef.id}/`;

        await folderRef.set({
          name,
          path: newPath,
          userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({
          success: true,
          folderId: folderRef.id,
          path: newPath,
        });
      } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: 'Error creating folder.' });
      }
    });
  },
);

export const renameFolder = onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    // Manejar CORS
    if (req.method === 'OPTIONS') {
      addCorsHeaders(res);
      res.status(204).send('');
      return;
    }

    corsHandler(req, res, async () => {
      addCorsHeaders(res);

      // Verificar método HTTP
      if (req.method !== 'POST') {
        res.status(405).json({
          success: false,
          error: 'Método no permitido. Usa POST.',
        });
        return;
      }

      try {
        // Verificar autenticación
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({
            success: false,
            error: 'No se proporcionó token de autenticación',
          });
          return;
        }

        // Verificar token y obtener UID
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        // Obtener datos del cuerpo
        const { folderId, newName } = req.body;

        // Validar datos requeridos
        if (!folderId || !newName) {
          res.status(400).json({
            success: false,
            error:
              'Faltan argumentos requeridos: folderId y newName son obligatorios',
          });
          return;
        }

        // Validar longitud del nuevo nombre
        if (newName.trim().length === 0) {
          res.status(400).json({
            success: false,
            error: 'El nombre de la carpeta no puede estar vacío',
          });
          return;
        }

        // Verificar que la carpeta existe y pertenece al usuario
        const folderRef = db.collection('folders').doc(folderId);
        const folderDoc = await folderRef.get();

        if (!folderDoc.exists) {
          res.status(404).json({
            success: false,
            error: 'Carpeta no encontrada',
          });
          return;
        }

        const folderData = folderDoc.data();
        if (folderData?.userId !== userId) {
          res.status(403).json({
            success: false,
            error: 'No tienes permiso para modificar esta carpeta',
          });
          return;
        }

        // Verificar si el nuevo nombre es diferente al actual
        if (folderData.name === newName) {
          res.status(200).json({
            success: true,
            message: 'El nombre de la carpeta no ha cambiado',
            folderId,
            newName,
          });
          return;
        }

        // Actualizar la carpeta
        const updateData = {
          name: newName,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await folderRef.update(updateData);

        // Respuesta exitosa
        res.status(200).json({
          success: true,
          message: 'Carpeta renombrada exitosamente',
          folderId,
          newName,
          updatedAt: updateData.updatedAt,
        });
      } catch (error: unknown) {
        console.error('Error al renombrar carpeta:', error);

        // Manejar diferentes tipos de errores
        const firebaseError = error as { code?: string; message?: string };

        if (firebaseError.code === 'auth/argument-error') {
          res.status(401).json({
            success: false,
            error: 'Token de autenticación inválido o expirado',
          });
        } else if (
          firebaseError.code === 'permission-denied' ||
          firebaseError.code === 'permission_denied'
        ) {
          res.status(403).json({
            success: false,
            error: 'No tienes permiso para realizar esta acción',
          });
        } else if (firebaseError.code === 'not-found') {
          res.status(404).json({
            success: false,
            error: 'Recurso no encontrado',
          });
        } else {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud',
            details:
              process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          });
        }
      }
    });
  },
);

export const deleteFolder = onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    // Manejar CORS
    if (req.method === 'OPTIONS') {
      addCorsHeaders(res);
      res.status(204).send('');
      return;
    }

    corsHandler(req, res, async () => {
      addCorsHeaders(res);

      // Verificar método HTTP
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido. Usa POST.' });
        return;
      }

      try {
        // Verificar autenticación
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res
            .status(401)
            .json({ error: 'No se proporcionó token de autenticación' });
          return;
        }

        // Verificar token y obtener UID
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        // Obtener folderId del cuerpo
        const { folderId } = req.body;

        if (!folderId) {
          res
            .status(400)
            .json({ error: 'El parámetro folderId es obligatorio' });
          return;
        }

        // Obtener la carpeta a eliminar
        const folderRef = db.collection('folders').doc(folderId);
        const folderDoc = await folderRef.get();

        if (!folderDoc.exists) {
          res.status(404).json({ error: 'Carpeta no encontrada' });
          return;
        }

        const folderData = folderDoc.data();
        if (folderData?.userId !== userId) {
          res
            .status(403)
            .json({ error: 'No tienes permiso para eliminar esta carpeta' });
          return;
        }

        const path = folderData.path;
        if (!path) {
          res
            .status(500)
            .json({ error: 'No se encontró la ruta de la carpeta' });
          return;
        }

        // Obtener todas las carpetas del usuario
        const allFolders = await db
          .collection('folders')
          .where('userId', '==', userId)
          .get();

        // Filtrar localmente las subcarpetas
        const foldersToDelete = allFolders.docs
          .filter((doc) => {
            const docPath = doc.data().path || '';
            return docPath.startsWith(path);
          })
          .map((doc) => doc.ref);

        // Obtener todos los materiales del usuario
        const allMaterials = await db
          .collection('materials')
          .where('userId', '==', userId)
          .get();

        // Filtrar localmente los materiales en la carpeta
        const materialsToDelete = allMaterials.docs
          .filter((doc) => {
            const docPath = doc.data().path || '';
            return docPath.startsWith(path);
          })
          .map((doc) => doc.ref);

        // Crear un batch para eliminar todo
        const batch = db.batch();

        // Agregar operaciones de eliminación al batch
        foldersToDelete.forEach((ref) => batch.delete(ref));
        materialsToDelete.forEach((ref) => batch.delete(ref));

        // Ejecutar todas las operaciones
        await batch.commit();

        // Respuesta exitosa
        res.status(200).json({
          success: true,
          message: 'Carpeta y su contenido eliminados exitosamente',
          folderId,
        });
      } catch (error: unknown) {
        console.error('Error al eliminar carpeta:', error);

        // Manejar diferentes tipos de errores
        const firebaseError = error as { code?: string; message?: string };
        if (firebaseError.code === 'auth/argument-error') {
          res
            .status(401)
            .json({ error: 'Token de autenticación inválido o expirado' });
        } else if (
          firebaseError.code === 'permission-denied' ||
          firebaseError.code === 'permission_denied'
        ) {
          res
            .status(403)
            .json({ error: 'No tienes permiso para realizar esta acción' });
        } else {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          res.status(500).json({
            error: 'Error al procesar la solicitud',
            details:
              process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          });
        }
      }
    });
  },
);
