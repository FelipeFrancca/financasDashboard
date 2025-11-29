import { Router } from 'express';
import * as alertasController from '../controllers/alertasController';
import { authenticateToken } from '../middleware/auth';
import { validateParams, idParamSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', authenticateToken, asyncHandler(alertasController.listarAlertas as any as any));
router.put('/:id/read', authenticateToken, asyncHandler(alertasController.marcarComoLido as any as any));
router.put('/read-all', authenticateToken, asyncHandler(alertasController.marcarTodosComoLidos as any as any));
router.delete('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(alertasController.deletarAlerta as any));

export default router;
