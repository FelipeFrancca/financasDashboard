/**
 * Rotas para ingestão de documentos financeiros
 */

import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import * as ingestionController from '../controllers/ingestionController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Rate limiting para uploads - previne DoS e abuso de quota da API
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // máximo 10 uploads por minuto por IP
    message: {
        error: {
            message: 'Muitos uploads em pouco tempo. Aguarde 1 minuto e tente novamente.',
            code: 'RATE_LIMIT_EXCEEDED'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

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
 * Rate limited: 10 requests/minute
 */
router.post(
    '/upload',
    authenticateToken,
    uploadLimiter,
    upload.single('file'),
    asyncHandler(ingestionController.uploadFinancialDocument as any)
);

export default router;

