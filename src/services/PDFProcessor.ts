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
   * Procesa un PDF y extrae los temas usando Gemini AI
   */
  static async processPDFWithGemini(
    file: File,
    subjectName: string,
  ): Promise<PDFProcessingResult> {
    try {
      console.log('🚀 INICIANDO PROCESAMIENTO DE PDF CON IA');
      console.log(
        `📄 Archivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      );
      console.log(`📚 Materia: ${subjectName}`);

      // 1. Convertir PDF a Base64 para enviar directamente
      console.log('🔄 PASO 1: Convirtiendo PDF a Base64...');
      const base64Data = await this.fileToBase64(file);
      console.log('✅ PDF convertido a Base64 exitosamente');
      console.log(`📏 Tamaño Base64: ${base64Data.length} caracteres`);

      // 2. Crear prompt específico para extracción de temas
      console.log('📝 PASO 2: Creando prompt para Gemini AI...');
      const prompt = this.createTopicExtractionPromptWithBase64(
        subjectName,
        base64Data,
        file.name,
      );
      console.log('✅ Prompt creado exitosamente');
      console.log(`📏 Longitud del prompt: ${prompt.length} caracteres`);

      // 3. Llamar a la función Gemini
      console.log('🤖 PASO 3: Enviando solicitud a Gemini AI...');
      console.log(`🌐 URL de la función: ${this.GEMINI_FUNCTION_URL}`);

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

      // 4. Procesar respuesta de Gemini
      console.log('🔄 PASO 4: Procesando respuesta de Gemini...');
      return this.parseGeminiResponse(result);
    } catch (error) {
      console.error('❌ Error procesando PDF:', error);
      return {
        topics: [],
        summary: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Convierte un archivo a Base64
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remover el prefijo "data:application/pdf;base64,"
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Crea el prompt específico para extraer temas del PDF usando Base64
   */
  private static createTopicExtractionPromptWithBase64(
    subjectName: string,
    base64Data: string,
    fileName: string,
  ): string {
    return `
Eres un asistente especializado en análisis de programas académicos universitarios.

TAREA: Analiza el programa de la materia "${subjectName}" y extrae ÚNICAMENTE los temas PRINCIPALES de estudio.

ARCHIVO: ${fileName}
CONTENIDO PDF (Base64): ${base64Data.substring(0, 1000)}...

CRITERIOS DE SELECCIÓN - SOLO incluye:
1. UNIDADES TEMÁTICAS PRINCIPALES (ej: "Álgebra Lineal", "Cálculo Diferencial")
2. CAPÍTULOS PRINCIPALES del programa académico
3. MÓDULOS DE ESTUDIO centrales de la materia
4. TEMAS que aparezcan en el índice o tabla de contenidos principal

NO incluyas:
- Subtemas específicos o detalles menores
- Ejercicios o actividades particulares
- Metodologías de evaluación
- Bibliografía o referencias
- Fechas, horarios o información administrativa
- Objetivos generales o competencias

LÍMITES:
- MÁXIMO 30 temas principales
- Prioriza los temas más importantes y centrales
- Si hay más de 30, selecciona los más relevantes para el estudio

FORMATO DE RESPUESTA (JSON):
{
  "topics": [
    {
      "id": "tema_1",
      "name": "Nombre del Tema Principal",
      "description": "Breve descripción del alcance del tema",
      "order": 1
    }
  ],
  "summary": "Resumen de los temas principales identificados en el programa"
}

IMPORTANTE:
- Responde SOLO con el JSON válido
- No agregues texto adicional antes o después del JSON
- Máximo 30 temas en total
- Solo temas PRINCIPALES, no subtemas
- Los IDs deben ser únicos y usar formato snake_case

Analiza el contenido del PDF y extrae ÚNICAMENTE los temas principales de estudio:`;
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

      if (!parsedData.topics || !Array.isArray(parsedData.topics)) {
        console.log('❌ Error: No se encontraron temas en la respuesta');
        throw new Error(
          'Formato de respuesta inválido: no se encontraron temas',
        );
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
        summary: parsedData.summary || 'Programa procesado exitosamente',
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
