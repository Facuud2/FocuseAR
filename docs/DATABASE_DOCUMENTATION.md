# Documentación de Base de Datos - FocuseAR

## Resumen General

FocuseAR utiliza Firebase Firestore como base de datos NoSQL para almacenar toda la información de usuarios, materiales, planes de estudio, conversaciones de IA, quizzes, eventos y configuraciones. La aplicación está diseñada para manejar datos de forma escalable y en tiempo real.

**Proyecto Firebase**: `proyecto-final-universitario`  
**Autenticación**: Google Auth  
**Base de datos**: Firestore  
**Storage**: Firebase Storage para archivos PDF



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
Almacena cuestionarios generados para evaluación de conocimientos.

**Estructura del documento:**
```typescript
interface Quiz {
  id?: string;
  questions: QuizQuestion[];
  subjectName: string;
  materialId: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}
```

**Ejemplo:**
```json
{
  "id": "quiz_001",
  "questions": [
    {
      "question": "¿Qué es un vector?",
      "options": ["Una magnitud escalar", "Una magnitud vectorial", "Un número", "Una función"],
      "correctAnswer": "Una magnitud vectorial"
    }
  ],
  "subjectName": "Matemáticas Avanzadas",
  "materialId": "material_001",
  "userId": "abc123xyz",
  "createdAt": "2024-01-15T15:00:00Z",
  "updatedAt": "2024-01-15T15:00:00Z"
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

### 8. Colección `folders`
Sistema de carpetas para organizar materiales (implementación futura).

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
    
    match /folders/{folderId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## Consideraciones de Rendimiento

### Indexación
- **materials**: Índice compuesto en `userId` + `createdAt`
- **studyPlans**: Índice compuesto en `userId` + `materialId`
- **studyPlans**: Índice compuesto en `userId` + `createdAt`
- **ai_conversations**: Índice compuesto en `userId` + `createdAt`
- **quizzes**: Índice compuesto en `userId` + `createdAt`
- **events**: Índice compuesto en `userId` + `start`

### Optimizaciones
1. **Paginación**: Para usuarios con muchos materiales (implementar con `limit()`)
2. **Cache Local**: Los datos se mantienen en estado React para acceso rápido
3. **Eliminación en Cascada**: Al eliminar material, se eliminan planes asociados automáticamente
4. **Validación**: Verificación de permisos antes de operaciones
5. **Normalización de Temas**: Los temas se normalizan automáticamente de string[] a Topic[]
6. **Sanitización**: Campos `undefined` se eliminan antes de persistir en Firestore
7. **Enriquecimiento**: Los planes incluyen automáticamente `subjectName` del material asociado

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

## Funciones Cloud Integradas

### 1. `geminiResponse`
- **URL**: `https://us-central1-proyecto-final-universitario.cloudfunctions.net/geminiResponse`
- **Propósito**: Genera planes de estudio estructurados usando Gemini AI
- **Input**: `{ text, examDate, selectedWeekDays, topics }`
- **Output**: Plan estructurado con días, tareas y recomendaciones

### 2. `processPdfTopics`
- **URL**: `https://us-central1-proyecto-final-universitario.cloudfunctions.net/processPdfTopics`
- **Propósito**: Extrae temas principales de texto de PDF usando IA
- **Input**: `{ text, subjectName }`
- **Output**: Lista de temas con descripción y orden

### 3. `askGeminiBot`
- **Propósito**: Chatbot IA para consultas sobre materiales de estudio
- **Input**: `{ userId, material, topic, question }`
- **Output**: `{ answer, source }`

## Integración con useDatabase Hook

El hook `useDatabase` proporciona una interfaz simplificada que:
- Maneja automáticamente la autenticación del usuario
- Gestiona estados de `loading` y `error`
- Proporciona funciones CRUD con validación
- Integra configuraciones de usuario automáticamente

```typescript
const {
  loading,
  error,
  createMaterial,
  createStudyPlan,
  getUserMaterials,
  getUserStudyPlans,
  updateStudyPlan,
  // ... más funciones
} = useDatabase();
```

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

### Futuras Expansiones
- Sistema de carpetas completamente implementado
- Notificaciones push para recordatorios de estudio
- Colaboración entre usuarios
- Analytics avanzados de progreso de estudio

---

*Última actualización: Octubre 2024*  
*Versión: 2.0*  
*Proyecto: proyecto-final-universitario*
