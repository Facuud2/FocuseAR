import SubjectForm from './components/SubjectForm';
import { useState } from 'react';
import toast from 'react-hot-toast';
import type { SubjectData } from './types/subject';

const InfoAcademica = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: SubjectData) => {
    try {
      setIsLoading(true);
      console.log('Datos de la asignatura:', data);
      // Aquí irá la lógica para guardar en Firestore
      toast.success('Asignatura creada exitosamente');
    } catch (error) {
      console.error('Error al crear la asignatura:', error);
      toast.error('Error al crear la asignatura');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Información Académica</h1>
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            Crear Nueva Asignatura
          </h2>
          <p className="text-blue-600">
            Complete el formulario para agregar una nueva asignatura a su perfil
            académico.
          </p>
        </div>

        <SubjectForm onSubmit={handleSubmit} disabled={isLoading} />
      </div>
    </div>
  );
};

export default InfoAcademica;
