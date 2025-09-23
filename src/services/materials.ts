import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc, // Added deleteDoc here
} from 'firebase/firestore';
import { db } from '../firebase';

import type { MaterialMetadata } from '../types/material';

export const saveMaterialMetadata = async (
  metadata: Omit<MaterialMetadata, 'createdAt'>,
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'materials'), {
      ...metadata,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al guardar los metadatos:', error);
    throw new Error('Error al guardar los metadatos del archivo.');
  }
};

export const getUserMaterials = async (
  userId: string,
  path: string,
): Promise<MaterialMetadata[]> => {
  try {
    const materialsQuery = query(
      collection(db, 'materials'),
      where('userId', '==', userId),
      where('path', '==', path),
    );

    const querySnapshot = await getDocs(materialsQuery);
    return querySnapshot.docs.map((doc) => ({
      ...(doc.data() as MaterialMetadata),
      id: doc.id,
    }));
  } catch (error) {
    console.error('Error al obtener los materiales:', error);
    throw new Error('Error al obtener la lista de materiales.');
  }
};

export const moveMaterial = async (
  materialId: string,
  newPath: string,
): Promise<void> => {
  try {
    const materialRef = doc(db, 'materials', materialId);
    await updateDoc(materialRef, { path: newPath });
  } catch (error) {
    console.error('Error al mover el material:', error);
    throw new Error('Error al mover el material.');
  }
};

export const updateMaterialTags = async (
  // Added this function
  materialId: string,
  newTags: string[],
): Promise<void> => {
  try {
    const materialRef = doc(db, 'materials', materialId);
    await updateDoc(materialRef, { tags: newTags });
  } catch (error) {
    console.error('Error updating material tags:', error);
    throw new Error('Error updating material tags.');
  }
};

export const deleteMaterial = async (materialId: string): Promise<void> => {
  try {
    const materialRef = doc(db, 'materials', materialId);
    await deleteDoc(materialRef);
    // Also delete the file from storage
  } catch (error) {
    console.error('Error deleting material:', error);
    throw new Error('Error deleting material.');
  }
};
