import { useState, useCallback, useContext } from 'react';
import { DatabaseService } from '../services/DatabaseService';
import type { Material, StudyPlan } from '../services/DatabaseService';
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
        topics?: string[];
        studyDates?: string[];
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

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
  };
};
