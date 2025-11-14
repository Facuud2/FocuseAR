# Documentación de Base de Datos - FocuseAR

## Resumen General

FocuseAR utiliza Firebase Firestore como base de datos NoSQL para almacenar toda la información de usuarios, materiales, planes de estudio, conversaciones de IA, quizzes, eventos, notas de usuario y configuraciones. La aplicación está diseñada para manejar datos de forma escalable y en tiempo real con soporte completo para funciones serverless.

**Proyecto Firebase**: `proyecto-final-universitario`  
**Autenticación**: Firebase Auth (Google, Email/Password)  
**Base de datos**: Firestore (NoSQL)  
**Storage**: Firebase Storage para archivos PDF  
**Functions**: Firebase Functions para procesamiento IA y operaciones complejas  
**IA Integration**: Google Gemini AI para análisis de contenido y generación de quizzes

## Estructura de Colecciones

### 1. Colección `users`
Almacena información básica de los usuarios registrados.

**Estructura del documento:**
```typescript
interface UserData {
  uid: string;           // ID único del usuario (Firebase Auth)
  email: string;         // Email del usuario
  displayName: string;   // Nombre para mostrar
  photoURL: string;      // URL de la foto de perfil
  createdAt: Timestamp;  // Fecha de creación de la cuenta
  lastLogin: Timestamp;  // Último inicio de sesión
}
```

**Ejemplo:**
```json
{
  "uid": "abc123xyz",
  "email": "usuario@ejemplo.com",
  "displayName": "Juan Pérez",
  "photoURL": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastLogin": "2024-01-20T14:45:00Z"
}
```

### 2. Colección `materials`
Contiene los materiales de estudio (PDFs, documentos) subidos por los usuarios.

**Estructura del documento:**
```typescript
interface Material {
  id?: string;                    // ID del documento (auto-generado)
  userId: string;                 // ID del usuario propietario
  fileName: string;               // Nombre del archivo original
  subjectName: string;            // Nombre de la materia (ingresado por usuario)
  examDate?: string;              // Fecha del examen
  color?: string;                 // Color asignado a la materia
  importantDates?: Array<{        // Fechas importantes
    name: string;
    date: string;
    type: 'exam' | 'tp' | 'other';
  }>;
  extractedTopics?: Array<{       // Temas extraídos por IA
    id: string;
    name?: string;
    description?: string;
    order?: number;
  }>;
  extractedTopicsUpdatedAt?: Timestamp;  // Última actualización de temas IA
  extractedTopicsVersion?: number;       // Versión de extracción de temas
  storagePath: string;            // Ruta en Firebase Storage
  fileType: string;               // Tipo de archivo (pdf, docx, etc.)
  createdAt: Timestamp;           // Fecha de creación
  updatedAt: Timestamp;           // Última actualización
}
```

