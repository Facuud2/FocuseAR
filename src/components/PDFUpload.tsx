import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

const PDFUpload: React.FC = () => {
  const { user } = useAuth(); // Lo usaremos más adelante para la subida de archivos
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

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
            className="block w-full text-sm text-gray-900
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100
                     cursor-pointer border rounded-md
                     focus:outline-none focus:border-blue-500"
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
