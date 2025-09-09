// Removido Firebase Storage para evitar problemas CORS en desarrollo

export interface ExtractedTopic {
  id: string;
  name: string;
  description?: string;
  order: number;
}

export interface PDFProcessingResult {
  topics: ExtractedTopic[];
  summary: string;
  success: boolean;
  error?: string;
}

export class PDFProcessor {
  private static readonly GEMINI_FUNCTION_URL =
    'https://us-central1-proyecto-final-universitario.cloudfunctions.net/geminiResponse';

  /**
   * Procesa el texto extraído de un PDF y extrae los temas usando Gemini AI
   */
  static async processPDFTextWithGemini(
    text: string,
    subjectName: string,
  ): Promise<PDFProcessingResult> {
    try {
      console.log('🚀 INICIANDO PROCESAMIENTO DE TEXTO DE PDF CON IA');
      console.log(` Materia: ${subjectName}`);
      console.log(`📝 Longitud del texto: ${text.length} caracteres`);

      // Crear prompt específico para extracción de temas
      const prompt = this.createTopicExtractionPromptWithText(
        subjectName,
        text,
      );
      console.log('✅ Prompt creado exitosamente');
      console.log(`📏 Longitud del prompt: ${prompt.length} caracteres`);

      // Llamar a la función Gemini
      const response = await fetch(this.GEMINI_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: prompt,
        }),
      });

      console.log(
        `📡 Respuesta HTTP recibida: ${response.status} ${response.statusText}`,
      );

      if (!response.ok) {
        throw new Error(`Error en la función Gemini: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Respuesta JSON parseada exitosamente');
      console.log('📊 Contenido de la respuesta:', result);

      // Procesar respuesta de Gemini
      return this.parseGeminiResponse(result);
    } catch (error) {
      console.error('❌ Error procesando texto de PDF:', error);
      return {
        topics: [],
        summary: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Crea el prompt específico para extraer temas del PDF usando texto plano
   * NO BORRAR {{"topics":[{"id":"tema_1","name":"Tema 1","order":1}]} O UTILIZARLO EN EL SIGUIENTE PROMPT
   */
  private static createTopicExtractionPromptWithText(
    subjectName: string,
    text: string,
  ): string {
    return `
Eres un asistente de planificación de estudios. Analiza el siguiente texto del programa de la materia "${subjectName}" y genera un plan de estudio diario.
El plan debe ser un JSON con la siguiente estructura:
{{"topics":[{"id":"tema_1","name":"Tema 1","order":1}]}
No incluyas resúmenes, recomendaciones ni texto adicional. Solo el tema, el día y la cantidad de horas por día.
Texto extraído del PDF:
${text.substring(0, 2000)}
`;
  }

  /**
   * Procesa la respuesta de Gemini y extrae los temas
   */
  private static parseGeminiResponse(
    geminiResult: unknown,
  ): PDFProcessingResult {
    try {
      console.log('🔍 Analizando estructura de la respuesta de Gemini...');

      // La función geminiResponse puede devolver el resultado en diferentes formatos
      let responseText = '';
      const result = geminiResult as Record<string, unknown>;

      if (result.raw_response && typeof result.raw_response === 'string') {
        console.log('📋 Usando campo raw_response');
        responseText = result.raw_response;
      } else if (typeof geminiResult === 'string') {
        console.log('📋 Respuesta es string directo');
        responseText = geminiResult;
      } else if (result.response && typeof result.response === 'string') {
        console.log('📋 Usando campo response');
        responseText = result.response;
      } else {
        console.log('📋 Convirtiendo objeto completo a JSON');
        responseText = JSON.stringify(geminiResult);
      }

      console.log('📝 Texto de respuesta extraído:');
      console.log(
        responseText.substring(0, 500) +
          (responseText.length > 500 ? '...' : ''),
      );

      // Limpiar la respuesta y extraer JSON
      console.log('🧹 Limpiando respuesta...');
      const cleanedResponse = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      console.log('✨ Respuesta limpia:');
      console.log(
        cleanedResponse.substring(0, 300) +
          (cleanedResponse.length > 300 ? '...' : ''),
      );

      // Intentar parsear como JSON
      console.log('🔄 Intentando parsear como JSON...');
      const parsedData = JSON.parse(cleanedResponse);
      console.log('✅ JSON parseado exitosamente');
      console.log('📊 Estructura parseada:', parsedData);

      // Si no hay topics, intentar parsear el campo summary como JSON
      if (!parsedData.topics || !Array.isArray(parsedData.topics)) {
        console.log(
          '⚠️ No se encontraron temas en el primer intento. Intentando parsear summary...',
        );
        if (parsedData.summary && typeof parsedData.summary === 'string') {
          try {
            const summaryParsed = JSON.parse(parsedData.summary);
            if (summaryParsed.topics && Array.isArray(summaryParsed.topics)) {
              console.log('✅ Temas encontrados dentro de summary.');
              parsedData.topics = summaryParsed.topics;
              parsedData.summary = summaryParsed.summary || parsedData.summary;
            } else {
              throw new Error('No se encontraron temas en summary');
            }
          } catch (e) {
            console.log('❌ Error parseando summary:', e);
            throw new Error(
              'Formato de respuesta inválido: no se encontraron temas',
            );
          }
        } else {
          throw new Error(
            'Formato de respuesta inválido: no se encontraron temas',
          );
        }
      }

      console.log(
        `📚 Se encontraron ${parsedData.topics.length} temas en la respuesta`,
      );

      // Validar y procesar temas (máximo 30)
      const topics: ExtractedTopic[] = parsedData.topics
        .slice(0, 30) // Limitar a máximo 30 temas
        .map(
          (
            topic: {
              id?: string;
              name?: string;
              description?: string;
              order?: number;
            },
            topicIndex: number,
          ) => {
            const processedTopic = {
              id: topic.id || `tema_${topicIndex + 1}`,
              name: topic.name || `Tema ${topicIndex + 1}`,
              description: topic.description || '',
              order: topic.order || topicIndex + 1,
            };

            console.log(`📖 Tema ${topicIndex + 1}: ${processedTopic.name}`);
            if (processedTopic.description) {
              console.log(`   📝 Descripción: ${processedTopic.description}`);
            }

            return processedTopic;
          },
        );

      if (parsedData.topics.length > 30) {
        console.log(
          `⚠️ ADVERTENCIA: La IA devolvió ${parsedData.topics.length} temas, limitando a 30`,
        );
      }

      console.log('🎉 PROCESAMIENTO EXITOSO!');
      console.log(`✅ Total de temas extraídos: ${topics.length}`);
      console.log('📋 Lista de temas:');
      topics.forEach((topic, i) => {
        console.log(`   ${i + 1}. ${topic.name}`);
      });

      return {
        topics,
        summary: '', // No incluir summary en la respuesta final
        success: true,
      };
    } catch (error) {
      console.error('❌ Error parseando respuesta de Gemini:', error);

      // Fallback: intentar extraer temas de texto plano
      return this.extractTopicsFromPlainText(geminiResult);
    }
  }

  /**
   * Fallback para extraer temas de texto plano si falla el JSON
   */
  private static extractTopicsFromPlainText(
    geminiResult: unknown,
  ): PDFProcessingResult {
    try {
      const result = geminiResult as Record<string, unknown>;
      const responseText =
        typeof geminiResult === 'string'
          ? geminiResult
          : (result.raw_response as string) ||
            (result.response as string) ||
            '';

      // Buscar patrones comunes de temas
      const lines = responseText
        .split('\n')
        .filter((line: string) => line.trim());
      const topics: ExtractedTopic[] = [];

      lines.forEach((line: string) => {
        const trimmedLine = line.trim();

        // Detectar líneas que parecen temas (empiezan con número, guión, etc.)
        if (
          trimmedLine.match(/^(\d+\.?|[-*])\s+(.+)/) ||
          (trimmedLine.length > 5 && trimmedLine.length < 100)
        ) {
          const topicName = trimmedLine
            .replace(/^(\d+\.?|[-*])\s+/, '')
            .replace(/[^\w\s\u00C0-\u017F]/g, ' ')
            .trim();

          if (topicName.length > 3) {
            topics.push({
              id: `tema_${topics.length + 1}`,
              name: topicName,
              order: topics.length + 1,
            });
          }
        }
      });

      return {
        topics: topics.slice(0, 20), // Limitar a 20 temas máximo
        summary: 'Temas extraídos del texto del programa',
        success: topics.length > 0,
        error:
          topics.length === 0
            ? 'No se pudieron extraer temas del PDF'
            : undefined,
      };
    } catch {
      return {
        topics: [],
        summary: '',
        success: false,
        error: 'Error procesando el contenido del PDF',
      };
    }
  }
}
