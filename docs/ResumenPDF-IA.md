# Documentación: Flujo de Resumen de PDF con IA

## 1. `src/components/PDFSummaryTest.tsx`
- Permite subir un PDF, extraer su texto y enviarlo a una función Cloud Function para obtener:
  - Temas importantes
  - Fechas relevantes
  - Un resumen general
- Muestra el texto extraído y el resumen en cajas separadas y presentables.
- El prompt es fijo, el usuario no lo escribe.

## 2. `functions/src/index.ts`
- Define las Cloud Functions:
  - `geminiResponse`: función original, sin prompt especial.
  - `geminiResponseTest`: función con CORS y prompt fijo para IA (temas, fechas, resumen).
- Prompt fijo:
  ```
  Analiza el siguiente texto extraído de un cronograma académico o material de clase. Devuélveme:
  1. Una lista de los temas importantes que se mencionan.
  2. Una lista de fechas relevantes (con su evento o tema asociado).
  3. Un resumen general de lo que se habla en el texto.
  Responde en español, en formato claro y estructurado.
  ```

## 3. `public/pdf.worker.js`
- Worker de PDF.js necesario para que `pdfjs-dist` funcione en Vite/React sin errores de CORS.
- Se copia desde `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` a `public/pdf.worker.js`.

## 4. `src/pdfjs-dist.d.ts`
- Declaración de tipos TypeScript para que `pdfjs-dist` funcione sin errores de tipado.

## 5. Cambios en el frontend
- Se usa la función `geminiResponseTest` en el fetch de PDFSummaryTest.
- Presentación visual mejorada con Tailwind CSS.

## Flujo general
1. El usuario sube un PDF en la página de prueba.
2. El frontend extrae el texto y lo envía a la función geminiResponseTest.
3. La función IA responde con temas, fechas y resumen.
4. El frontend muestra todo de forma clara y organizada.

---

> Para dudas o mantenimiento, revisar este archivo y los comentarios en el código fuente.