**Ejemplo:**
```json
{
  "id": "material_001",
  "userId": "abc123xyz",
  "fileName": "Matemáticas_Capítulo_1.pdf",
  "subjectName": "Matemáticas Avanzadas",
  "examDate": "2024-02-15",
  "color": "#4285F4",
  "importantDates": [
    {
      "name": "Examen Parcial",
      "date": "2024-02-01",
      "type": "exam"
    }
  ],
  "extractedTopics": [
    {
      "id": "tema_1",
      "name": "Álgebra Lineal",
      "description": "Conceptos básicos de vectores y matrices",
      "order": 1
    }
  ],
  "extractedTopicsUpdatedAt": "2024-01-15T11:30:00Z",
  "extractedTopicsVersion": 1,
  "storagePath": "materials/abc123xyz/matematicas_cap1.pdf",
  "fileType": "pdf",
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

### 3. Colección `studyPlans`
Almacena los planes de estudio generados por la IA para cada material.

**Estructura del documento:**
```typescript
interface StudyPlan {
  id?: string;           // ID del documento (auto-generado)
  userId: string;        // ID del usuario propietario
  materialId: string;    // ID del material asociado
  subjectName?: string;  // Nombre de la materia (enriquecido desde material)
  generatedPlan: {
    title: string;                    // Título del plan
    summary?: string;                 // Resumen del contenido
    durationDays: number;             // Duración en días
    examDate?: string;                // Fecha del examen
    selectedWeekDays?: number[];      // Días de la semana seleccionados (0=domingo, 1=lunes...)
    eventName?: string;               // Nombre del evento asociado
    topics?: (string | Topic)[];      // Lista de temas (strings o objetos Topic)
    studyDates?: string[];            // Fechas de estudio generadas automáticamente
    subjectColor?: string;            // Color de la materia
    structuredPlan?: {                // Plan estructurado completo de la IA
      title: string;
      summary: string;
      days: Array<{
        date: string;
        dayNumber: number;
        topics: Array<{
          name: string;
          summary: string;
          estimatedTime: string;
        }>;
        totalTime: string;
        recommendations: string;
        completed: boolean;
      }>;
      finalRecommendations: string;
    } | null;
    dailyTasks: Array<{               // Tareas diarias
      day: number;
      task: string;
      completed?: boolean;
    }>;
  };
  createdAt: Timestamp;  // Fecha de creación
  updatedAt: Timestamp;  // Última actualización
}

