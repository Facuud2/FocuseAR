import PDFUpload from './components/PDFUpload';

const InfoAcademica = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Información Académica</h1>
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-600 mb-8">
          Por favor, sube los documentos necesarios para completar tu perfil académico.
        </p>
        <PDFUpload />
      </div>
    </div>
  );
};

export default InfoAcademica;