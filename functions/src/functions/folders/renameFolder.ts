import { onRequest } from 'firebase-functions/https';
import {
  corsHandler,
  addCorsHeaders,
  handleOptionsRequest,
} from '../../utils/cors';
import { validateRequiredFields } from '../../utils/validation';
import { db } from '../../firebaseAdmin';
import * as admin from 'firebase-admin';

export const renameFolder = onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      handleOptionsRequest(res, req.headers.origin as string | undefined);
      return;
    }

    corsHandler(req, res, async () => {
      addCorsHeaders(res, req.headers.origin as string | undefined);

      if (req.method !== 'POST') {
        res.status(405).json({
          success: false,
          error: 'Método no permitido. Usa POST.',
        });
        return;
      }

      try {
        // Verificar autenticación
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({
            success: false,
            error: 'No se proporcionó token de autenticación',
          });
          return;
        }

        // Verificar token y obtener UID
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const { folderId, newName } = req.body;

        // Validación mejorada
        const validationError = validateRequiredFields(req.body, [
          'folderId',
          'newName',
        ]);
        if (validationError) {
          res.status(400).json({
            success: false,
            error: validationError,
          });
          return;
        }

        console.log(
          `📝 Renombrando carpeta ${folderId} para usuario ${userId}`,
        );

        // Verificar que la carpeta existe y pertenece al usuario
        const folderRef = db.collection('folders').doc(folderId);
        const folderDoc = await folderRef.get();

        if (!folderDoc.exists) {
          res.status(404).json({
            success: false,
            error: 'Carpeta no encontrada',
          });
          return;
        }

        const folderData = folderDoc.data();
        if (folderData?.userId !== userId) {
          res.status(403).json({
            success: false,
            error: 'No tienes permisos para modificar esta carpeta',
          });
          return;
        }

        // Actualizar el nombre de la carpeta
        await folderRef.update({
          name: newName.trim(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(
          `✅ Carpeta ${folderId} renombrada exitosamente a "${newName}"`,
        );

        res.status(200).json({
          success: true,
          message: 'Carpeta renombrada exitosamente',
          folderId,
          newName: newName.trim(),
        });
      } catch (error: unknown) {
        console.error('❌ Error renombrando carpeta:', error);

        if (error instanceof Error && error.message.includes('auth')) {
          res.status(401).json({
            success: false,
            error: 'Token de autenticación inválido',
          });
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
          details: errorMessage,
        });
      }
    });
  },
);
