# 🔥 Integración de Firestore con Autenticación Google

## 📋 Descripción

Este proyecto ahora tiene una integración completa entre **Google Authentication** y **Firestore Database**. Cuando un usuario se autentica con Google, automáticamente se crea/actualiza su perfil en Firestore, y puede crear materiales de estudio y planes de estudio.

## 🚀 Flujo de Funcionamiento

### 1. **Autenticación con Google**
```
Usuario hace login → Google Auth → Firebase Auth → Firestore
```

### 2. **Creación Automática de Usuario**
- Cuando el usuario se autentica, se ejecuta `DatabaseService.createOrUpdateUser()`
- Si es un usuario nuevo, se crea un documento en la colección `users`
- Si es un usuario existente, se actualiza su `lastLogin`

### 3. **Estructura de Datos en Firestore**

#### 👤 Colección: `users`
```json
{
  "uid": "google_user_id_123",
  "email": "usuario@gmail.com",
  "displayName": "Juan Pérez",
  "photoURL": "https://lh3.googleusercontent.com/...",
  "createdAt": "timestamp",
  "lastLogin": "timestamp"
}
```

#### 📂 Colección: `materials`
```json
{
  "id": "auto_generated_id",
  "userId": "google_user_id_123",
  "fileName": "Algebra_Basico.pdf",
  "storagePath": "users/google_user_id_123/materials/Algebra_Basico.pdf",
  "fileType": "pdf",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### 📘 Colección: `studyPlans`
```json
{
  "id": "auto_generated_id",
  "userId": "google_user_id_123",
  "materialId": "material_id_from_materials",
  "generatedPlan": {
    "title": "Plan de estudio: Álgebra",
    "durationDays": 10,
    "dailyTasks": [
      {
        "day": 1,
        "task": "Estudiar Álgebra - Día 1",
        "completed": false
      }
    ]
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### ⏱️ Subcolección: `stydu_session` (sesiones Pomodoro)

Cada usuario puede tener una subcolección con sus sesiones de estudio bajo su documento en `users/{uid}/stydu_session`.

Ejemplo de documento (cada pomodoro completado crea uno):
```json
{
  "type": "pomodoro",
  "duration": 25,
  "createdAt": "timestamp"
}
```

Dónde se escribe/lee en el código:
- Escritura: `DatabaseService.saveStudySession(userId, session)` → guarda en `users/{userId}/stydu_session` (ver `src/services/DatabaseService.ts`).
- Hook: `useDatabase().saveUserStudySession(session)` envuelve la llamada y usa `user.uid` (ver `src/hooks/useDatabase.ts`).
- Lectura: `DatabaseService.getUserStudySessions(userId, days)` y `useDatabase().getUserStudySessions(days)` se usan en el perfil (`src/components/Profile.tsx`) para obtener sesiones de los últimos 7/30 días y calcular métricas.

Nota sobre visualización:
- En la UI las horas se calculan como `cantidad_de_pomodoros * 25 minutos` y se muestran como `Xh Ym` para evitar confusiones con decimales (antes se mostraba en horas decimales, p. ej. `0.42h`).


## 🛠️ Servicios Implementados

### **DatabaseService** (`src/services/DatabaseService.ts`)
- `createOrUpdateUser()` - Crear/actualizar usuario en Firestore
- `createMaterial()` - Crear material de estudio
- `createStudyPlan()` - Crear plan de estudio
- `getUserMaterials()` - Obtener materiales del usuario
- `getUserStudyPlans()` - Obtener planes del usuario
- `updateTaskCompletion()` - Marcar tarea como completada
- `deleteMaterialAndPlans()` - Eliminar material y planes asociados

### **useDatabase Hook** (`src/hooks/useDatabase.ts`)
- Hook personalizado para usar la base de datos en componentes
- Maneja estados de loading y errores
- Proporciona funciones para todas las operaciones CRUD

## 🎯 Cómo Usar

### 1. **Autenticación Automática**
- El usuario hace login con Google
- Automáticamente se crea/actualiza su perfil en Firestore
- No requiere acción adicional del usuario

### 2. **Crear Material y Plan de Estudio**
- En el Dashboard, sube PDFs
- Completa nombre de materia y fecha de examen
- Haz clic en "Planificar"
- Se crean automáticamente:
  - Material en colección `materials`
  - Plan de estudio en colección `studyPlans`

### 3. **Ver Datos en Firebase Console**
- Ve a [Firebase Console](https://console.firebase.google.com)
- Selecciona tu proyecto
- Ve a "Firestore Database"
- Verás las colecciones: `users`, `materials`, `studyPlans`

## 📊 Ejemplo de Uso en el Dashboard

```typescript
// El Dashboard ahora usa la base de datos
const { createMaterial, createStudyPlan } = useDatabase();

const handlePlanify = async () => {
  // Crear material en Firestore
  const materialId = await createMaterial({
    fileName: "Algebra.pdf",
    storagePath: `users/${user.uid}/materials/Algebra.pdf`,
    fileType: "pdf"
  });

  // Crear plan de estudio en Firestore
  await createStudyPlan({
    materialId,
    title: "Plan de estudio: Álgebra",
    durationDays: 10,
    dailyTasks: [...]
  });
};
```

## 🔍 Monitoreo y Debugging

### **Consola del Navegador**
- Presiona F12 para ver logs detallados
- Cada operación de base de datos genera logs:
  ```
  👤 Creando/actualizando usuario en Firestore...
  ✅ Usuario creado/actualizado exitosamente
  📂 Creando material en Firestore...
  ✅ Material creado exitosamente con ID: ...
  📘 Creando plan de estudio en Firestore...
  ✅ Plan de estudio creado exitosamente con ID: ...
  ```

### **Indicadores Visuales**
- Botón "Planificar" muestra estado de loading
- Errores de base de datos se muestran en rojo
- Estado de conexión se muestra en verde

## ⚠️ Reglas de Seguridad Recomendadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios solo pueden acceder a sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Materiales solo para el usuario propietario
    match /materials/{materialId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Planes de estudio solo para el usuario propietario
    match /studyPlans/{planId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## 🎉 Beneficios de esta Integración

1. **Sincronización Automática**: Usuario se crea automáticamente al autenticarse
2. **Persistencia de Datos**: Materiales y planes se guardan en la nube
3. **Escalabilidad**: Firestore maneja el crecimiento automáticamente
4. **Seguridad**: Solo usuarios autenticados pueden acceder a sus datos
5. **Tiempo Real**: Los datos se sincronizan en tiempo real
6. **Backup Automático**: Google maneja el respaldo de datos

## 🚀 Próximos Pasos

- Implementar sincronización en tiempo real
- Agregar notificaciones para tareas pendientes
- Crear dashboard de progreso de estudio
- Implementar búsqueda y filtros avanzados
- Agregar estadísticas de estudio

---

**¡Tu aplicación ahora tiene una base de datos completa y funcional! 🎯**