interface Topic {
  id: string;
  title: string;
  description?: string;
  order?: number;
}
```

**Ejemplo:**
```json
{
  "id": "plan_001",
  "userId": "abc123xyz",
  "materialId": "material_001",
  "subjectName": "Matemáticas Avanzadas",
  "generatedPlan": {
    "title": "Plan de Estudio - Matemáticas Capítulo 1",
    "summary": "Estudio de álgebra básica y ecuaciones lineales",
    "durationDays": 14,
    "examDate": "2024-02-15",
    "selectedWeekDays": [1, 3, 5],
    "eventName": "Examen Final Matemáticas",
    "topics": [
      {
        "id": "tema_1",
        "title": "Álgebra Lineal",
        "description": "Vectores y matrices",
        "order": 1
      }
    ],
    "studyDates": ["2024-01-18", "2024-01-20", "2024-01-22"],
    "subjectColor": "#4285F4",
    "structuredPlan": {
      "title": "Plan Estructurado IA",
      "summary": "Plan detallado generado por IA",
      "days": [
        {
          "date": "2024-01-18",
          "dayNumber": 1,
          "topics": [
            {
              "name": "Introducción al Álgebra",
              "summary": "Conceptos fundamentales",
              "estimatedTime": "2 horas"
            }
          ],
          "totalTime": "2 horas",
          "recommendations": "Practicar ejercicios básicos",
          "completed": false
        }
      ],
      "finalRecommendations": "Revisar todos los temas antes del examen"
    },
    "dailyTasks": [
      {
        "day": 1,
        "task": "Revisar conceptos básicos de álgebra",
        "completed": false
      }
    ]
  },
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

### 4. Colección `user_settings`
Almacena configuraciones específicas del usuario, como disponibilidad semanal para el planificador IA.

**Estructura del documento:**
```typescript
interface UserSettings {
  availability: Record<string, boolean>;  // Días disponibles (lunes: true, martes: false...)
  selectedWeekDays: number[];             // Índices de días (0=domingo, 1=lunes...)
  updatedAt: Timestamp;
}
```

**Ejemplo:**
```json
{
  "availability": {
    "lunes": true,
    "martes": false,
    "miércoles": true,
    "jueves": true,
    "viernes": false,
    "sábado": true,
    "domingo": false
  },
  "selectedWeekDays": [1, 3, 4, 6],
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### 5. Colección `ai_conversations`
Almacena conversaciones del chatbot IA para historial y reutilización.

**Estructura del documento:**
```typescript
interface AIConversation {
  id?: string;
  userId: string;
  title?: string;
  messages: AIConversationMessage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface AIConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
  messageType?: 'text' | 'system' | 'error';
}
```

**Ejemplo:**
```json
{
  "id": "conv_001",
  "userId": "abc123xyz",
  "title": "Consulta sobre Álgebra Lineal",
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "¿Qué son los vectores?",
      "timestamp": "2024-01-15T14:00:00Z",
      "messageType": "text"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "Los vectores son entidades matemáticas...",
      "timestamp": "2024-01-15T14:00:30Z",
      "messageType": "text"
    }
  ],
  "createdAt": "2024-01-15T14:00:00Z",
  "updatedAt": "2024-01-15T14:00:30Z"
}
```

### 6. Colección `quizzes`
Almacena cuestionarios generados automáticamente por IA para evaluación de conocimientos.

**Estructura del documento:**
```typescript
interface Quiz {
  id?: string;
  materialId: string;
  userId: string;
  questions: ProcessedQuizQuestion[];
  createdAt: Timestamp;
  completedAt?: Timestamp;
  score?: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface ProcessedQuizQuestion {
  id: string; // UUID generado
  questionText: string;
  options: string[]; // Exactamente 4 opciones
  correctAnswerIndex: number; // Índice de la respuesta correcta (0-3)
  userSelectedIndex?: number | null;
  isCorrect?: boolean | null;
}

interface RawQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}
```

**Ejemplo:**
```json
{
  "id": "quiz_001",
  "materialId": "material_001",
  "userId": "abc123xyz",
  "questions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "questionText": "¿Qué es un vector en álgebra lineal?",
      "options": [
        "Una magnitud escalar",
        "Una magnitud vectorial con dirección y sentido",
        "Un número complejo",
        "Una función matemática"
      ],
      "correctAnswerIndex": 1,
      "userSelectedIndex": null,
      "isCorrect": null
    }
  ],
  "createdAt": "2024-01-15T15:00:00Z",
  "completedAt": null,
  "score": null,
  "totalQuestions": 10,
  "correctAnswers": 0
}
```

### 7. Colección `events`
Almacena eventos personalizados del usuario (exámenes, tareas, recordatorios).

**Estructura del documento:**
```typescript
interface UserEvent {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  type: 'study' | 'exam' | 'task' | 'reminder';
  start: string | Date;
  end?: string | Date;
  allDay?: boolean;
  color?: string;
  time?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Ejemplo:**
```json
{
  "id": "event_001",
  "userId": "abc123xyz",
  "title": "Examen Final Matemáticas",
  "description": "Examen final del curso de matemáticas avanzadas",
  "type": "exam",
  "start": "2024-02-15T09:00:00Z",
  "end": "2024-02-15T12:00:00Z",
  "allDay": false,
  "color": "#FF5722",
  "time": "09:00",
  "createdAt": "2024-01-15T16:00:00Z",
  "updatedAt": "2024-01-15T16:00:00Z"
}
```

### 8. Colección `user_notes`
Almacena notas y tareas personales del usuario en el componente de anotador.

**Estructura del documento:**
```typescript
interface UserNotesDocument {
  notes: UserNote[];
  updatedAt: Timestamp;
}

interface UserNote {
  id: number | string;
  text: string;
  completed: boolean;
  type: 'note' | 'task';
}
```

**Ejemplo:**
```json
{
  "notes": [
    {
      "id": 1642123456789,
      "text": "Revisar capítulo 3 de matemáticas",
      "completed": false,
      "type": "task"
    },
    {
      "id": 1642123456790,
      "text": "Recordar traer calculadora al examen",
      "completed": true,
      "type": "note"
    }
  ],
  "updatedAt": "2024-01-15T16:30:00Z"
}
```

### 9. Colección `ai_cache`
Cache de respuestas de IA para optimización y reducción de costos.

**Estructura del documento:**
```typescript
interface AICacheEntry {
  userId: string;
  material?: string;
  topic?: string;
  question: string;
  normalizedQuestion: string;
  answer: string;
  cachedAt: string; // ISO timestamp
}
```

**Ejemplo:**
```json
{
  "userId": "abc123xyz",
  "material": "Matemáticas Avanzadas",
  "topic": "Álgebra Lineal",
  "question": "¿Qué son los vectores?",
  "normalizedQuestion": "que son los vectores",
  "answer": "Los vectores son entidades matemáticas que representan magnitudes que tienen dirección y sentido.",
  "cachedAt": "2024-01-15T16:45:00Z"
}
```

### 10. Colección `folders`
Sistema de carpetas para organizar materiales (implementación futura expandida).

**Estructura del documento:**
```typescript
interface Folder {
  id?: string;
  userId: string;
  name: string;
  path: string;
  createdAt: Timestamp;
}
```

## Operaciones CRUD

### Crear Datos

#### Crear Usuario
```typescript
// Automático al registrarse con Firebase Auth
await DatabaseService.createOrUpdateUser(user);
```

#### Crear Material
```typescript
const materialData = {
  userId: user.uid,
  fileName: "documento.pdf",
  subjectName: "Matemáticas Avanzadas",
  examDate: "2024-02-15",
  color: "#4285F4",
  importantDates: [
    { name: "Examen Parcial", date: "2024-02-01", type: "exam" }
  ],
  extractedTopics: [
    { id: "tema_1", name: "Álgebra", description: "Conceptos básicos", order: 1 }
  ],
  storagePath: "materials/user123/documento.pdf",
  fileType: "pdf"
};
const materialId = await DatabaseService.createMaterial(materialData);
```

#### Crear Plan de Estudio
```typescript
const planData = {
  userId: user.uid,
  materialId: "material_001",
  generatedPlan: {
    title: "Mi Plan de Estudio",
    summary: "Plan detallado de estudio",
    durationDays: 10,
    examDate: "2024-02-15",
    selectedWeekDays: [1, 3, 5],
    topics: [
      { id: "tema_1", title: "Álgebra", description: "Conceptos básicos", order: 1 }
    ],
    studyDates: ["2024-01-18", "2024-01-20"],
    subjectColor: "#4285F4",
    structuredPlan: { /* Plan estructurado de IA */ },
    dailyTasks: [
      { day: 1, task: "Revisar álgebra básica", completed: false }
    ]
  }
};
const planId = await DatabaseService.createStudyPlan(planData);
```

#### Guardar Disponibilidad del Usuario
```typescript
const availability = {
  lunes: true,
  martes: false,
  miércoles: true,
  jueves: true,
  viernes: false,
  sábado: true,
  domingo: false
};
await DatabaseService.saveUserAvailability(userId, availability);
```

#### Crear Conversación IA
```typescript
const conversationData = {
  userId: user.uid,
  title: "Consulta sobre Matemáticas",
  messages: [
    {
      role: "user",
      content: "¿Qué son los vectores?",
      messageType: "text"
    }
  ]
};
const conversationId = await DatabaseService.createAIConversation(conversationData);
```

#### Crear Evento
```typescript
const eventData = {
  userId: user.uid,
  title: "Examen Final",
  description: "Examen final de matemáticas",
  type: "exam",
  start: "2024-02-15T09:00:00Z",
  end: "2024-02-15T12:00:00Z",
  color: "#FF5722"
};
const eventId = await DatabaseService.createUserEvent(eventData);
```

#### Crear Quiz Automático (vía Function)
```typescript
// Desde el frontend, tras subir un material
const handleGenerateQuiz = async (subject) => {
  const response = await fetch(`${GENERATE_QUIZ_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      materialId: subject.id, 
      userId: user.uid 
    })
  });
  
  const result = await response.json();
  // result: { success: true, quizId: "quiz_xyz", totalQuestions: 10 }
  navigate(`/quiz/${result.quizId}`);
};
```

#### Crear Notas de Usuario
```typescript
const notes = [
  { id: Date.now(), text: "Estudiar capítulo 3", completed: false, type: "task" },
  { id: Date.now() + 1, text: "Revisar ejercicios", completed: true, type: "note" }
];
await DatabaseService.saveUserNotes(userId, notes);
```

### Leer Datos

#### Obtener Materiales del Usuario
```typescript
const materials = await DatabaseService.getUserMaterials(userId);
```

#### Obtener Planes de Estudio del Usuario
```typescript
const studyPlans = await DatabaseService.getUserStudyPlans(userId);
// Los planes incluyen automáticamente el subjectName del material asociado
```

#### Obtener Material por ID
```typescript
const material = await DatabaseService.getMaterialById(materialId);
```

#### Obtener Disponibilidad del Usuario
```typescript
const settings = await DatabaseService.getUserAvailability(userId);
// Retorna { availability: {...}, selectedWeekDays: [...] }
```

#### Obtener Conversaciones IA
```typescript
const conversations = await DatabaseService.getUserAIConversations(userId);
```

#### Obtener Eventos del Usuario
```typescript
const events = await DatabaseService.getUserEvents(userId);
```

#### Obtener Quizzes del Usuario
```typescript
const quizzes = await DatabaseService.getQuizzes(userId);
```

#### Obtener Quiz por ID
```typescript
const quiz = await DatabaseService.getQuiz(quizId);
```

#### Obtener Actividades Recientes
```typescript
const activities = await DatabaseService.getRecentActivities(userId, 10);
// Consolida actividades de materiales, planes, conversaciones y quizzes
```

#### Obtener Notas del Usuario
```typescript
const userNotes = await DatabaseService.getUserNotes(userId);
// userNotes: UserNote[] - array de notas del usuario
```

### Actualizar Datos

#### Actualizar Progreso de Tarea
```typescript
await DatabaseService.updateTaskCompletion(planId, dayNumber, completed);
```

#### Actualizar Plan de Estudio
```typescript
await DatabaseService.updateStudyPlan(planId, updatedData);
```

#### Agregar Mensaje a Conversación IA
```typescript
const message = {
  role: "assistant",
  content: "Respuesta de la IA...",
  messageType: "text"
};
await DatabaseService.addMessageToConversation(conversationId, message);
```

#### Actualizar Título de Conversación
```typescript
await DatabaseService.updateConversationTitle(conversationId, "Nuevo Título");
```

### Eliminar Datos

#### Eliminar Plan de Estudio Individual
```typescript
await DatabaseService.deleteStudyPlan(planId);
```

#### Eliminar Material y Planes Asociados
```typescript
// Elimina el material y TODOS sus planes de estudio
await DatabaseService.deleteMaterialAndPlans(materialId);
```

#### Eliminar Conversación IA
```typescript
await DatabaseService.deleteAIConversation(conversationId);
```

#### Eliminar Quiz
```typescript
await DatabaseService.deleteQuiz(quizId);
```

## Flujo de Datos en la Aplicación

### 1. Carga Inicial
```typescript
useEffect(() => {
  const loadUserData = async () => {
    // Cargar materiales del usuario
    const materials = await getUserMaterials();
    
    // Convertir a formato local preservando subjectName
    const subjects = materials.map(material => ({
      id: material.id,
      name: material.subjectName || material.fileName, // Usar subjectName primero
      fileName: material.fileName,
      examDate: material.examDate,
      color: material.color,
      importantDates: material.importantDates,
      extractedTopics: material.extractedTopics
    }));
    
    // Cargar planes de estudio (incluyen subjectName automáticamente)
    const studyPlans = await getUserStudyPlans();
    
    // Cargar configuración de disponibilidad
    const availability = await DatabaseService.getUserAvailability(user.uid);
    
    // Cargar eventos del usuario
    const events = await getUserEvents();
    
    // Actualizar estados locales
    setSubjects(subjects);
    setStudyPlans(studyPlans);
    setAvailability(availability?.availability || {});
    setEvents(events);
  };
  
  loadUserData();
}, [user]);
```

### 2. Creación de Contenido
```typescript
// Al subir un PDF y generar plan
const handlePlanify = async () => {
  // 1. Extraer texto del PDF
  const extractedText = await extractTextFromPDF(file);
  
  // 2. Procesar con IA para extraer temas
  const { topics } = await PDFProcessor.processPDFTextWithGemini(
    extractedText, 
    subjectName
  );
  
  // 3. Crear material en Firebase con temas extraídos
  const materialId = await createMaterial({
    fileName: file.name,
    subjectName: subjectName,
    examDate: examDate,
    color: selectedColor,
    extractedTopics: topics,
    storagePath: storagePath,
    fileType: file.type
  });
  
  // 4. Generar plan con IA usando función Cloud
  const response = await fetch(geminiEndpoint, {
    method: 'POST',
    body: JSON.stringify({
      text: extractedText,
      examDate: examDate,
      selectedWeekDays: selectedWeekDays,
      topics: topics.map(t => t.name)
    })
  });
  const generatedPlan = await response.json();
  
  // 5. Guardar plan en Firebase
  const planId = await createStudyPlan({
    materialId,
    generatedPlan: {
      ...generatedPlan,
      subjectColor: selectedColor,
      topics: topics
    }
  });
  
  // 6. Actualizar estado local
  setStudyPlans(prev => [...prev, newPlan]);
};
```

### 3. Eliminación con Persistencia
```typescript
const deletePlan = async (planId) => {
  try {
    // 1. Buscar plan en Firebase
    const firebasePlans = await getUserStudyPlans();
    const firebasePlan = firebasePlans.find(p => p.id === planId);
    
    // 2. Eliminar de Firebase PRIMERO
    if (firebasePlan) {
      await deleteStudyPlan(firebasePlan.id);
    }
    
    // 3. Actualizar estado local
    setStudyPlans(prev => prev.filter(p => p.id !== planId));
    
  } catch (error) {
    console.error('Error al eliminar:', error);
  }
};
```

## Reglas de Seguridad Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Los usuarios solo pueden acceder a sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /materials/{materialId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /studyPlans/{planId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /user_settings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /ai_conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /quizzes/{quizId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /events/{eventId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /user_notes/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /ai_cache/{cacheId} {
      allow read, write: if request.auth != null;
      // Cache es compartido pero controlado por las functions
    }
    
    match /folders/{folderId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## Consideraciones de Rendimiento

### Indexación Automática
- **materials**: Índice compuesto en `userId` + `createdAt`
- **studyPlans**: Índice compuesto en `userId` + `materialId`
- **studyPlans**: Índice compuesto en `userId` + `createdAt`
- **ai_conversations**: Índice compuesto en `userId` + `createdAt`
- **quizzes**: Índice compuesto en `userId` + `createdAt`
- **events**: Índice compuesto en `userId` + `start`
- **user_notes**: Índice simple en `userId` (documento por usuario)
- **ai_cache**: Índices compuestos para optimización de búsqueda de cache

### Optimizaciones Implementadas
1. **Cache de IA**: Las respuestas de Gemini AI se almacenan para reutilización
2. **Paginación**: Para usuarios con muchos materiales (implementar con `limit()`)
3. **Cache Local**: Los datos se mantienen en estado React para acceso rápido
4. **Eliminación en Cascada**: Al eliminar material, se eliminan planes asociados automáticamente
5. **Validación**: Verificación de permisos antes de operaciones
6. **Normalización de Temas**: Los temas se normalizan automáticamente de string[] a Topic[]
7. **Sanitización**: Campos `undefined` se eliminan antes de persistir en Firestore
8. **Enriquecimiento**: Los planes incluyen automáticamente `subjectName` del material asociado
9. **Debounced Saves**: Las notas se guardan con retraso para reducir writes a Firestore
10. **Generación Serverless**: Los quizzes se generan vía Functions para mejor rendimiento

## Manejo de Errores

```typescript
try {
  await DatabaseService.createMaterial(data);
} catch (error) {
  if (error.code === 'permission-denied') {
    console.error('Sin permisos para crear material');
  } else if (error.code === 'unavailable') {
    console.error('Servicio no disponible');
  } else {
    console.error('Error desconocido:', error);
  }
}
```

## Firebase Functions Integradas

### 1. Funciones de Procesamiento IA

#### `askGeminiBot`
- **URL**: `https://us-central1-proyecto-final-universitario.cloudfunctions.net/askGeminiBot`
- **Propósito**: Chatbot IA para responder consultas sobre materiales de estudio
- **Input**: `{ userId, material, topic, question }`
- **Output**: `{ response, context: { material, topic }, source: 'gemini-bot' }`
- **Features**: Cache de respuestas, normalización de preguntas, reintentos automáticos
- **Cache**: Las respuestas se almacenan en colección `ai_cache` para optimización

