import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { saveMaterialMetadata } from './materials';

interface UploadResponse {
  url: string;
  path: string;
  fileName: string;
  materialId: string;
}

export const uploadPDF = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void,
): Promise<UploadResponse> => {
  try {
    // Crear una referencia única para el archivo
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `pdfs/${userId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    // Crear una promesa para manejar la subida
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Manejar el progreso de la subida si se proporciona la función onProgress
    if (onProgress) {
      uploadTask.on('state_changed', (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      });
    }

    // Esperar a que la subida se complete
    await uploadTask;

    // Obtener la URL de descarga
    const downloadURL = await getDownloadURL(storageRef);

    // Guardar los metadatos usando el servicio dedicado
    const materialId = await saveMaterialMetadata({
      fileName: file.name,
      originalName: file.name,
      storagePath: filePath,
      downloadUrl: downloadURL,
      userId,
      fileSize: file.size,
      mimeType: file.type,
      status: 'completed',
    });

    return {
      url: downloadURL,
      path: filePath,
      fileName: file.name,
      materialId,
    };
  } catch (error) {
    console.error('Error al subir el archivo:', error);
    throw new Error(
      'Error al subir el archivo. Por favor, intenta nuevamente.',
    );
  }
};
