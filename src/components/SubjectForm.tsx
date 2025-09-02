import React, { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { HexColorPicker } from 'react-colorful';
import { es } from 'date-fns/locale/es';
import "react-datepicker/dist/react-datepicker.css";
import PDFUpload from './PDFUpload';

// Registrar el idioma español
registerLocale('es', es);

interface SubjectFormProps {
  onSubmit: (data: SubjectData) => void;
  initialData?: SubjectData;
  disabled?: boolean;
}

interface SubjectData {
  name: string;
  startDate: Date;
  endDate: Date;
  color: string;
}

const SubjectForm: React.FC<SubjectFormProps> = ({ onSubmit, initialData, disabled = false }) => {
  const [formData, setFormData] = useState<SubjectData>({
    name: initialData?.name || '',
    startDate: initialData?.startDate || new Date(),
    endDate: initialData?.endDate || new Date(),
    color: initialData?.color || '#3B82F6' // Color azul por defecto
  });

  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Crear Asignatura</h2>
      
      {/* Nombre de la asignatura */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre de la asignatura
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Selector de fechas */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de inicio
          </label>
          <DatePicker
            selected={formData.startDate}
            onChange={(date: Date | null) => date && setFormData({ ...formData, startDate: date })}
          disabled={disabled}
            selectsStart
            startDate={formData.startDate}
            endDate={formData.endDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="dd/MM/yyyy"
            locale="es"
            placeholderText="Seleccionar fecha"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de finalización
          </label>
          <DatePicker
            selected={formData.endDate}
            onChange={(date: Date | null) => date && setFormData({ ...formData, endDate: date })}
          disabled={disabled}
            selectsEnd
            startDate={formData.startDate}
            endDate={formData.endDate}
            minDate={formData.startDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="dd/MM/yyyy"
            locale="es"
            placeholderText="Seleccionar fecha"
          />
        </div>
      </div>

      {/* Selector de color */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color de la asignatura
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            <div
              className="w-6 h-6 rounded-md mr-2"
              style={{ backgroundColor: formData.color }}
            />
            {formData.color}
          </button>
          {showColorPicker && (
            <div className="absolute z-10 mt-2">
              <div 
                className="fixed inset-0" 
                onClick={() => setShowColorPicker(false)}
              />
              <HexColorPicker
                color={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Componente de carga de PDF */}
      <div className="mb-6">
        <PDFUpload />
      </div>

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={disabled}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md
                 hover:bg-blue-700 focus:outline-none focus:ring-2
                 focus:ring-blue-500 focus:ring-offset-2 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? 'Creando asignatura...' : 'Crear asignatura'}
      </button>
    </form>
  );
};

export default SubjectForm;
