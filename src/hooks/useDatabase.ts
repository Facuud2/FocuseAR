import { useState, useCallback, useContext } from 'react';
import { Timestamp } from 'firebase/firestore';
import { DatabaseService } from '../services/DatabaseService';
import type {
  Material,
  StudyPlan,
  AIConversation,
  AIConversationMessage,
  UserEvent,
} from '../services/DatabaseService';
import type { Topic } from '../types/studyPlan';
import { AuthContext } from './authContext';

export const useDatabase = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crear material
  const createMaterial = useCallback(
    async (materialData: {
      fileName: string;
      subjectName: string; // CORREGIDO: Parámetro agregado para el nombre de la materia
      examDate?: string; // CORREGIDO: Parámetro para la fecha del examen
      color?: string; // CORREGIDO: Parámetro para el color de la materia
      importantDates?: Array<{
        name: string;
        date: string;
        type: 'exam' | 'tp' | 'other';
      }>; // CORREGIDO: Parámetro para las fechas importantes
      storagePath: string;
      fileType: string;
    }) => {
      if (!user) {
        setError('Usuario no autenticado');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const materialId = await DatabaseService.createMaterial({
          userId: user.uid,
          ...materialData,
        });

        console.log('✅ Material creado:', materialId);
        return materialId;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        console.error('❌ Error al crear material:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  // Crear plan de estudio
  const createStudyPlan = useCallback(
    async (planData: {
      materialId: string;
      generatedPlan: {
        title: string;
        summary?: string;
        durationDays: number;
        examDate?: string;
        selectedWeekDays?: number[];
        topics?: Topic[];
        studyDates?: string[];
        subjectColor?: string; // CORREGIDO: Campo para el color de la materia
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
        };
        dailyTasks: Array<{ day: number; task: string; completed?: boolean }>;
      };
    }) => {
      if (!user) {
        setError('Usuario no autenticado');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const planId = await DatabaseService.createStudyPlan({
          userId: user.uid,
          materialId: planData.materialId,
          generatedPlan: planData.generatedPlan,
        });

        console.log('✅ Plan de estudio creado:', planId);
        return planId;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        console.error('❌ Error al crear plan de estudio:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  // Obtener materiales del usuario
  const getUserMaterials = useCallback(async (): Promise<Material[]> => {
    if (!user) {
      setError('Usuario no autenticado');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const materials = await DatabaseService.getUserMaterials(user.uid);
      console.log('✅ Materiales obtenidos:', materials.length);
      return materials;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error al obtener materiales:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Obtener planes de estudio del usuario
  const getUserStudyPlans = useCallback(async (): Promise<StudyPlan[]> => {
    if (!user) {
      setError('Usuario no autenticado');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const plans = await DatabaseService.getUserStudyPlans(user.uid);
      console.log('✅ Planes de estudio obtenidos:', plans.length);
      return plans;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error al obtener planes de estudio:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Actualizar tarea completada
  const updateTaskCompletion = useCallback(
    async (planId: string, day: number, completed: boolean) => {
      setLoading(true);
      setError(null);

      try {
        await DatabaseService.updateTaskCompletion(planId, day, completed);
        console.log('✅ Tarea actualizada');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        console.error('❌ Error al actualizar tarea:', err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Eliminar material y planes asociados
  const deleteMaterialAndPlans = useCallback(async (materialId: string) => {
    setLoading(true);
    setError(null);

    try {
      await DatabaseService.deleteMaterialAndPlans(materialId);
      console.log('✅ Material y planes eliminados');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error al eliminar material:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar plan de estudio específico
  const deleteStudyPlan = useCallback(async (planId: string) => {
    setLoading(true);
    setError(null);

    try {
      await DatabaseService.deleteStudyPlan(planId);
      console.log('✅ Plan de estudio eliminado');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error al eliminar plan:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear conversación de IA
  const createAIConversation = useCallback(
    async (conversationData: {
      title: string;
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        messageType?: 'text' | 'system' | 'error';
      }>;
    }) => {
      if (!user) {
        setError('Usuario no autenticado');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const conversationId = await DatabaseService.createAIConversation({
          userId: user.uid,
          title: conversationData.title,
          messages: conversationData.messages.map((msg) => ({
            ...msg,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Timestamp.now(),
          })),
        });

        console.log('✅ Conversación de IA creada:', conversationId);
        return conversationId;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        console.error('❌ Error al crear conversación de IA:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  // Agregar mensaje a conversación
  const addMessageToConversation = useCallback(
    async (
      conversationId: string,
      message: Omit<AIConversationMessage, 'id' | 'timestamp'>,
    ) => {
      setLoading(true);
      setError(null);

      try {
        await DatabaseService.addMessageToConversation(conversationId, message);
        console.log('✅ Mensaje agregado a conversación');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        console.error('❌ Error al agregar mensaje:', err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Obtener conversaciones de IA del usuario
  const getUserAIConversations = useCallback(async (): Promise<
    AIConversation[]
  > => {
    if (!user) {
      setError('Usuario no autenticado');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const conversations = await DatabaseService.getUserAIConversations(
        user.uid,
      );
      console.log('✅ Conversaciones de IA obtenidas:', conversations.length);
      return conversations;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error al obtener conversaciones de IA:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Eliminar conversación de IA
  const deleteAIConversation = useCallback(async (conversationId: string) => {
    setLoading(true);
    setError(null);

    try {
      await DatabaseService.deleteAIConversation(conversationId);
      console.log('✅ Conversación de IA eliminada');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error al eliminar conversación de IA:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar título de conversación
  const updateConversationTitle = useCallback(
    async (conversationId: string, title: string) => {
      setLoading(true);
      setError(null);

      try {
        await DatabaseService.updateConversationTitle(conversationId, title);
        console.log('✅ Título de conversación actualizado');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        console.error('❌ Error al actualizar título:', err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Crear evento de usuario
  const createUserEvent = useCallback(
    async (eventData: Omit<UserEvent, 'id' | 'createdAt' | 'userId'>) => {
      if (!user) {
        setError('Usuario no autenticado');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const eventToCreate: Omit<UserEvent, 'id' | 'createdAt'> = {
          userId: user.uid,
          ...eventData,
        };
        const eventId = await DatabaseService.createUserEvent(eventToCreate);

        console.log('✅ Evento de usuario creado:', eventId);
        return eventId;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        console.error('❌ Error al crear evento de usuario:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  // Obtener eventos de usuario
  const getUserEvents = useCallback(async (): Promise<UserEvent[]> => {
    if (!user) {
      setError('Usuario no autenticado');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const events = await DatabaseService.getUserEvents(user.uid);
      console.log('✅ Eventos de usuario obtenidos:', events.length);
      return events;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error al obtener eventos de usuario:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    error,
    clearError,
    createMaterial,
    createStudyPlan,
    getUserMaterials,
    getUserStudyPlans,
    updateTaskCompletion,
    deleteMaterialAndPlans,
    deleteStudyPlan,
    // AI Conversation methods
    createAIConversation,
    addMessageToConversation,
    getUserAIConversations,
    deleteAIConversation,
    updateConversationTitle,
    createUserEvent, // Add this line
    getUserEvents, // Add this line
  };
};