#### `generateStudyContent`
- **Propósito**: Genera contenido de estudio estructurado usando IA
- **Input**: Material y parámetros de configuración
- **Output**: Contenido educativo personalizado

#### `processPdfTopics`
- **URL**: `https://us-central1-proyecto-final-universitario.cloudfunctions.net/processPdfTopics`
- **Propósito**: Extrae temas principales de texto de PDF usando Gemini AI
- **Input**: `{ text, subjectName }`
- **Output**: `{ parsed: { topics: [...], summary: "..." }, source: 'gemini' }`
- **Features**: Análisis inteligente de contenido, estructura JSON confiable

#### `generateQuizFromMaterial`
- **URL**: `https://us-central1-proyecto-final-universitario.cloudfunctions.net/generateQuizFromMaterial`
- **Propósito**: Genera quizzes automáticamente basados en los temas de un material
- **Input**: `{ materialId, userId }`
- **Output**: `{ success: true, quizId, totalQuestions, message }`
- **Features**: 
  - Generación de exactamente 10 preguntas de múltiple opción
  - 4 opciones por pregunta con una sola respuesta correcta
  - Validación automática de formato JSON
  - Integración directa con colección `quizzes`

### 2. Funciones de Planificación

#### `generateStudyPlan`
- **Propósito**: Crea planes de estudio personalizados usando IA
- **Input**: Material, fechas de examen, disponibilidad del usuario
- **Output**: Plan estructurado con cronograma detallado

