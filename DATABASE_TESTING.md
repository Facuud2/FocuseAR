# 🧪 Guía de Pruebas de Base de Datos Firebase

## 📋 Descripción

Este proyecto incluye un sistema completo de pruebas para verificar que la base de datos **Firestore** de Firebase funcione correctamente.

## 🚀 Cómo Usar

### 1. Acceso al Probador

El probador está integrado en el Dashboard de la aplicación. Una vez que inicies el proyecto:

1. Ve al Dashboard
2. Desplázate hacia abajo hasta encontrar la sección "🧪 Probador de Base de Datos Firebase"
3. Selecciona el tipo de base de datos que quieres probar

### 2. Base de Datos Utilizada

#### 🔥 Firestore Database
- **Ventajas:** Consultas complejas, escalabilidad, mejor para aplicaciones grandes
- **Estructura:** Colecciones y documentos
- **Uso:** Base de datos principal del proyecto

## 📊 Datos de Prueba

El probador crea automáticamente:

### 👤 Usuario de Prueba
```json
{
  "uid": "abc123",
  "email": "usuario@email.com",
  "displayName": "Juan Pérez",
  "photoURL": "https://example.com/foto.png",
  "createdAt": "timestamp",
  "lastLogin": "timestamp"
}
```

### 📂 Material de Prueba
```json
{
  "userId": "abc123",
  "fileName": "Algebra_Basico.pdf",
  "storagePath": "users/abc123/materials/Algebra_Basico.pdf",
  "fileType": "pdf",
  "createdAt": "timestamp"
}
```

### 📘 Plan de Estudio de Prueba
```json
{
  "userId": "abc123",
  "materialId": "auto-generated-id",
  "generatedPlan": {
    "title": "Plan de estudio Álgebra",
    "durationDays": 10,
    "dailyTasks": [
      { "day": 1, "task": "Leer capítulo 1 y hacer ejercicios" },
      { "day": 2, "task": "Repaso y práctica adicional" },
      { "day": 3, "task": "Resolver problemas del capítulo 1" }
    ]
  },
  "createdAt": "timestamp"
}
```

## 🛠️ Funcionalidades

### ✅ Ejecutar Pruebas
- Crea todos los datos de prueba
- Verifica que se guarden correctamente
- Muestra resultados en la interfaz
- Registra logs detallados en la consola

### 🧹 Limpiar Datos
- Elimina los datos de prueba
- Útil para mantener la base de datos limpia
- Evita conflictos en futuras pruebas

## 🔍 Monitoreo y Debugging

### Consola del Navegador
1. Presiona `F12` para abrir las herramientas de desarrollador
2. Ve a la pestaña "Console"
3. Ejecuta las pruebas desde la interfaz
4. Observa los logs detallados de cada operación

### Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a "Firestore Database"
4. Verifica que los datos se crearon correctamente

## ⚠️ Solución de Problemas

### Errores Comunes

#### 1. Error de Permisos
```
❌ Error: Missing or insufficient permissions
```
**Solución:** Revisa las reglas de seguridad en Firebase Console

#### 2. Error de Configuración
```
❌ Error: Firebase: Error (auth/invalid-api-key)
```
**Solución:** Verifica que las variables de entorno estén configuradas correctamente

#### 3. Error de Red
```
❌ Error: Firebase: Error (app/no-app)
```
**Solución:** Asegúrate de que Firebase esté inicializado correctamente

### Reglas de Seguridad Recomendadas

#### Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura para usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🎯 Casos de Uso

### 1. Desarrollo Local
- Prueba la conectividad con Firebase
- Verifica la estructura de datos
- Valida las operaciones CRUD

### 2. Testing
- Verifica que las funciones de base de datos funcionen
- Prueba diferentes tipos de datos
- Valida el manejo de errores

### 3. Demostración
- Muestra la funcionalidad a clientes
- Prueba la aplicación en diferentes entornos
- Valida la integración completa

## 📚 Recursos Adicionales

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Guía de Firestore](https://firebase.google.com/docs/firestore)
- [Reglas de Seguridad](https://firebase.google.com/docs/rules)

## 🤝 Contribución

Si encuentras problemas o quieres mejorar el probador:

1. Revisa los logs de la consola
2. Verifica la configuración de Firebase
3. Consulta la documentación oficial
4. Reporta el problema con detalles específicos

---

**¡Disfruta probando tu base de datos Firebase! 🎉**
