import { useState, useCallback, useContext } from 'react';
import { Timestamp } from 'firebase/firestore';
import { DatabaseService } from '../services/DatabaseService';
import type {
  Material,
  StudyPlan,
  AIConversation,
  AIConversationMessage,
  UserEvent,
  Quiz,
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
      extractedTopics?: Array<{
        id: string;
        name?: string;
        description?: string;
        order?: number;
      }>;
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
        // Si no vienen selectedWeekDays en el plan, leer la configuración del usuario
        const generatedPlan = { ...planData.generatedPlan };
        if (
          (!generatedPlan.selectedWeekDays ||
            generatedPlan.selectedWeekDays.length === 0) &&
          user
        ) {
          try {
            const settings = await DatabaseService.getUserAvailability(
              user.uid,
            );
            if (
              settings &&
              Array.isArray(settings.selectedWeekDays) &&
              settings.selectedWeekDays.length > 0
            ) {
              generatedPlan.selectedWeekDays = settings.selectedWeekDays;
            }
          } catch (e) {
            console.warn(
              'No se pudo leer settings de usuario, se usará lo provisto en el plan o los valores por defecto',
              e,
            );
          }
        }

        const planId = await DatabaseService.createStudyPlan({
          userId: user.uid,
          materialId: planData.materialId,
          generatedPlan,
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
  const getUserStudyPlans = useCallback(async () => {
    if (!user) {
      setError('Usuario no autenticado');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const plans = await DatabaseService.getUserStudyPlans(user.uid);
      return plans;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al obtener planes';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Actualizar plan de estudio
  const updateStudyPlan = useCallback(
    async (planId: string, updatedPlan: Partial<StudyPlan>) => {
      if (!user) {
        setError('Usuario no autenticado');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        await DatabaseService.updateStudyPlan(planId, updatedPlan);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error al actualizar plan';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

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

  const getQuizzes = useCallback(async (): Promise<Quiz[]> => {
    if (!user) {
      setError('Usuario no autenticado');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const quizzes = await DatabaseService.getQuizzes(user.uid);
      console.log('✅ Quizzes obtenidos:', quizzes.length);
      return quizzes;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error al obtener quizzes:', err);
      return [];
    }
  }, [user]);

  const getQuiz = useCallback(
    async (quizId: string): Promise<Quiz | null> => {
      if (!user) {
        setError('Usuario no autenticado');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const quiz = await DatabaseService.getQuiz(quizId);
        console.log('✅ Quiz obtenido:', quiz);
        return quiz;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        console.error('❌ Error al obtener quiz:', err);
        return null;
      }
    },
    [user],
  );

  const deleteQuiz = useCallback(async (quizId: string) => {
    setLoading(true);
    setError(null);

    try {
      await DatabaseService.deleteQuiz(quizId);
      console.log('✅ Quiz eliminado:', quizId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error al eliminar quiz:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Obtener conteo de ciclos Pomodoro
  const getPomodoroCyclesCount = useCallback(async (): Promise<number> => {
    if (!user) {
      setError('Usuario no autenticado');
      return 0;
    }
    setLoading(true);
    setError(null);
    try {
      const count = await DatabaseService.getPomodoroCyclesCount(user.uid);
      return count;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error al obtener conteo de ciclos:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Obtener cantidad de materias activas
  const getActiveSubjectsCount = useCallback(async (): Promise<number> => {
    if (!user) {
      setError('Usuario no autenticado');
      return 0;
    }
    setLoading(true);
    setError(null);
    try {
      const count = await DatabaseService.getActiveSubjectsCount(user.uid);
      return count;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error al obtener materias activas:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Guardar registro de ciclo Pomodoro
  const savePomodoroCycle = useCallback(
    async (
      completed: boolean = true,
      mode: 'pomodoro' | 'short-break' | 'long-break' = 'pomodoro',
      completedAt?: Timestamp,
    ) => {
      if (!user) {
        setError('Usuario no autenticado');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const id = await DatabaseService.recordPomodoroCycle(
          user.uid,
          completed,
          mode,
          completedAt,
        );
        console.log('✅ Ciclo Pomodoro guardado:', id);
        return id;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        console.error('❌ Error al guardar ciclo Pomodoro:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  return {
    loading,
    error,
    clearError,
    createMaterial,
    createStudyPlan,
    updateStudyPlan,
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
    getQuizzes,
    getQuiz,
    deleteQuiz,
    savePomodoroCycle,
    getPomodoroCyclesCount,
    getActiveSubjectsCount,
    saveUserAvailability: DatabaseService.saveUserAvailability,
    getUserAvailability: DatabaseService.getUserAvailability,
  };
};