### 3. Funciones de Gestión de Carpetas

#### `createFolder`
- **Propósito**: Crear nuevas carpetas en el sistema de organización
- **Input**: `{ name, path, userId }`
- **Output**: ID de carpeta creada

#### `renameFolder`
- **Propósito**: Renombrar carpetas existentes
- **Input**: `{ folderId, newName }`
- **Output**: Confirmación de actualización

#### `deleteFolder`
- **Propósito**: Eliminar carpetas y reorganizar contenido
- **Input**: `{ folderId }`
- **Output**: Confirmación de eliminación

### 4. Configuración CORS y Seguridad

Todas las functions implementan:
- **CORS Headers**: Configuración específica para `https://focuse-ar.vercel.app`
- **Preflight Handling**: Manejo automático de requests OPTIONS
- **Error Handling**: Respuestas estructuradas con códigos HTTP apropiados
- **Environment Detection**: Desarrollo vs producción automático
- **Rate Limiting**: Control de abuso implementado por función

```typescript
// Configuración CORS unificada
const allowedOrigins = [
  'https://focuse-ar.vercel.app',
  'https://focuse-ar-git-main.vercel.app',
  ...(isDevelopment ? ['http://localhost:3000', 'http://localhost:5173'] : [])
];
```

## Integración con useDatabase Hook

