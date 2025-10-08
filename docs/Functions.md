# FocuseAR – Documentación de Funciones y Servicios

Este documento lista y explica las funciones principales expuestas por servicios, hooks, contextos y utilidades del proyecto.

Fecha de generación: 2025-10-01

---

## Firebase bootstrap

- **`src/firebase.ts`**
  - **`auth`**: instancia de autenticación de Firebase.
  - **`googleProvider`**: proveedor de Google para login.
  - **`db`**: instancia de Firestore.
  - **`storage`**: instancia de Storage.

---

## Servicios de base de datos (`src/services/DatabaseService.ts`)

Clase principal para operaciones con Firestore. Incluye interfaces y métodos CRUD.

- **Interfaces exportadas**:
  - **`UserData`**: Datos de usuario.
  - **`Material`**: Metadatos de material (incluye `subjectName`, `examDate`, `color`, `importantDates`, `extractedTopics`, etc.).
  - **`StudyPlan`**: Plan de estudio persistido. Incluye `generatedPlan` con `title`, `summary`, `durationDays`, `examDate`, `selectedWeekDays`, `topics`, `studyDates`, `subjectColor`, `structuredPlan`, `dailyTasks`.
  - **`Topic`**: Tema editable con `id`, `title`, `description`, `order`.
  - **`AIConversation`, `AIConversationMessage`**: Conversaciones y mensajes del chatbot.
  - **`Quiz`, `QuizQuestion`**: Estructura de cuestionarios.
  - **`UserEvent`**: Eventos del usuario.
  - **`Activity`**: Actividades recientes consolidadas.

- **`DatabaseService.normalizeTopics(rawTopics)`**
  - Normaliza una lista heterogénea (strings u objetos) a `Topic[]` con `id` y `title` válidos.

- **`createOrUpdateUser(user)`**
  - Crea documento `users/{uid}` si no existe; si existe, actualiza `lastLogin`, `displayName`, `photoURL`.

- **`createMaterial(material)`**
  - Crea documento en `materials`. Si llegan `extractedTopics`, agrega metadatos de versión y `extractedTopicsUpdatedAt`.

- **`saveUserAvailability(userId, availability)`**
  - Persiste en `user_settings/{userId}` la disponibilidad semanal y `selectedWeekDays` derivados.

- **`getUserAvailability(userId)`**
  - Obtiene `availability` y `selectedWeekDays` desde `user_settings`.

- **`createStudyPlan(studyPlan)`**
  - Crea documento en `studyPlans`. Normaliza `generatedPlan.topics` antes de guardar y sanea `undefined`.

- **`getUserByUid(uid)`**
  - Retorna `UserData` del documento `users/{uid}` o `null`.

- **`getUserMaterials(userId)`**
  - Lista documentos de `materials` del usuario.

- **`getUserStudyPlans(userId)`**
  - Lista `studyPlans` del usuario y enriquece cada plan con `subjectName` del material asociado.

- **`getMaterialById(materialId)`**
  - Retorna un `Material` por id o `null`.

- **`updateTaskCompletion(planId, day, completed)`**
  - Actualiza `generatedPlan.dailyTasks[day]` marcado como completado/no completado.

- **`deleteMaterialAndPlans(materialId)`**
  - Elimina subcolección `materials/{id}/topics` (si existe), todos los `studyPlans` relacionados y el material.

- **`deleteStudyPlan(planId)`**
  - Elimina un plan de estudio por id.

- Conversaciones IA:
  - **`createAIConversation(conversation)`**: Crea `ai_conversations` con timestamps.
  - **`addMessageToConversation(conversationId, message)`**: Agrega mensaje con id y timestamp.
  - **`getUserAIConversations(userId)`**: Lista conversaciones del usuario.
  - **`deleteAIConversation(conversationId)`**: Elimina conversación.
  - **`updateConversationTitle(conversationId, title)`**: Actualiza título.

- Quizzes:
  - **`getQuizzes(userId)`**: Lista quizzes del usuario.
  - **`getQuiz(quizId)`**: Obtiene un quiz por id.
  - **`deleteQuiz(quizId)`**: Elimina un quiz.

- Eventos:
  - **`createUserEvent(event)`**: Crea `events` con timestamps.
  - **`getUserEvents(userId)`**: Lista eventos del usuario.

- **`updateStudyPlan(planId, updatedPlan)`**
  - Actualiza campos del plan y `updatedAt`.

- **`getRecentActivities(userId, activitiesLimit=5)`**
  - Consolida últimas actividades desde `materials`, `studyPlans`, `ai_conversations`, `quizzes`, ordenadas por fecha.

---

## Hook de base de datos (`src/hooks/useDatabase.ts`)

Hook que orquesta llamadas a `DatabaseService` e impone verificación de autenticación.

- Estado y utilidades:
  - **`loading`**, **`error`**, **`clearError()`**.

- Materiales:
  - **`createMaterial(materialData)`**: Crea material asociado al usuario autenticado.
  - **`getUserMaterials()`**: Lista materiales del usuario actual.
  - **`deleteMaterialAndPlans(materialId)`**: Elimina material y planes asociados.

- Planes de estudio:
  - **`createStudyPlan(planData)`**: Si no llegan `selectedWeekDays`, intenta cargar desde `user_settings` y crea el plan.
  - **`getUserStudyPlans()`**: Lista planes del usuario actual.
  - **`updateStudyPlan(planId, updatedPlan)`**: Actualiza plan en Firestore.
  - **`updateTaskCompletion(planId, day, completed)`**: Marca tarea diaria como completada.
  - **`deleteStudyPlan(planId)`**: Elimina plan por id.

