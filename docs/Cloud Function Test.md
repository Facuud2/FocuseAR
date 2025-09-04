# Cloud Function Test: Resumen de Texto con Gemini API

## Descripción
Esta Cloud Function expone un endpoint HTTP que recibe un texto y devuelve un resumen generado por la API de Gemini (Google GenAI). Está implementada en Node.js 20, usando Firebase Functions Gen2.

---

## Pasos para desarrollo y despliegue

1. **Instalar dependencias**
   ```bash
   cd functions
   npm install
   ```

2. **Configurar el secreto de la API Key de Gemini**
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```

3. **Compilar el código**
   ```bash
   npm run build
   ```

4. **Probar localmente con el emulador**
   ```bash
   firebase emulators:start --only functions
   ```

5. **Probar la función localmente**
   ```powershell
   Invoke-WebRequest -Uri "GEMINI_ENDPOINT" `
     -Method POST `
     -Headers @{"Content-Type"="application/json"} `
     -Body '{"text": "Tu texto aquí"}' `
     -OutFile "respuesta_gemini.json"
   Get-Content .\respuesta_gemini.json
   ```

6. **Desplegar a la nube**
   ```bash
   firebase deploy --only functions
   ```

7. **Probar la función en la nube**
   - Endpoint:
     `GEMINI_ENDPOINT`
   - Ejemplo PowerShell:
     ```powershell
     Invoke-WebRequest -Uri "GEMINI_ENDPOINT" `
       -Method POST `
       -Headers @{"Content-Type"="application/json"} `
       -Body '{"text": "Tu texto aquí"}' `
       -OutFile "respuesta_gemini_nube.json"
     Get-Content .\respuesta_gemini_nube.json
     ```

---

## Notas técnicas

- La función está en `functions/src/index.ts` y usa la sintaxis de Gen2 (`onRequest`).
- El secreto `GEMINI_API_KEY` se gestiona con Firebase Secret Manager.
- El resumen se genera usando el modelo `gemini-2.5-flash` de Google GenAI.
- El endpoint es público por defecto (puedes agregar autenticación si lo necesitas).

---

## Ejemplo de request desde JavaScript (fetch)

```js
fetch('GEMINI_ENDPOINT', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Tu texto aquí' })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Créditos
Desarrollado por el equipo FocuseAR, 2025.