El hook `useDatabase` proporciona una interfaz simplificada que:
- Maneja automáticamente la autenticación del usuario
- Gestiona estados de `loading` y `error`
- Proporciona funciones CRUD con validación
- Integra configuraciones de usuario automáticamente
- Incluye funciones para notas de usuario (`saveUserNotes`, `getUserNotes`)

```typescript
const {
  loading,
  error,
  createMaterial,
  createStudyPlan,
  getUserMaterials,
  getUserStudyPlans,
  updateStudyPlan,
  saveUserNotes,      // Nueva función para notas
  getUserNotes,       // Nueva función para notas
  // ... más funciones
} = useDatabase();
```

## Arquitectura Serverless y Funciones Cloud

### Flujo de Procesamiento IA
1. **Cliente** → Sube PDF y metadatos
2. **processPdfTopics Function** → Extrae temas con Gemini AI
3. **DatabaseService** → Almacena material con temas extraídos
4. **generateQuizFromMaterial Function** → Genera quiz basado en temas
5. **askGeminiBot Function** → Responde consultas específicas con cache

### Beneficios de la Arquitectura
- **Escalabilidad**: Functions se escalan automáticamente según demanda
- **Costo**: Solo se paga por uso real de IA y procesamiento
- **Seguridad**: Lógica sensible ejecuta en servidor, no en cliente
- **Cache**: Respuestas de IA se reutilizan para reducir costos
- **CORS**: Configuración centralizada y segura para producción

