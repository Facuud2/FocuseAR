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
  orderBy,
  limit,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
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
  subjectName: string; // CORREGIDO: Campo agregado para preservar el nombre de materia ingresado por el usuario
  examDate?: string; // CORREGIDO: Campo para guardar la fecha del examen
  color?: string; // CORREGIDO: Campo para guardar el color de la materia
  importantDates?: Array<{
    name: string;
    date: string;
    type: 'exam' | 'tp' | 'other';
  }>; // CORREGIDO: Campo para guardar todas las fechas importantes
  // Temas extraídos por IA (opcional). Puede ser un arreglo de objetos {id,name,description,order}
  extractedTopics?: Array<{
    id: string;
    name?: string;
    description?: string;
    order?: number;
  }>;
  // Metadatos para control de versiones/actualizaciones de topics
  extractedTopicsUpdatedAt?: Timestamp;
  extractedTopicsVersion?: number;
  storagePath: string;
  fileType: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StudyPlan {
  id?: string;
  userId: string;
  materialId: string;
  subjectName?: string; // Added subjectName to StudyPlan interface
  generatedPlan: {
    title: string;
    summary?: string;
    durationDays: number;
    examDate?: string;
    selectedWeekDays?: number[];
    eventName?: string;
    topics?: (string | Topic)[]; // Acepta un array que puede contener strings u objetos Topic
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

// Interfaz para temas
export interface Topic {
  id: string;
  title: string;
  description?: string;
  order?: number;
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

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  id?: string;
  questions: QuizQuestion[];
  subjectName: string;
  materialId: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserEvent {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  type: 'study' | 'exam' | 'task' | 'reminder';
  start: string | Date;
  end?: string | Date;
  allDay?: boolean;
  color?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  time?: string;
}

export interface Activity {
  id: string;
  userId: string;
  type:
    | 'material_upload'
    | 'study_plan_created'
    | 'study_plan_task_completed'
    | 'ai_chat_started'
    | 'quiz_created';
  description: string;
  timestamp: Timestamp;
  link?: string; // Optional link to the specific item
}

export class DatabaseService {
  // Generador de id local (evita añadir dependencia uuid)
  private static generateId(): string {
    return `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  // Ayuda: garantiza que los temas sean objetos (Topic[]). Si se encuentra la cadena heredada string[],
  // convierte cada cadena en un tema con el ID generado y una descripción vacía.
  public static normalizeTopics(rawTopics: unknown[] | undefined): Topic[] {
    if (!rawTopics) return [];

    return rawTopics.map((t) => {
      // legacy string[] case
      if (typeof t === 'string') {
        return { id: this.generateId(), title: t } as Topic;
      }

      // object-like case: validate keys safely
      if (t && typeof t === 'object' && t !== null) {
        const obj = t as {
          id?: unknown;
          title?: unknown;
          name?: unknown;
          description?: unknown;
          order?: unknown;
        };
        const id = typeof obj.id === 'string' ? obj.id : this.generateId();
        const title =
          typeof obj.title === 'string'
            ? obj.title
            : typeof obj.name === 'string'
              ? obj.name
              : 'Tema';
        const description =
          typeof obj.description === 'string' ? obj.description : undefined;
        const order = typeof obj.order === 'number' ? obj.order : undefined;
        return { id, title, description, order } as Topic;
      }

      // fallback for unexpected types
      return { id: this.generateId(), title: String(t) } as Topic;
    });
  }
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
    material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'> & {
      extractedTopics?: Array<{
        id: string;
        name?: string;
        description?: string;
        order?: number;
      }>;
    },
  ): Promise<string> {
    try {
      console.log('📂 Creando material en Firestore...');

      // Añadir metadatos de topics si vienen del cliente
      const materialData: Material = {
        ...material,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(material.extractedTopics && material.extractedTopics.length > 0
          ? {
              extractedTopicsUpdatedAt: Timestamp.now(),
              extractedTopicsVersion: 1,
            }
          : {}),
      } as Material;

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

  // 2.1 Guardar la disponibilidad del usuario (user settings)
  static async saveUserAvailability(
    userId: string,
    availability: Record<string, boolean>,
  ): Promise<void> {
    try {
      const selectedWeekDays =
        DatabaseService.availabilityToWeekdayIndices(availability);
      const payload = {
        availability,
        selectedWeekDays,
        updatedAt: Timestamp.now(),
      };
      await setDoc(doc(db, 'user_settings', userId), payload, { merge: true });
      console.log('✅ Disponibilidad de usuario guardada');
    } catch (error) {
      console.error('❌ Error al guardar disponibilidad del usuario:', error);
      throw error;
    }
  }

  // 2.2 Obtener la disponibilidad del usuario
  static async getUserAvailability(userId: string): Promise<{
    availability?: Record<string, boolean>;
    selectedWeekDays?: number[];
  } | null> {
    try {
      const ref = doc(db, 'user_settings', userId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data();
      // Guard: ensure expected shape
      if (
        data &&
        typeof data === 'object' &&
        ('selectedWeekDays' in data || 'availability' in data)
      ) {
        return data as {
          availability?: Record<string, boolean>;
          selectedWeekDays?: number[];
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error al obtener disponibilidad del usuario:', error);
      throw error;
    }
  }

  // Helper: convierte un objeto availability {lunes:true,...} a indices de semana [1,2,5]
  private static availabilityToWeekdayIndices(
    availability: Record<string, boolean>,
  ): number[] {
    // Mapa de nombres en español a índices usados en cloud function (domingo=0, lunes=1, ...)
    const map: Record<string, number> = {
      domingo: 0,
      lunes: 1,
      martes: 2,
      miércoles: 3,
      miercoles: 3,
      jueves: 4,
      viernes: 5,
      sábado: 6,
      sabado: 6,
    };

    const indices: number[] = [];
    for (const [day, enabled] of Object.entries(availability)) {
      if (enabled) {
        const key = day.toLowerCase();
        const idx = map[key];
        if (typeof idx === 'number') indices.push(idx);
      }
    }
    // Ordenar y retornar
    return indices.sort((a, b) => a - b);
  }

  // 3. Crear un plan de estudio
  static async createStudyPlan(
    studyPlan: Omit<StudyPlan, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    try {
      console.log('📘 Creando plan de estudio en Firestore...');

      // Crear una copia del plan de estudio para no modificar el original
      const studyPlanCopy = { ...studyPlan };

      // Normalizar los temas si existen
      if (studyPlanCopy.generatedPlan.topics) {
        const topicsToNormalize = Array.isArray(
          studyPlanCopy.generatedPlan.topics,
        )
          ? studyPlanCopy.generatedPlan.topics
          : [];

        const normalizedTopics = this.normalizeTopics(topicsToNormalize);

        // Actualizar la copia con los temas normalizados
        studyPlanCopy.generatedPlan = {
          ...studyPlanCopy.generatedPlan,
          topics: normalizedTopics,
        };
      }

      const studyPlanData: StudyPlan = {
        ...studyPlanCopy,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Sanitizar el objeto removiendo keys con valor `undefined` (Firestore no acepta `undefined`)
      const sanitized = this.sanitizeForFirestore(studyPlanData);

      const planRef = await addDoc(collection(db, 'studyPlans'), sanitized);
      console.log('✅ Plan de estudio creado exitosamente con ID:', planRef.id);

      return planRef.id;
    } catch (error) {
      console.error('❌ Error al crear plan de estudio:', error);
      throw error;
    }
  }

  // Util: remover recursivamente propiedades con valor `undefined` y limpiar arrays
  private static sanitizeForFirestore(value: unknown): unknown {
    if (value === undefined) return undefined;
    if (value === null) return null;

    if (Array.isArray(value)) {
      // map + filter out undefined entries
      const arr = value
        .map((v) => this.sanitizeForFirestore(v))
        .filter((v) => v !== undefined);
      return arr;
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      !(value instanceof Timestamp)
    ) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const sanitized = this.sanitizeForFirestore(v);
        if (sanitized !== undefined) {
          out[k] = sanitized;
        }
      }
      return out;
    }

    // Primitivos (string, number, boolean, Timestamp, etc.)
    return value;
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
        materials.push({
          id: doc.id,
          ...(doc.data() as DocumentData),
        } as Material);
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

      for (const doc of plansSnap.docs) {
        const plan = { id: doc.id, ...doc.data() } as StudyPlan;
        // Fetch associated material to get subjectName
        if (plan.materialId) {
          const material = await this.getMaterialById(plan.materialId);
          if (material) {
            plan.subjectName = material.subjectName; // Add subjectName to study plan
          }
        }
        plans.push(plan);
      }

      return plans;
    } catch (error) {
      console.error(
        '❌ Error al obtener planes de estudio del usuario:',
        error,
      );
      throw error;
    }
  }

  // 6.1. Obtener material por ID
  static async getMaterialById(materialId: string): Promise<Material | null> {
    try {
      const materialRef = doc(db, 'materials', materialId);
      const materialSnap = await getDoc(materialRef);

      if (materialSnap.exists()) {
        return { id: materialSnap.id, ...materialSnap.data() } as Material;
      }
      return null;
    } catch (error) {
      console.error('❌ Error al obtener material por ID:', error);
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
      // Intentar eliminar una posible subcolección 'topics' dentro del material (cascada)
      try {
        const topicsCollectionRef = collection(
          db,
          'materials',
          materialId,
          'topics',
        );
        const topicsSnap = await getDocs(topicsCollectionRef);
        if (!topicsSnap.empty) {
          const topicDeletes = topicsSnap.docs.map((d) => deleteDoc(d.ref));
          await Promise.all(topicDeletes);
          console.log('✅ Temas (subcolección) eliminados');
        }
      } catch (subErr) {
        // No crítico: si no existe la subcolección o falla, lo registramos y continuamos
        console.warn(
          '⚠️ No se pudo eliminar subcolección topics o no existe:',
          subErr,
        );
      }

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

  // 15. Get all quizzes for a user
  static async getQuizzes(userId: string): Promise<Quiz[]> {
    try {
      const quizzesQuery = query(
        collection(db, 'quizzes'),
        where('userId', '==', userId),
      );

      const quizzesSnap = await getDocs(quizzesQuery);
      const quizzes: Quiz[] = [];

      quizzesSnap.forEach((doc) => {
        quizzes.push({ id: doc.id, ...doc.data() } as Quiz);
      });

      return quizzes;
    } catch (error) {
      console.error('❌ Error al obtener los quizzes del usuario:', error);
      throw error;
    }
  }

  // 16. Get a single quiz by its ID
  static async getQuiz(quizId: string): Promise<Quiz | null> {
    try {
      const quizRef = doc(db, 'quizzes', quizId);
      const quizSnap = await getDoc(quizRef);

      if (quizSnap.exists()) {
        return { id: quizSnap.id, ...quizSnap.data() } as Quiz;
      }
      return null;
    } catch (error) {
      console.error('❌ Error al obtener el quiz:', error);
      throw error;
    }
  }

  // 17. Delete a quiz by its ID
  static async deleteQuiz(quizId: string): Promise<void> {
    try {
      const quizRef = doc(db, 'quizzes', quizId);
      await deleteDoc(quizRef);
      console.log('✅ Quiz eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error al eliminar el quiz:', error);
      throw error;
    }
  }

  // 18. Create a user event
  static async createUserEvent(
    event: Omit<UserEvent, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    try {
      console.log('📅 Creando evento de usuario en Firestore...');
      const eventData = {
        ...event,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const eventRef = await addDoc(collection(db, 'events'), eventData);
      console.log('✅ Evento creado exitosamente con ID:', eventRef.id);
      return eventRef.id;
    } catch (error) {
      console.error('❌ Error al crear evento:', error);
      throw error;
    }
  }

  // 19. Get user events
  static async getUserEvents(userId: string): Promise<UserEvent[]> {
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        where('userId', '==', userId),
      );
      const eventsSnap = await getDocs(eventsQuery);
      const events: UserEvent[] = [];
      eventsSnap.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as UserEvent);
      });
      return events;
    } catch (error) {
      console.error('❌ Error al obtener eventos del usuario:', error);
      throw error;
    }
  }

  // 20. Update study plan
  static async updateStudyPlan(
    planId: string,
    updatedPlan: Partial<StudyPlan>,
  ): Promise<void> {
    try {
      const planRef = doc(db, 'studyPlans', planId);
      await updateDoc(planRef, {
        ...updatedPlan,
        updatedAt: Timestamp.now(),
      });
      console.log('✅ Plan de estudio actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error al actualizar plan de estudio:', error);
      throw error;
    }
  }

  // 21. Get recent activities for a user
  static async getRecentActivities(
    userId: string,
    activitiesLimit: number = 5,
  ): Promise<Activity[]> {
    try {
      const activities: Activity[] = [];

      // Fetch recent materials
      const materialsQuery = query(
        collection(db, 'materials'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(activitiesLimit),
      );
      const materialsSnap = await getDocs(materialsQuery);
      materialsSnap.forEach((doc) => {
        const material = doc.data() as Material;
        activities.push({
          id: doc.id,
          userId: userId,
          type: 'material_upload',
          description: `Subiste el documento: ${material.fileName}`,
          timestamp: material.createdAt,
          link: `/materials/${doc.id}`,
        });
      });

      // Fetch recent study plans
      const studyPlansQuery = query(
        collection(db, 'studyPlans'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(activitiesLimit),
      );
      const studyPlansSnap = await getDocs(studyPlansQuery);
      studyPlansSnap.forEach((doc) => {
        const plan = doc.data() as StudyPlan;
        activities.push({
          id: doc.id,
          userId: userId,
          type: 'study_plan_created',
          description: `Creaste un plan de estudio para: ${plan.subjectName || 'Materia sin nombre'}`,
          timestamp: plan.createdAt,
          link: `/study-plans/${doc.id}`,
        });
      });

      // Fetch recent AI conversations
      const aiConversationsQuery = query(
        collection(db, 'ai_conversations'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(activitiesLimit),
      );
      const aiConversationsSnap = await getDocs(aiConversationsQuery);
      aiConversationsSnap.forEach((doc) => {
        const conversation = doc.data() as AIConversation;
        activities.push({
          id: doc.id,
          userId: userId,
          type: 'ai_chat_started',
          description: `Iniciaste una conversación de IA: ${conversation.title || 'Sin título'}`,
          timestamp: conversation.createdAt,
          link: `/ai-chat/${doc.id}`,
        });
      });

      // Fetch recent quizzes
      const quizzesQuery = query(
        collection(db, 'quizzes'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(activitiesLimit),
      );
      const quizzesSnap = await getDocs(quizzesQuery);
      quizzesSnap.forEach((doc) => {
        const quiz = doc.data() as Quiz;
        activities.push({
          id: doc.id,
          userId: userId,
          type: 'quiz_created',
          description: `Creaste un quiz de: ${quiz.subjectName}`,
          timestamp: quiz.createdAt,
          link: `/quizzes/${doc.id}`,
        });
      });

      // Sort all activities by timestamp in descending order and limit the total results
      activities.sort((a, b) => {
        let timestampA = 0;
        if (a.timestamp instanceof Timestamp) {
          timestampA = a.timestamp.toMillis();
        } else if (
          a.timestamp &&
          typeof a.timestamp === 'object' &&
          'seconds' in a.timestamp
        ) {
          timestampA = (a.timestamp as { seconds: number }).seconds * 1000;
        }

        let timestampB = 0;
        if (b.timestamp instanceof Timestamp) {
          timestampB = b.timestamp.toMillis();
        } else if (
          b.timestamp &&
          typeof b.timestamp === 'object' &&
          'seconds' in b.timestamp
        ) {
          timestampB = (b.timestamp as { seconds: number }).seconds * 1000;
        }

        return timestampB - timestampA;
      });

      return activities.slice(0, activitiesLimit);
    } catch (error) {
      console.error('❌ Error al obtener actividades recientes:', error);
      throw error;
    }
  }
}
