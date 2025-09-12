import { getDocs, collection } from 'firebase/firestore';
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
  const studyPlansSnap = await getDocs(collection(db, 'studyPlans'));
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
    let topics: string[] = [];
    if (plan.generatedPlan && Array.isArray(plan.generatedPlan.topics)) {
      topics = plan.generatedPlan.topics;
    }
    results.push({ materialId, materialName, topics });
  }
  return results;
};
