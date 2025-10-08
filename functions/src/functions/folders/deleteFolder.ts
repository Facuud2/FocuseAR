import { onRequest } from 'firebase-functions/https';
import {
  corsHandler,
  addCorsHeaders,
  handleOptionsRequest,
} from '../../utils/cors';
import { validateRequiredFields } from '../../utils/validation';
import { db } from '../../firebaseAdmin';
import * as admin from 'firebase-admin';

export const deleteFolder = onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      handleOptionsRequest(res);
      return;
    }

    corsHandler(req, res, async () => {
      addCorsHeaders(res);

      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido. Usa POST.' });
        return;
      }

      try {
        // Verificar autenticación
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({
            error: 'No se proporcionó token de autenticación',
          });
          return;
        }

        // Verificar token y obtener UID
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const { folderId } = req.body;

        // Validación mejorada
        const validationError = validateRequiredFields(req.body, ['folderId']);
        if (validationError) {
          res.status(400).json({ error: validationError });
          return;
        }

        console.log(`🗑️ Eliminando carpeta ${folderId} para usuario ${userId}`);

        // Obtener la carpeta a eliminar
        const folderRef = db.collection('folders').doc(folderId);
        const folderDoc = await folderRef.get();

        if (!folderDoc.exists) {
          res.status(404).json({
            error: 'Carpeta no encontrada',
          });
          return;
        }

        const folderData = folderDoc.data();

        // Verificar permisos
        if (folderData?.userId !== userId) {
          res.status(403).json({
            error: 'No tienes permisos para eliminar esta carpeta',
          });
          return;
        }

        const folderPath = folderData.path;

        // Buscar subcarpetas recursivamente
        const subFoldersQuery = db
          .collection('folders')
          .where('path', '>=', folderPath)
          .where('path', '<', folderPath + '\\uffff')
          .where('userId', '==', userId);

        const subFoldersSnapshot = await subFoldersQuery.get();

        // Eliminar en lote
        const batch = db.batch();

        // Agregar carpeta principal al lote
        batch.delete(folderRef);

        // Agregar subcarpetas al lote
        subFoldersSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Ejecutar eliminación en lote
        await batch.commit();

        const totalDeleted = 1 + subFoldersSnapshot.docs.length;

        console.log(`✅ Eliminadas ${totalDeleted} carpetas exitosamente`);

        res.status(200).json({
          success: true,
          message: `Carpeta y ${subFoldersSnapshot.docs.length} subcarpetas eliminadas exitosamente`,
          deletedCount: totalDeleted,
        });
      } catch (error: unknown) {
        console.error('❌ Error eliminando carpeta:', error);

        if (error instanceof Error && error.message.includes('auth')) {
          res.status(401).json({
            error: 'Token de autenticación inválido',
          });
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
          error: 'Error interno del servidor al eliminar carpeta',
          details: errorMessage,
        });
      }
    });
  },
);
