import { Router } from 'express';
import * as recorrenciaController from '../controllers/recorrenciaController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// Schema simplificado (ideal mover para DTO)
const createRecurringSchema = z.object({
    description: z.string(),
    amount: z.number(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    startDate: z.coerce.date(),
    category: z.string(),
    entryType: z.enum(['Receita', 'Despesa']),
});

router.post('/', authenticateToken, validateBody(createRecurringSchema), asyncHandler(recorrenciaController.criarRecorrencia as any as any));
router.get('/', authenticateToken, asyncHandler(recorrenciaController.listarRecorrencias as any as any));
router.post('/process', authenticateToken, asyncHandler(recorrenciaController.processarRecorrencias as any as any));

export default router;
