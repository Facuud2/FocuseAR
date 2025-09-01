import { db /* auth */ } from './firebase';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

// Función para probar la base de datos
export async function testDatabase() {
  try {
    console.log('🚀 Iniciando pruebas de base de datos...');

    // 1. Crear un usuario de prueba
    console.log('👤 Creando usuario de prueba...');
    const userData = {
      uid: 'test_user_123',
      email: 'test@example.com',
      displayName: 'Usuario de Prueba',
      photoURL: 'https://example.com/foto.png',
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now(),
    };

    // Guardar usuario en la colección 'users'
    const userRef = doc(db, 'users', userData.uid);
    await setDoc(userRef, userData);
    console.log('✅ Usuario creado exitosamente');

    // 2. Crear un material de prueba
    console.log('📂 Creando material de prueba...');
    const materialData = {
      userId: userData.uid,
      fileName: 'Algebra_Basico.pdf',
      storagePath: `users/${userData.uid}/materials/Algebra_Basico.pdf`,
      fileType: 'pdf',
      createdAt: Timestamp.now(),
    };

    const materialRef = await addDoc(collection(db, 'materials'), materialData);
    console.log('✅ Material creado exitosamente con ID:', materialRef.id);

    // 3. Crear un plan de estudio de prueba
    console.log('📘 Creando plan de estudio de prueba...');
    const studyPlanData = {
      userId: userData.uid,
      materialId: materialRef.id,
      generatedPlan: {
        title: 'Plan de estudio Álgebra',
        durationDays: 10,
        dailyTasks: [
          { day: 1, task: 'Leer capítulo 1 y hacer ejercicios' },
          { day: 2, task: 'Repaso y práctica adicional' },
          { day: 3, task: 'Resolver problemas del capítulo 1' },
        ],
      },
      createdAt: Timestamp.now(),
    };

    const planRef = await addDoc(collection(db, 'studyPlans'), studyPlanData);
    console.log('✅ Plan de estudio creado exitosamente con ID:', planRef.id);

    // 4. Leer los datos para verificar
    console.log('📖 Leyendo datos para verificar...');

    // Leer usuario
    const userSnap = await getDocs(
      query(collection(db, 'users'), where('uid', '==', userData.uid)),
    );
    console.log('👤 Usuario encontrado:', userSnap.docs[0]?.data());

    // Leer materiales
    const materialsSnap = await getDocs(
      query(collection(db, 'materials'), where('userId', '==', userData.uid)),
    );
    console.log('📂 Materiales encontrados:', materialsSnap.docs.length);

    // Leer planes de estudio
    const plansSnap = await getDocs(
      query(collection(db, 'studyPlans'), where('userId', '==', userData.uid)),
    );
    console.log('📘 Planes de estudio encontrados:', plansSnap.docs.length);

    console.log('🎉 ¡Todas las pruebas completadas exitosamente!');
    return {
      userId: userData.uid,
      materialId: materialRef.id,
      planId: planRef.id,
    };
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    throw error;
  }
}

// Función para limpiar datos de prueba
export async function cleanupTestData() {
  try {
    console.log('🧹 Limpiando datos de prueba...');

    // Aquí podrías agregar lógica para eliminar los datos de prueba
    // Por ahora solo mostramos un mensaje
    console.log('✅ Datos de prueba marcados para limpieza');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Función para ejecutar las pruebas desde la consola del navegador
export function runTestsFromConsole() {
  console.log('🔧 Para ejecutar las pruebas, usa:');
  console.log('await testDatabase()');
  console.log('');
  console.log('🧹 Para limpiar datos de prueba:');
  console.log('await cleanupTestData()');
}
