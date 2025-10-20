import { onRequest } from 'firebase-functions/https';
import {
  corsHandler,
  addCorsHeaders,
  handleOptionsRequest,
} from '../../utils/cors';
import { validateRequiredFields } from '../../utils/validation';
import { FolderData } from '../../types';
import { db } from '../../firebaseAdmin';
import * as admin from 'firebase-admin';

export const createFolder = onRequest(
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

      const { name, path, userId } = req.body as FolderData;

      // Validación mejorada
      if (!userId) {
        res
          .status(401)
          .json({ error: 'No autorizado: ID de usuario no proporcionado.' });
        return;
      }

      const validationError = validateRequiredFields(req.body, [
        'name',
        'path',
      ]);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      try {
        console.log(`📁 Creando carpeta "${name}" para usuario ${userId}`);

        const folderRef = db.collection('folders').doc();
        const newPath = `${path}${folderRef.id}/`;

        await folderRef.set({
          name,
          path: newPath,
          userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✅ Carpeta creada exitosamente: ${folderRef.id}`);

        res.status(200).json({
          success: true,
          folderId: folderRef.id,
          path: newPath,
          message: 'Carpeta creada exitosamente',
        });
      } catch (error) {
        console.error('❌ Error creando carpeta:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
          error: 'Error interno del servidor al crear la carpeta',
          details: errorMessage,
        });
      }
    });
  },
);
