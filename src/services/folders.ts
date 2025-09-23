import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Folder } from '../types/folder';

export const createFolder = async (
  folder: Omit<Folder, 'id' | 'createdAt'>,
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'folders'), {
      ...folder,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al crear la carpeta:', error);
    throw new Error('Error al crear la carpeta.');
  }
};

export const getFolders = async (
  userId: string,
  path: string,
): Promise<Folder[]> => {
  try {
    const foldersQuery = query(
      collection(db, 'folders'),
      where('userId', '==', userId),
      where('path', '==', path),
    );

    const querySnapshot = await getDocs(foldersQuery);
    return querySnapshot.docs.map((doc) => ({
      ...(doc.data() as Folder),
      id: doc.id,
    }));
  } catch (error) {
    console.error('Error al obtener las carpetas:', error);
    throw new Error('Error al obtener la lista de carpetas.');
  }
};

export const renameFolder = async (
  folderId: string,
  newName: string,
): Promise<void> => {
  try {
    const folderRef = doc(db, 'folders', folderId);
    await updateDoc(folderRef, { name: newName });
  } catch (error) {
    console.error('Error al renombrar la carpeta:', error);
    throw new Error('Error al renombrar la carpeta.');
  }
};

export const deleteFolder = async (folderId: string): Promise<void> => {
  try {
    const folderRef = doc(db, 'folders', folderId);
    await deleteDoc(folderRef);
  } catch (error) {
    console.error('Error al eliminar la carpeta:', error);
    throw new Error('Error al eliminar la carpeta.');
  }
};
