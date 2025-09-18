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
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { ExtractedTopic } from './PDFProcessor';

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
  subjectName: string; // CORREGIDO: Campo agregado para preservar el nombre de materia ingresado por el usuario
  examDate?: string; // CORREGIDO: Campo para guardar la fecha del examen
  color?: string; // CORREGIDO: Campo para guardar el color de la materia
  extractedTopics?: ExtractedTopic[]; // CORREGIDO: Temas extraídos del PDF asociados a la materia
  importantDates?: Array<{
    name: string;
    date: string;
    type: 'exam' | 'tp' | 'other';
  }>; // CORREGIDO: Campo para guardar todas las fechas importantes
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
    summary?: string;
    durationDays: number;
    examDate?: string;
    selectedWeekDays?: number[];
    topics?: string[];
    studyDates?: string[];
    subjectColor?: string; // CORREGIDO: Campo para guardar el color de la materia
    structuredPlan?: {
      title: string;
      summary: string;
      days: Array<{
        date: string;
        dayNumber: number;
        topics: Array<{
          name: string;
          summary: string;
          estimatedTime: string;
        }>;
        totalTime: string;
        recommendations: string;
        completed: boolean;
      }>;
      finalRecommendations: string;
    } | null;
    dailyTasks: Array<{
      day: number;
      task: string;
      completed?: boolean;
    }>;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Interfaces para conversaciones de IA
export interface AIConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
  messageType?: 'text' | 'system' | 'error';
}

export interface AIConversation {
  id?: string;
  userId: string;
  title?: string;
  messages: AIConversationMessage[];
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
        // preserve extractedTopics if provided
        extractedTopics: material.extractedTopics || [],
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
      const deletePromises = plansSnap.docs.map((doc) => deleteDoc(doc.ref));

      await Promise.all(deletePromises);
      console.log('✅ Planes de estudio eliminados');

      // Eliminar material
      const materialRef = doc(db, 'materials', materialId);
      await deleteDoc(materialRef);
      console.log('✅ Material eliminado');
    } catch (error) {
      console.error('❌ Error al eliminar material y planes:', error);
      throw error;
    }
  }

  // 9. Eliminar un plan de estudio específico
  static async deleteStudyPlan(planId: string): Promise<void> {
    try {
      const planRef = doc(db, 'studyPlans', planId);
      await deleteDoc(planRef);
      console.log('✅ Plan de estudio eliminado');
    } catch (error) {
      console.error('❌ Error al eliminar plan de estudio:', error);
      throw error;
    }
  }

  // 10. Crear una nueva conversación de IA
  static async createAIConversation(
    conversation: Omit<AIConversation, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    try {
      console.log('💬 Creando conversación de IA en Firestore...');

      const conversationData: AIConversation = {
        ...conversation,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const conversationRef = await addDoc(
        collection(db, 'ai_conversations'),
        conversationData,
      );
      console.log(
        '✅ Conversación de IA creada exitosamente con ID:',
        conversationRef.id,
      );

      return conversationRef.id;
    } catch (error) {
      console.error('❌ Error al crear conversación de IA:', error);
      throw error;
    }
  }

  // 11. Agregar mensaje a una conversación existente
  static async addMessageToConversation(
    conversationId: string,
    message: Omit<AIConversationMessage, 'id' | 'timestamp'>,
  ): Promise<void> {
    try {
      const conversationRef = doc(db, 'ai_conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (conversationSnap.exists()) {
        const conversationData = conversationSnap.data() as AIConversation;
        const newMessage: AIConversationMessage = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Timestamp.now(),
        };

        const updatedMessages = [...conversationData.messages, newMessage];

        await updateDoc(conversationRef, {
          messages: updatedMessages,
          updatedAt: Timestamp.now(),
        });

        console.log('✅ Mensaje agregado a la conversación exitosamente');
      } else {
        throw new Error('Conversación no encontrada');
      }
    } catch (error) {
      console.error('❌ Error al agregar mensaje a la conversación:', error);
      throw error;
    }
  }

  // 12. Obtener conversaciones de IA de un usuario
  static async getUserAIConversations(
    userId: string,
  ): Promise<AIConversation[]> {
    try {
      const conversationsQuery = query(
        collection(db, 'ai_conversations'),
        where('userId', '==', userId),
      );

      const conversationsSnap = await getDocs(conversationsQuery);
      const conversations: AIConversation[] = [];

      conversationsSnap.forEach((doc) => {
        conversations.push({ id: doc.id, ...doc.data() } as AIConversation);
      });

      return conversations;
    } catch (error) {
      console.error(
        '❌ Error al obtener conversaciones de IA del usuario:',
        error,
      );
      throw error;
    }
  }

  // 13. Eliminar conversación de IA
  static async deleteAIConversation(conversationId: string): Promise<void> {
    try {
      const conversationRef = doc(db, 'ai_conversations', conversationId);
      await deleteDoc(conversationRef);
      console.log('✅ Conversación de IA eliminada');
    } catch (error) {
      console.error('❌ Error al eliminar conversación de IA:', error);
      throw error;
    }
  }

  // 14. Actualizar título de conversación
  static async updateConversationTitle(
    conversationId: string,
    title: string,
  ): Promise<void> {
    try {
      const conversationRef = doc(db, 'ai_conversations', conversationId);
      await updateDoc(conversationRef, {
        title,
        updatedAt: Timestamp.now(),
      });
      console.log('✅ Título de conversación actualizado');
    } catch (error) {
      console.error('❌ Error al actualizar título de conversación:', error);
      throw error;
    }
  }
}