- Conversaciones IA:
  - **`createAIConversation({ title, messages })`**
  - **`addMessageToConversation(conversationId, message)`**
  - **`getUserAIConversations()`**
  - **`deleteAIConversation(conversationId)`**
  - **`updateConversationTitle(conversationId, title)`**

- Eventos:
  - **`createUserEvent(eventData)`**
  - **`getUserEvents()`**

- Quizzes:
  - **`getQuizzes()`**, **`getQuiz(quizId)`**, **`deleteQuiz(quizId)`**

- Configuración de disponibilidad (expuestos referenciando al servicio):
  - **`saveUserAvailability(userId, availability)`**
  - **`getUserAvailability(userId)`**

---

## Servicios de materiales y carpetas

- **`src/services/materials.ts`**
  - **`saveMaterialMetadata(metadata)`**: Guarda metadatos de material en `materials` (con `createdAt`).
  - **`getUserMaterials(userId, path)`**: Lista materiales del usuario filtrando por `path`.
  - **`moveMaterial(materialId, newPath)`**: Actualiza el campo `path` del material.
  - **`updateMaterialTags(materialId, newTags)`**: Actualiza etiquetas.
  - **`deleteMaterial(materialId)`**: Elimina documento del material.

- **`src/services/folders.ts`**
  - **`createFolder(folder)`**: Crea carpeta en `folders` (con `createdAt`).
  - **`getFolders(userId, path)`**: Lista carpetas del usuario en un `path`.
  - **`renameFolder(folderId, newName)`**: Renombra carpeta.
  - **`deleteFolder(folderId)`**: Elimina carpeta.

---

## Servicios de IA

- **`src/services/aiChatService.ts`**
  - Tipos: **`AskGeminiBotParams`**, **`AskGeminiBotResponse`**.
  - **`askGeminiBot({ userId, material, topic, question })`**: POST hacia función Cloud `askGeminiBot` (endpoint configurable por `VITE_GEMINI_ENDPOINT_BOT`). Devuelve `{ answer, source }` o lanza error con mensaje del backend.

- **`src/services/chatbotService.ts`**
  - Tipos locales: `ChatbotMaterial`, `StudyPlan` (local).
  - **`getUserMaterialsAndTopics(userId)`**: Recorre `studyPlans` del usuario y obtiene `topics` de `generatedPlan`. Si no hay temas, intenta leer `extractedTopics` del material (`materials/{materialId}`). Devuelve arreglo de `{ materialId, materialName, topics }`.

---

## Procesamiento de PDF / extracción de texto

- **`src/services/PDFTextExtractor.ts`**
  - **`extractTextFromPDF(file: File)`**: Usa `pdfjs-dist` para extraer el texto concatenado de todas las páginas del PDF.

- **`src/services/PDFProcessor.ts`**
  - Tipos: **`ExtractedTopic`**, **`PDFProcessingResult`**.
  - Clase **`PDFProcessor`**:
    - **`processPDFTextWithGemini(text, subjectName)`**: Envía el texto del PDF a la función Cloud `processPdfTopics` (configurable por `VITE_PROCESS_PDF_ENDPOINT`) para obtener hasta 30 temas y un resumen. Tiene fallback a parser local si el backend retorna `raw_response`.
    - Métodos privados de soporte:
      - `parseGeminiResponse(geminiResult)` y `extractTopicsFromPlainText(geminiResult)` para tolerancia a formatos variables y fallback por texto plano.

---

## Contextos y hooks utilitarios

- **`src/context/PlannerContext.tsx`**
  - Tipo: **`PlannerContextType`** con `extractedTopics` y `setExtractedTopics`.
  - **`PlannerContext`**: React context.
  - **`usePlanner()`**: Hook para acceder al contexto; lanza error si se usa fuera del provider.

- **`src/context/ThemeContext.tsx`**
  - **`ThemeProvider`**: Provider que maneja tema `'light' | 'dark'`, persistiendo en `localStorage` y `data-theme` del `documentElement`.
  - **`useTheme()`**: Hook para consumir `{ theme, toggleTheme }`.

- **`src/hooks/useAuth.ts`**
  - **`useAuth()`**: Hook que retorna el contexto de autenticación (`AuthContext`); lanza error si no está dentro del provider.

---

## Tipos de planes de estudio (`src/types/studyPlan.ts`)

- **`Topic`**, **`StudyPlanGenerated`**, **`StudyPlan`**: Tipos de apoyo usados por componentes y servicios.

---

## Notas de uso

- Para operaciones de Firestore en UI, preferir el hook `useDatabase()` que ya gestiona `loading`, `error` y el `user` actual.
- Campos opcionales no deben enviarse como `undefined`; `DatabaseService` sanitiza estructuras antes de persistir.
- Los días de estudio pueden provenir de `user_settings` vía `getUserAvailability()` si no se pasan explícitamente al crear un plan.

---

## Próximas mejoras sugeridas

- Añadir paginación/limit a `getUserMaterials`, `getUserStudyPlans`.
- Añadir eliminación en cascada de archivos físicos en Storage cuando se borren materiales (actualmente pendiente en `deleteMaterial`).
- Centralizar tipos comunes (por ejemplo `Topic`) para evitar duplicación entre `DatabaseService` y `types/studyPlan`.
