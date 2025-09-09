import { getDocument } from 'pdfjs-dist/build/pdf.mjs';

/**
 * Extrae el texto de todas las páginas de un archivo PDF.
 * @param file Archivo PDF (File)
 * @returns Texto extraído de todas las páginas
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: { str: string }) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}
