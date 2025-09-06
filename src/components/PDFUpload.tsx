import React, { useState, useCallback } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { uploadPDF } from '../services/storage';
import toast from 'react-hot-toast';
import { FiUpload, FiFileText, FiX, FiLoader } from 'react-icons/fi';

const PDFUpload: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File | undefined) => {
    setError('');

    if (!file) {
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Por favor, selecciona un archivo PDF');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError('El archivo no debe superar los 10MB');
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      processFile(file);
    },
    [processFile],
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setError('');
  }, []);

  const handleUpload = useCallback(async () => {
    if (!user) {
      setError('Por favor, inicia sesión para subir archivos');
      return;
    }

    if (!selectedFile) {
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      setUploadProgress(0);

      await uploadPDF(selectedFile, user.uid, (progress) => {
        setUploadProgress(progress);
      });

      toast.success('¡Archivo subido exitosamente!', {
        icon: '🎉',
        style: {
          borderRadius: '8px',
          background: '#4CAF50',
          color: '#fff',
        },
      });

      setSelectedFile(null);
      setUploadProgress(0);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al subir el archivo';
      toast.error(errorMessage, {
        style: {
          borderRadius: '8px',
          background: '#F44336',
          color: '#fff',
        },
      });
      setError(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, user]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Material de Estudio
        </h2>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            document.getElementById('file-upload')?.click();
          }
        }}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <FiUpload className="w-8 h-8 text-blue-500" />
          </div>

          {!selectedFile ? (
            <>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-800">
                  Arrastra y suelta tu archivo PDF
                </p>
                <p className="text-sm text-gray-500">o</p>
              </div>
              <label className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer">
                Seleccionar archivo
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                  aria-label="Seleccionar archivo PDF"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">Tamaño máximo: 10MB</p>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiFileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800 truncate max-w-xs">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  disabled={isUploading}
                  aria-label="Eliminar archivo"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {isUploading ? (
                <div className="mt-4 space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                      aria-valuenow={uploadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Subiendo... {Math.round(uploadProgress)}%
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleUpload}
                  className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <FiLoader className="animate-spin" />
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <FiUpload />
                      <span>Subir archivo</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center">
          <FiX className="mr-2 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};

export default PDFUpload;
