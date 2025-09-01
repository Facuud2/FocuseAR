import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { uploadPDF } from '../services/storage';
import toast from 'react-hot-toast';

const PDFUpload: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError('');

    if (!file) {
      return;
    }

    // Validar que sea un archivo PDF
    if (file.type !== 'application/pdf') {
      setError('Por favor, selecciona un archivo PDF');
      event.target.value = ''; // Limpiar el input
      setSelectedFile(null);
      return;
    }

    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > maxSize) {
      setError('El archivo no debe superar los 10MB');
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      setError('Por favor, selecciona un archivo PDF y asegúrate de estar autenticado');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      setUploadProgress(0);
      const result = await uploadPDF(
        selectedFile,
        user.uid,
        (progress) => setUploadProgress(progress)
      );
      
      toast.success('Archivo subido exitosamente');
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Limpiar el input de archivo
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      console.log('Documento creado en Firestore con ID:', result.materialId);
    } catch (err) {
      toast.error('Error al subir el archivo');
      setError(err instanceof Error ? err.message : 'Error al subir el archivo');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Subir PDF</h2>
      
      <div className="space-y-4">
        {/* Input para seleccionar archivo */}
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-900">
            Seleccionar archivo PDF
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-gray-900
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100
                     cursor-pointer border rounded-md
                     focus:outline-none focus:border-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Mostrar archivo seleccionado */}
        {selectedFile && (
          <div className="p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              Archivo seleccionado: {selectedFile.name}
            </p>
            <p className="text-xs text-blue-600">
              Tamaño: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        )}

        {/* Barra de progreso */}
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Botón de subida */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md
                   hover:bg-blue-700 focus:outline-none focus:ring-2
                   focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50
                   disabled:cursor-not-allowed transition-colors"
        >
          {isUploading 
            ? `Subiendo... ${Math.round(uploadProgress)}%` 
            : 'Subir PDF'
          }
        </button>

        {/* Mostrar error si existe */}
        {error && (
          <div className="p-4 bg-red-50 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFUpload;
