/*
//importaciones
import React, { useState } from 'react';
import * as _pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
const pdfjsLib = _pdfjsLib as typeof import('pdfjs-dist/build/pdf.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
const CMAP_URL = 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/';
const STANDARD_FONT_DATA_URL =
  'https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/';

const PDFSummaryTest: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSummary('');
    setText('');
    const file = e.target.files?.[0] || null;
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      setError('Por favor selecciona un archivo PDF.');
      setSelectedFile(null);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: CMAP_URL,
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
      cMapPacked: true,
    }).promise;
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
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    setSummary('');
    try {
      const pdfText = await extractTextFromPDF(selectedFile);
      setText(pdfText);
      // Llamada a la Cloud Function
      const response = await fetch(
        'https://us-central1-proyecto-final-universitario.cloudfunctions.net/geminiResponseTest',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: pdfText }),
        },
      );
      if (!response.ok) throw new Error('Error al obtener el resumen');
      const data = await response.json();
      setSummary(data.summary || 'Sin resumen');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error inesperado');
      } else {
        setError('Error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-10 px-2">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 mb-8 border border-blue-100">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-800 tracking-tight drop-shadow-sm">
          Testeo de IA
        </h2>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="flex-1 border border-gray-300 rounded px-3 py-2"
          />
          <button
            onClick={handleProcess}
            disabled={!selectedFile || loading}
            className="py-2 px-6 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Procesando...' : 'Procesar PDF y Resumir'}
          </button>
        </div>
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200 text-center">
            {error}
          </div>
        )}

        {summary && (
          <section className="mb-8">
            <h3 className="text-xl font-bold mb-3 text-green-700 flex items-center gap-2">
              <span className="inline-block w-2 h-6 bg-green-400 rounded mr-2"></span>
              Resumen generado
            </h3>
            <div className="w-full bg-green-50 border border-green-200 rounded-xl p-5 text-base leading-relaxed text-gray-900 shadow-inner whitespace-pre-line">
              {summary}
            </div>
          </section>
        )}

        {text && (
          <section>
            <h3 className="text-xl font-bold mb-3 text-blue-700 flex items-center gap-2">
              <span className="inline-block w-2 h-6 bg-blue-400 rounded mr-2"></span>
              Texto extraído
            </h3>
            <pre className="w-full bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm leading-relaxed text-gray-800 shadow-inner max-h-64 overflow-y-auto whitespace-pre-line">
              {text.length > 3000
                ? text.slice(0, 3000) + '\n... (truncado)'
                : text}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
};

export default PDFSummaryTest;
*/
