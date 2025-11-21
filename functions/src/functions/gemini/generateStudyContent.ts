import { onRequest } from 'firebase-functions/https';
import { GEMINI_API_KEY, initializeGeminiAI } from '../../config/gemini';
import {
  corsHandler,
  addCorsHeaders,
  handleOptionsRequest,
} from '../../utils/cors';
import { validateRequiredFields } from '../../utils/validation';

export const generateStudyContent = onRequest(
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

      const { topic, subject, level = 'universitario' } = req.body || {};

      // Validación mejorada
      const validationError = validateRequiredFields(req.body, [
        'topic',
        'subject',
      ]);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      try {
        console.log(
          `📚 Generando contenido de estudio para "${topic}" en ${subject}`,
        );

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
  "summary": "explicación concisa del tema",
  "keyConcepts": [
    {
      "concept": "nombre del concepto",
      "definition": "definición breve"
    }
  ],
  "flashcards": [
    {
      "question": "pregunta",
      "answer": "respuesta"
    }
  ],
  "practiceQuestions": [
    {
      "question": "pregunta de práctica",
      "answer": "respuesta detallada (máximo 60 palabras)"
    }
  ],
  "connections": [
    "tema relacionado 1",
    "tema relacionado 2"
  ],
  "studyTips": [
    "consejo de estudio 1",
    "consejo de estudio 2"
  ]
}

Responde ÚNICAMENTE con el JSON válido, sin texto adicional.`;

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

        try {
          const parsedContent = JSON.parse(responseText);

          // Validar estructura básica
          if (
            !parsedContent.summary ||
            !parsedContent.keyConcepts ||
            !parsedContent.flashcards
          ) {
            throw new Error('Respuesta incompleta de la IA');
          }

          console.log(
            `✅ Contenido de estudio generado exitosamente para "${topic}"`,
          );

          res.json({
            success: true,
            content: parsedContent,
            source: 'gemini',
          });
        } catch {
          console.warn('⚠️ No se pudo parsear JSON, devolviendo respuesta raw');
          res.json({
            success: false,
            raw_response: responseText,
            source: 'gemini',
            error: 'No se pudo parsear la respuesta como JSON válido',
          });
        }
      } catch (error: unknown) {
        console.error('❌ Error generando contenido de estudio:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
          error: 'Error al generar contenido de estudio',
          details: errorMessage,
        });
      }
    });
  },
);
