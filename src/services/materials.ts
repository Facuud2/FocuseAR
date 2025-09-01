import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface MaterialMetadata {
  fileName: string;
  originalName: string;
  storagePath: string;
  downloadUrl: string;
  userId: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'completed' | 'error';
  createdAt?: Date;
}

export const saveMaterialMetadata = async (metadata: Omit<MaterialMetadata, 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'materials'), {
      ...metadata,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al guardar los metadatos:', error);
    throw new Error('Error al guardar los metadatos del archivo.');
  }
};

export const getUserMaterials = async (userId: string): Promise<MaterialMetadata[]> => {
  try {
    const materialsQuery = query(
      collection(db, 'materials'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(materialsQuery);
    return querySnapshot.docs.map(doc => ({
      ...(doc.data() as MaterialMetadata),
      id: doc.id
    }));
  } catch (error) {
    console.error('Error al obtener los materiales:', error);
    throw new Error('Error al obtener la lista de materiales.');
  }
};
