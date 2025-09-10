# Documentación de Base de Datos - FocuseAR

## Resumen General

FocuseAR utiliza Firebase Firestore como base de datos NoSQL para almacenar toda la información de usuarios, materiales y planes de estudio. La aplicación está diseñada para manejar datos de forma escalable y en tiempo real.

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
  id?: string;           // ID del documento (auto-generado)
  userId: string;        // ID del usuario propietario
  fileName: string;      // Nombre del archivo
  storagePath: string;   // Ruta en Firebase Storage
  fileType: string;      // Tipo de archivo (pdf, docx, etc.)
  createdAt: Timestamp;  // Fecha de creación
  updatedAt: Timestamp;  // Última actualización
}
```

**Ejemplo:**
```json
{
  "id": "material_001",
  "userId": "abc123xyz",
  "fileName": "Matemáticas_Capítulo_1.pdf",
  "storagePath": "materials/abc123xyz/matematicas_cap1.pdf",
  "fileType": "pdf",
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
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
  generatedPlan: {
    title: string;                    // Título del plan
    summary?: string;                 // Resumen del contenido
    durationDays: number;             // Duración en días
    examDate?: string;                // Fecha del examen
    selectedWeekDays?: number[];      // Días de la semana seleccionados
    topics?: string[];                // Lista de temas
    studyDates?: string[];            // Fechas de estudio generadas
    structuredPlan?: any;             // Plan estructurado de la IA
    dailyTasks: Array<{               // Tareas diarias
      day: number;
      task: string;
      completed?: boolean;
    }>;
  };
  createdAt: Timestamp;  // Fecha de creación
  updatedAt: Timestamp;  // Última actualización
}
```

**Ejemplo:**
```json
{
  "id": "plan_001",
  "userId": "abc123xyz",
  "materialId": "material_001",
  "generatedPlan": {
    "title": "Plan de Estudio - Matemáticas Capítulo 1",
    "summary": "Estudio de álgebra básica y ecuaciones lineales",
    "durationDays": 14,
    "examDate": "2024-02-01",
    "selectedWeekDays": [1, 3, 5],
    "topics": ["Álgebra", "Ecuaciones", "Gráficas"],
    "studyDates": ["2024-01-18", "2024-01-20", "2024-01-22"],
    "structuredPlan": { /* Objeto complejo con la estructura del plan */ },
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

## Operaciones CRUD

### Crear Datos

#### Crear Usuario
```typescript
// Automático al registrarse con Firebase Auth
await DatabaseService.createUser(userData);
```

#### Crear Material
```typescript
const materialData = {
  userId: user.uid,
  fileName: "documento.pdf",
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
    durationDays: 10,
    dailyTasks: [/* tareas */]
  }
};
const planId = await DatabaseService.createStudyPlan(planData);
```

### Leer Datos

#### Obtener Materiales del Usuario
```typescript
const materials = await DatabaseService.getUserMaterials(userId);
```

#### Obtener Planes de Estudio del Usuario
```typescript
const studyPlans = await DatabaseService.getUserStudyPlans(userId);
```

#### Obtener Plan Específico
```typescript
const plan = await DatabaseService.getStudyPlan(planId);
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

## Flujo de Datos en la Aplicación

### 1. Carga Inicial
```typescript
useEffect(() => {
  const loadUserData = async () => {
    // Cargar materiales del usuario
    const materials = await getUserMaterials();
    
    // Convertir a formato local
    const subjects = materials.map(material => ({
      id: material.id,
      name: material.fileName,
      // ... otros campos
    }));
    
    // Cargar planes de estudio
    const studyPlans = await getUserStudyPlans();
    
    // Actualizar estados locales
    setSubjects(subjects);
    setStudyPlans(convertedPlans);
  };
  
  loadUserData();
}, [user]);
```

### 2. Creación de Contenido
```typescript
// Al subir un PDF y generar plan
const handlePlanify = async () => {
  // 1. Crear material en Firebase
  const materialId = await createMaterial(materialData);
  
  // 2. Generar plan con IA
  const generatedPlan = await generateStudyPlan(content);
  
  // 3. Guardar plan en Firebase
  const planId = await createStudyPlan({
    materialId,
    generatedPlan
  });
  
  // 4. Actualizar estado local
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
  }
}
```

## Consideraciones de Rendimiento

### Indexación
- **materials**: Índice compuesto en `userId` + `createdAt`
- **studyPlans**: Índice compuesto en `userId` + `materialId`
- **studyPlans**: Índice compuesto en `userId` + `createdAt`

### Optimizaciones
1. **Paginación**: Para usuarios con muchos materiales
2. **Cache Local**: Los datos se mantienen en estado React
3. **Eliminación en Cascada**: Al eliminar material, se eliminan planes asociados
4. **Validación**: Verificación de permisos antes de operaciones

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

## Backup y Recuperación

- **Backup Automático**: Firebase realiza backups automáticos
- **Exportación**: Posible exportar datos usando Firebase Admin SDK
- **Recuperación**: Los datos eliminados pueden recuperarse dentro de las primeras 24 horas

## Monitoreo

- **Firebase Console**: Métricas de uso y rendimiento
- **Logs**: Todos los errores se registran en console
- **Analytics**: Seguimiento de operaciones CRUD

---

*Última actualización: Enero 2024*
*Versión: 1.0*