## Backup y Recuperación

- **Backup Automático**: Firebase realiza backups automáticos diarios
- **Exportación**: Posible exportar datos usando Firebase Admin SDK
- **Recuperación**: Los datos eliminados pueden recuperarse dentro de las primeras 24 horas
- **Versionado**: Los temas extraídos incluyen `extractedTopicsVersion` para control de cambios

## Monitoreo y Analytics

- **Firebase Console**: Métricas de uso y rendimiento en tiempo real
- **Logs Estructurados**: Todos los errores se registran con contexto
- **Analytics de Uso**: Seguimiento de operaciones CRUD y patrones de uso
- **Actividades Recientes**: Función `getRecentActivities()` consolida acciones del usuario

## Consideraciones de Migración

### Compatibilidad Hacia Atrás
- Los materiales antiguos sin `subjectName` usan `fileName` como fallback
- Los temas pueden ser strings o objetos Topic (se normalizan automáticamente)
- Los planes antiguos se enriquecen con `subjectName` al cargar
- Las notas migran automáticamente de localStorage a Firestore
- Los quizzes antiguos se actualizan al nuevo formato con UUIDs

### Futuras Expansiones
- Sistema de carpetas completamente implementado con operaciones CRUD
- Notificaciones push para recordatorios de estudio
- Colaboración entre usuarios en materiales compartidos
- Analytics avanzados de progreso de estudio con métricas detalladas
- Integración con calendarios externos (Google Calendar, Outlook)
- Sistema de recompensas y gamificación expandido
- Soporte para más formatos de archivo (DOCX, PPT, videos)
- IA conversacional más avanzada con memoria de contexto
- Sistema de tutores virtuales personalizados

### Monitoreo y Observabilidad
- **Firebase Console**: Métricas de uso y rendimiento en tiempo real
- **Functions Logs**: Monitoreo de ejecución de funciones serverless
- **Error Tracking**: Logs estructurados con contexto para debugging
- **Usage Analytics**: Seguimiento de operaciones CRUD y patrones de uso
- **AI Costs**: Monitoreo de costos de Gemini AI y optimización de cache
- **Performance**: Métricas de latencia de base de datos y functions

---

*Última actualización: Noviembre 2024*  
*Versión: 3.0*  
*Proyecto: proyecto-final-universitario*  
*Arquitectura: Firebase + Firestore + Functions + Gemini AI*  
*Frontend: React + TypeScript desplegado en Vercel*
