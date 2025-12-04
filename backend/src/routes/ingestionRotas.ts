/**
 * Rotas para ingestão de documentos financeiros
 */

import { Router } from 'express';
import multer from 'multer';
import * as ingestionController from '../controllers/ingestionController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Configuração do Multer (armazenamento em memória)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido. Use PDF, JPEG ou PNG.'));
        }
    },
});

/**
 * POST /ingestion/upload
 * Upload e processamento de documento financeiro (PDF, JPEG, PNG)
 * @requires Authentication
 */
router.post(
    '/upload',
    authenticateToken,
    upload.single('file'),
    asyncHandler(ingestionController.uploadFinancialDocument as any)
);

export default router;
