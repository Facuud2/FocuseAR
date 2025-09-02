# Documentación para configurar y desplegar Cloud Functions con Gemini API

Esta guía explica cómo instalar, configurar y desplegar una Cloud Function que utiliza la API de Gemini para resumir texto. Incluye los problemas comunes y cómo resolverlos.

## 1. Requisitos previos
- Tener Node.js y npm instalados.
- Tener una cuenta de Google Cloud y acceso al proyecto Firebase correspondiente.
- Tener la API Key de Gemini (Google AI Studio).

## 2. Primeros pasos
1. **Clona el repositorio:**
   ```bash
   git clone <url-del-repo>
   cd FocuseAR/functions
   ```

2. **Instala las dependencias:**
   
    Si es la primera vez que trabajas con el proyecto, debes instalar dependencias en dos lugares:
   
    - En la carpeta raíz del proyecto (para el frontend u otras partes):
       ```bash
       npm install
       ```
    - En la carpeta `functions` (para las Cloud Functions):
       ```bash
       cd functions
       npm install
       ```
    Esto instalará todos los paquetes necesarios, incluyendo `@google/genai`, para cada parte del proyecto.

3. **Inicia sesión en Firebase (solo la primera vez):**
   ```bash
   firebase login
   ```
   Sigue las instrucciones para autenticarte en tu cuenta de Google.

## 3. Configura el secreto de la API Key de Gemini
1. Ejecuta el siguiente comando y pega tu API Key cuando lo pida:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```
   Si te pregunta si quieres reemplazar la versión anterior, responde `Y`.

2. Si aparece un error de permisos como:
   > Permission denied on secret ... The service account used must be granted the 'Secret Manager Secret Accessor' role ...

   **Solución:**
   - Ve a https://console.cloud.google.com/iam-admin/iam
   - Busca la cuenta de servicio que aparece en el error (ejemplo: `xxxx-compute@developer.gserviceaccount.com`).
   - Edita los permisos y agrega el rol: `Secret Manager Secret Accessor` (`roles/secretmanager.secretAccessor`).
   - Guarda los cambios y vuelve a desplegar.

## 4. Compila el código
```bash
npm run build
```


## 5. Prueba la función localmente (opcional)
Puedes probar la función en tu máquina antes de desplegarla:
```bash
firebase emulators:start --only functions
```
Esto levantará un servidor local. La consola te mostrará una URL similar a:
```
http://localhost:5001/<tu-proyecto>/us-central1/geminiResponse
```
Puedes hacer un POST a esa URL usando PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:5001/<tu-proyecto>/us-central1/geminiResponse" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"text": "Tu texto aquí"}' -OutFile "respuesta_gemini_local.json"
Get-Content .\respuesta_gemini_local.json
```

## 6. Despliega la función a la nube
```bash
firebase deploy --only functions
```

## 7. Prueba la función en la nube

Después de desplegar, Firebase te mostrará la URL pública de la función, por ejemplo:
```
Function URL (geminiResponse(us-central1)): https://geminiresponse-xxxx-uc.a.run.app
```

**Importante:** No expongas la URL del endpoint directamente en el código fuente ni en repositorios públicos. Usa variables de entorno para manejar la URL de la función.

1. Crea un archivo `.env` en la raíz del proyecto (o copia y renombra `.env.example`).
2. Agrega la variable:
   ```env
   VITE_GEMINI_ENDPOINT=https://geminiresponse-xxxx-uc.a.run.app
   ```
3. En tu frontend o scripts, lee la URL desde la variable de entorno en vez de hardcodearla.

Ejemplo de uso en PowerShell (usando la variable de entorno):
```powershell
$endpoint = $env:VITE_GEMINI_ENDPOINT
Invoke-WebRequest -Uri $endpoint -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"text": "Tu texto aquí"}' -OutFile "respuesta_gemini_nube.json"
Get-Content .\respuesta_gemini_nube.json
```

Recuerda nunca commitear tu archivo `.env` real, solo el `.env.example`.

---

## 8. Acceso para otros usuarios del proyecto

Si otra persona trabaja en el mismo proyecto de Firebase (mismo proyecto en Google Cloud) y hace deploy, podrá usar la función y acceder a la API Key configurada en Secret Manager, siempre que tenga los permisos necesarios en Firebase y Google Cloud.

- **No es necesario que cada usuario vuelva a crear el secreto** si ya existe y la función lo usa.
- **Todos los que hagan deploy y tengan permisos podrán usar la función y la API Key**.
- Si quieres que otros usuarios puedan cambiar la API Key, deben tener permisos para modificar secretos en Google Cloud.

Si alguien clona el proyecto y lo despliega en otro proyecto de Firebase diferente, deberá volver a configurar el secreto GEMINI_API_KEY en ese nuevo proyecto.

## 8. Notas adicionales
- Si cambias la API Key, repite el paso de `firebase functions:secrets:set GEMINI_API_KEY` y vuelve a desplegar.
- Si es la primera vez que trabajas con el proyecto, asegúrate de instalar dependencias tanto en la raíz como en la carpeta `functions` si hay package.json en ambos lugares.
- Si tienes problemas de permisos, revisa los roles de la cuenta de servicio en Google Cloud Console.

---

Esta guía cubre los pasos y problemas más comunes para que cualquier persona nueva pueda levantar y desplegar la función correctamente.
