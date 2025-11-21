import { onRequest } from 'firebase-functions/https';
import { GEMINI_API_KEY, initializeGeminiAI } from '../../config/gemini';
import {
  corsHandler,
  addCorsHeaders,
  handleOptionsRequest,
} from '../../utils/cors';
import { validateRequiredFields } from '../../utils/validation';
import { RawQuestion } from '../../types';
import { db } from '../../firebaseAdmin';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

export const generateQuizFromMaterial = onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1', timeoutSeconds: 180 },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      handleOptionsRequest(res, req.headers.origin as string | undefined);
      return;
    }

    corsHandler(req, res, async () => {
      addCorsHeaders(res, req.headers.origin as string | undefined);

      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido. Usa POST.' });
        return;
      }

      try {
        const { materialId, userId } = req.body;

        // Validación mejorada
        const validationError = validateRequiredFields(req.body, [
          'materialId',
          'userId',
        ]);
        if (validationError) {
          res.status(400).json({ error: validationError });
          return;
        }

        console.log(
          `🧩 Iniciando generación de quiz para material: ${materialId}`,
        );

        // Obtener el documento de la materia desde Firestore
        const materialRef = db.collection('materials').doc(materialId);
        const materialDoc = await materialRef.get();

        if (!materialDoc.exists) {
          console.error(`❌ Material con ID ${materialId} no encontrado.`);
          res.status(404).json({ error: 'Material no encontrado.' });
          return;
        }

        const materialData = materialDoc.data();
        const topics = materialData?.extractedTopics;

        if (!topics || !Array.isArray(topics) || topics.length === 0) {
          console.error(
            `❌ El material ${materialId} no tiene temas extraídos.`,
          );
          res.status(400).json({
            error: 'El material no contiene temas para generar un quiz.',
          });
          return;
        }

        console.log(`📚 Generando quiz con ${topics.length} temas`);

        // Generar prompt para la IA
        const topicsText = topics
          .map(
            (topic: { name: string; description?: string }) =>
              `- ${topic.name}: ${topic.description || 'Sin descripción'}`,
          )
          .join('\n');

        const prompt = `Genera un quiz de múltiple opción basado en los siguientes temas de estudio:

TEMAS:
${topicsText}

INSTRUCCIONES:
1. Crea exactamente 10 preguntas de múltiple opción
2. Cada pregunta debe tener 4 opciones (A, B, C, D)
3. Solo una opción debe ser correcta
4. Las preguntas deben cubrir diferentes temas proporcionados
5. Incluye preguntas de diferentes niveles de dificultad

FORMATO DE RESPUESTA (JSON estricto):
{
  "questions": [
    {
      "questionText": "¿Pregunta aquí?",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 0
    }
  ]
}

Responde SOLO con JSON válido, sin texto adicional.`;

        // Llamar a Gemini
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

        let responseText = response.text || '';
        responseText = responseText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();

        let questions: RawQuestion[] = [];

        try {
          const parsed = JSON.parse(responseText);
          questions = parsed.questions || [];
        } catch (parseError) {
          console.error('❌ Error parseando respuesta de Gemini:', parseError);
          res
            .status(500)
            .json({ error: 'Error procesando la respuesta de la IA' });
          return;
        }

        if (!Array.isArray(questions) || questions.length === 0) {
          console.error('❌ No se generaron preguntas válidas');
          res
            .status(500)
            .json({ error: 'No se pudieron generar preguntas para el quiz' });
          return;
        }

        // Procesar y validar preguntas
        const processedQuestions = questions.map(
          (q: RawQuestion, index: number) => {
            if (
              !q.questionText ||
              !Array.isArray(q.options) ||
              q.options.length !== 4
            ) {
              throw new Error(`Pregunta ${index + 1} tiene formato inválido`);
            }

            return {
              id: crypto.randomUUID(),
              questionText: q.questionText,
              options: q.options,
              correctAnswerIndex: q.correctAnswerIndex,
              userSelectedIndex: null,
              isCorrect: null,
            };
          },
        );

        // Guardar quiz en Firestore
        const quizData = {
          materialId,
          userId,
          questions: processedQuestions,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: null,
          score: null,
          totalQuestions: processedQuestions.length,
          correctAnswers: 0,
        };

        const quizRef = await db.collection('quizzes').add(quizData);

        console.log(`✅ Quiz generado exitosamente: ${quizRef.id}`);

        res.json({
          success: true,
          quizId: quizRef.id,
          totalQuestions: processedQuestions.length,
          message: 'Quiz generado exitosamente',
        });
      } catch (error: unknown) {
        console.error('❌ Error generando quiz:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
          error: 'Error interno al generar el quiz',
          details: errorMessage,
        });
      }
    });
  },
);
