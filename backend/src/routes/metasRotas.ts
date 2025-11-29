import { Router } from 'express';
import * as metasController from '../controllers/metasController';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams, validateQuery, idParamSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { createGoalSchema, updateGoalSchema, queryGoalsSchema } from '../dtos/goal.dto';

const router = Router();

router.post('/', authenticateToken, validateBody(createGoalSchema), asyncHandler(metasController.criarMeta as any));
router.get('/', authenticateToken, validateQuery(queryGoalsSchema), asyncHandler(metasController.listarMetas as any));
router.get('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(metasController.obterMeta as any));
router.put('/:id', authenticateToken, validateParams(idParamSchema), validateBody(updateGoalSchema), asyncHandler(metasController.atualizarMeta as any));
router.delete('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(metasController.deletarMeta as any));

export default router;
