// ====================================================
// 🚀 FUNCIONES CLOUD ORGANIZADAS MODULARMENTE
// ====================================================
// Archivo principal que exporta todas las Cloud Functions
// organizadas por módulos para mejor mantenimiento

// 🤖 Funciones de Gemini AI
export { askGeminiBot } from './functions/gemini/askGeminiBot';
export { generateStudyContent } from './functions/gemini/generateStudyContent';

// 📄 Funciones de procesamiento de PDF
export { processPdfTopics } from './functions/pdf/processPdfTopics';

// 📅 Funciones de planificación
export { generateStudyPlan } from './functions/planner/generateStudyPlan';

// 🧩 Funciones de quiz
export { generateQuizFromMaterial } from './functions/quiz/generateQuizFromMaterial';

// 📁 Funciones de carpetas
export { createFolder } from './functions/folders/createFolder';
export { renameFolder } from './functions/folders/renameFolder';
export { deleteFolder } from './functions/folders/deleteFolder';

// ====================================================
// ✅ FUNCIONES MIGRADAS EXITOSAMENTE
// ====================================================
// ✅ askGeminiBot - Consultas a Gemini sobre materias
// ✅ processPdfTopics - Extracción de temas de PDF
// ✅ generateStudyPlan - Generación de planes de estudio
// ✅ generateQuizFromMaterial - Generación de quizzes
// ✅ generateStudyContent - Contenido educativo
// ✅ createFolder - Crear carpetas
// ✅ renameFolder - Renombrar carpetas
// ✅ deleteFolder - Eliminar carpetas

// ====================================================
// � FUNCIONES PENDIENTES (COMENTADAS EN ORIGINAL)
// ====================================================
// - geminiResponse (está comentada en el original)
// - geminiResponseTest (función de prueba)

// ====================================================
// 🎯 MEJORAS IMPLEMENTADAS
// ====================================================
// ✅ Estructura modular por dominio
// ✅ Configuración centralizada (config/)
// ✅ Utilidades compartidas (utils/)
// ✅ Tipos definidos (types/)
// ✅ Logging mejorado con emojis
// ✅ Manejo de errores robusto
// ✅ Validaciones centralizadas
// ✅ Documentación inline
// ✅ CORS optimizado
// ====================================================
