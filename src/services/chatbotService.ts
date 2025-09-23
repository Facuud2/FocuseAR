import { getDocs, collection, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export interface ChatbotMaterial {
  materialId: string;
  materialName: string;
  topics: string[];
}

interface StudyPlan {
  id: string;
  userId: string;
  materialId?: string;
  generatedPlan?: {
    title?: string;
    topics?: string[];
  };
  [key: string]: unknown;
}

export const getUserMaterialsAndTopics = async (
  userId: string,
): Promise<ChatbotMaterial[]> => {
  // 1. Obtener todos los planes de estudio del usuario
  const studyPlansSnap = await getDocs(collection(db, 'study_plans'));
  const studyPlans = studyPlansSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((plan) => (plan as StudyPlan).userId === userId) as StudyPlan[];

  // 2. Para cada plan, buscar el nombre de la materia y los topics
  const results: ChatbotMaterial[] = [];
  for (const plan of studyPlans) {
    // console.log('DEBUG plan completo:', plan);
    const materialId = plan.materialId || '';
    let materialName = 'Materia sin nombre';
    if (plan.generatedPlan && typeof plan.generatedPlan.title === 'string') {
      materialName = plan.generatedPlan.title;
    }
    // console.log('DEBUG materialName:', materialName, 'plan:', plan);
    // Normalizar topics para que siempre sean strings (evitar [object Object])
    const formatTopicToString = (t: unknown): string => {
      if (typeof t === 'string') return t;
      if (t === null || t === undefined) return '';
      if (typeof t === 'object') {
        const obj = t as Record<string, unknown>;
        return (
          (typeof obj.title === 'string' && obj.title) ||
          (typeof obj.name === 'string' && obj.name) ||
          (typeof obj.id === 'string' && obj.id) ||
          JSON.stringify(obj)
        );
      }
      return String(t);
    };

    let topics: string[] = [];
    if (plan.generatedPlan && Array.isArray(plan.generatedPlan.topics)) {
      topics = (
        Array.isArray(plan.generatedPlan.topics)
          ? plan.generatedPlan.topics
          : []
      )
        .map(formatTopicToString)
        .filter((s) => s && s.length > 0);
    }

    // Si no hay topics en el plan, intentar leer extractedTopics desde el material (si existe)
    if ((!topics || topics.length === 0) && materialId) {
      try {
        const materialRef = doc(db, 'materials', materialId);
        const materialSnap = await getDoc(materialRef);
        if (materialSnap.exists()) {
          const materialData = materialSnap.data();
          const extracted = materialData?.extractedTopics;
          if (Array.isArray(extracted) && extracted.length > 0) {
            topics = extracted
              .map((t: unknown) => {
                if (typeof t === 'string') return t;
                if (t && typeof t === 'object') {
                  const o = t as Record<string, unknown>;
                  return (
                    (typeof o.name === 'string' && o.name) ||
                    (typeof o.title === 'string' && o.title) ||
                    (typeof o.id === 'string' && o.id) ||
                    JSON.stringify(o)
                  );
                }
                return '';
              })
              .filter((s: string) => s && s.length > 0);
          }
        }
      } catch (e) {
        console.warn('Error leyendo extractedTopics del material:', e);
      }
    }
    results.push({ materialId, materialName, topics });
  }
  return results;
};
