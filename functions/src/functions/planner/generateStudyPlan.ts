import { onRequest } from 'firebase-functions/https';
import { GEMINI_API_KEY, initializeGeminiAI } from '../../config/gemini';
import {
  corsHandler,
  addCorsHeaders,
  handleOptionsRequest,
} from '../../utils/cors';
import {
  validateRequiredFields,
  validateArrayField,
} from '../../utils/validation';
import { db } from '../../firebaseAdmin';
import { UserAvailability } from '../../types';

export const generateStudyPlan = onRequest(
  { secrets: [GEMINI_API_KEY], region: 'us-central1', timeoutSeconds: 300 },
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

      const { subjectName, eventName, examDate, topics, userId } =
        req.body || {};

      // Validación mejorada
      const requiredFields = ['subjectName', 'userId', 'examDate'];
      const validationError = validateRequiredFields(req.body, requiredFields);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      const arrayValidationError = validateArrayField(req.body, 'topics');
      if (arrayValidationError) {
        res.status(400).json({ error: arrayValidationError });
        return;
      }

      if (!topics || topics.length === 0) {
        res
          .status(400)
          .json({ error: 'Debe proporcionar al menos un tema para estudiar' });
        return;
      }

      try {
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
        console.log(`📅 Obteniendo configuración para usuario: ${userId}`);
        const settingsRef = db.collection('user_settings').doc(String(userId));
        const settingsSnap = await settingsRef.get();

        if (!settingsSnap.exists) {
          res.status(400).json({
            error:
              'No se encontró configuración de usuario. Configure sus días de estudio en la aplicación.',
          });
          return;
        }

        const settings = settingsSnap.data() as UserAvailability;
        const selectedWeekDays: number[] | undefined =
          settings && Array.isArray(settings.selectedWeekDays)
            ? settings.selectedWeekDays
            : undefined;

        if (!selectedWeekDays || selectedWeekDays.length === 0) {
          res.status(400).json({
            error:
              'Configure sus días de estudio disponibles en la aplicación antes de generar un plan.',
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
          res.status(400).json({ error: 'La fecha del examen no es válida.' });
          return;
        }

        if (parsedExam <= startDate) {
          res
            .status(400)
            .json({ error: 'La fecha del examen debe ser posterior a hoy.' });
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
              'No hay días de estudio disponibles entre hoy y la fecha del examen según su configuración. Considere ajustar la fecha del examen o sus días disponibles.',
          });
          return;
        }

        console.log(
          `📚 Generando plan para ${topics.length} temas en ${studyDates.length} días`,
        );

        // Build prompt: include computed studyDates info for the model to schedule topics.
        const prompt = `Eres un asistente especializado en crear planes de estudio personalizados.

INFORMACIÓN:
- Materia: ${subjectName}
- Evento: ${eventName || 'Examen'}
- Fecha del examen: ${examDate}
- Temas a estudiar: ${topics.join(', ')}
- Número de fechas de estudio disponibles según la configuración del usuario: ${studyDates.length}
- Fechas disponibles: ${studyDates.join(', ')}

FORMATO DE RESPUESTA (JSON estricto):
{
  "title": "Plan de Estudio - [Materia] [Evento]",
  "summary": "Resumen del plan",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayNumber": número (1 = primer día del plan),
      "topics": [
        {
          "name": "nombre del tema",
          "summary": "qué estudiar específicamente",
          "estimatedTime": "X horas"
        }
      ],
      "totalTime": "X horas",
      "recommendations": "consejos específicos para ese día"
    }
  ],
  "finalRecommendations": "consejos para el examen"
}

INSTRUCCIONES:
1. Distribuye los ${topics.length} temas across los ${studyDates.length} días disponibles
2. Usa EXACTAMENTE las fechas proporcionadas: ${studyDates.join(', ')}
3. Asigna tiempo realista (2-4 horas por día)
4. Da recomendaciones específicas para cada día
5. Responde SOLO con JSON válido, sin texto adicional`;

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
          console.log('✅ Plan de estudio generado exitosamente');
          res.json({ parsed, source: 'gemini' });
        } catch {
          console.warn('⚠️ No se pudo parsear JSON, devolviendo respuesta raw');
          res.json({ raw_response: textResp, source: 'gemini' });
        }
      } catch (error: unknown) {
        console.error('❌ Error generando plan de estudio:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
          error: 'Error al generar el plan de estudio',
          details: errorMessage,
        });
      }
    });
  },
);
