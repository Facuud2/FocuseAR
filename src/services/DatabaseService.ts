import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';

// Interfaces para la estructura de datos
export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
}

export interface Material {
  id?: string;
  userId: string;
  fileName: string;
  storagePath: string;
  fileType: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StudyPlan {
  id?: string;
  userId: string;
  materialId: string;
  generatedPlan: {
    title: string;
    durationDays: number;
    dailyTasks: Array<{
      day: number;
      task: string;
      completed?: boolean;
    }>;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class DatabaseService {
  // 1. Crear o actualizar usuario cuando se autentica con Google
  static async createOrUpdateUser(user: User): Promise<UserData> {
    try {
      console.log('👤 Creando/actualizando usuario en Firestore...');

      const userData: UserData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Usuario',
        photoURL: user.photoURL || '',
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
      };

      // Verificar si el usuario ya existe
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Usuario existe, solo actualizar lastLogin
        console.log('✅ Usuario existente, actualizando lastLogin');
        await updateDoc(userRef, {
          lastLogin: Timestamp.now(),
          displayName: userData.displayName,
          photoURL: userData.photoURL,
        });
      } else {
        // Usuario nuevo, crear documento completo
        console.log('✅ Usuario nuevo, creando documento completo');
        await setDoc(userRef, userData);
      }

      console.log('✅ Usuario creado/actualizado exitosamente');
      return userData;
    } catch (error) {
      console.error('❌ Error al crear/actualizar usuario:', error);
      throw error;
    }
  }

  // 2. Crear un nuevo material
  static async createMaterial(
    material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    try {
      console.log('📂 Creando material en Firestore...');

      const materialData: Material = {
        ...material,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const materialRef = await addDoc(
        collection(db, 'materials'),
        materialData,
      );
      console.log('✅ Material creado exitosamente con ID:', materialRef.id);

      return materialRef.id;
    } catch (error) {
      console.error('❌ Error al crear material:', error);
      throw error;
    }
  }

  // 3. Crear un plan de estudio
  static async createStudyPlan(
    studyPlan: Omit<StudyPlan, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    try {
      console.log('📘 Creando plan de estudio en Firestore...');

      const studyPlanData: StudyPlan = {
        ...studyPlan,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const planRef = await addDoc(collection(db, 'studyPlans'), studyPlanData);
      console.log('✅ Plan de estudio creado exitosamente con ID:', planRef.id);

      return planRef.id;
    } catch (error) {
      console.error('❌ Error al crear plan de estudio:', error);
      throw error;
    }
  }

  // 4. Obtener usuario por UID
  static async getUserByUid(uid: string): Promise<UserData | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return userSnap.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error);
      throw error;
    }
  }

  // 5. Obtener materiales de un usuario
  static async getUserMaterials(userId: string): Promise<Material[]> {
    try {
      const materialsQuery = query(
        collection(db, 'materials'),
        where('userId', '==', userId),
      );

      const materialsSnap = await getDocs(materialsQuery);
      const materials: Material[] = [];

      materialsSnap.forEach((doc) => {
        materials.push({ id: doc.id, ...doc.data() } as Material);
      });

      return materials;
    } catch (error) {
      console.error('❌ Error al obtener materiales del usuario:', error);
      throw error;
    }
  }

  // 6. Obtener planes de estudio de un usuario
  static async getUserStudyPlans(userId: string): Promise<StudyPlan[]> {
    try {
      const plansQuery = query(
        collection(db, 'studyPlans'),
        where('userId', '==', userId),
      );

      const plansSnap = await getDocs(plansQuery);
      const plans: StudyPlan[] = [];

      plansSnap.forEach((doc) => {
        plans.push({ id: doc.id, ...doc.data() } as StudyPlan);
      });

      return plans;
    } catch (error) {
      console.error(
        '❌ Error al obtener planes de estudio del usuario:',
        error,
      );
      throw error;
    }
  }

  // 7. Actualizar tarea completada en un plan de estudio
  static async updateTaskCompletion(
    planId: string,
    day: number,
    completed: boolean,
  ): Promise<void> {
    try {
      const planRef = doc(db, 'studyPlans', planId);
      const planSnap = await getDoc(planRef);

      if (planSnap.exists()) {
        const planData = planSnap.data() as StudyPlan;
        const updatedTasks = planData.generatedPlan.dailyTasks.map((task) =>
          task.day === day ? { ...task, completed } : task,
        );

        await updateDoc(planRef, {
          'generatedPlan.dailyTasks': updatedTasks,
          updatedAt: Timestamp.now(),
        });

        console.log('✅ Tarea actualizada exitosamente');
      }
    } catch (error) {
      console.error('❌ Error al actualizar tarea:', error);
      throw error;
    }
  }

  // 8. Eliminar material y sus planes de estudio asociados
  static async deleteMaterialAndPlans(materialId: string): Promise<void> {
    try {
      // Eliminar planes de estudio asociados
      const plansQuery = query(
        collection(db, 'studyPlans'),
        where('materialId', '==', materialId),
      );

      const plansSnap = await getDocs(plansQuery);
      const deletePromises = plansSnap.docs.map((doc) =>
        setDoc(doc.ref, {}, { merge: false }),
      );

      await Promise.all(deletePromises);
      console.log('✅ Planes de estudio eliminados');

      // Eliminar material
      const materialRef = doc(db, 'materials', materialId);
      await setDoc(materialRef, {}, { merge: false });
      console.log('✅ Material eliminado');
    } catch (error) {
      console.error('❌ Error al eliminar material y planes:', error);
      throw error;
    }
  }
}
