import { Router } from 'express';
import * as orcamentosController from '../controllers/orcamentosController';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams, validateQuery, idParamSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { createBudgetSchema, updateBudgetSchema, queryBudgetsSchema } from '../dtos/budget.dto';

const router = Router();

router.post('/', authenticateToken, validateBody(createBudgetSchema), asyncHandler(orcamentosController.criarOrcamento as any));
router.get('/', authenticateToken, validateQuery(queryBudgetsSchema), asyncHandler(orcamentosController.listarOrcamentos as any));
router.get('/summary', authenticateToken, asyncHandler(orcamentosController.obterResumo as any));
router.get('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(orcamentosController.obterOrcamento as any));
router.put('/:id', authenticateToken, validateParams(idParamSchema), validateBody(updateBudgetSchema), asyncHandler(orcamentosController.atualizarOrcamento as any));
router.delete('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(orcamentosController.deletarOrcamento as any));

export default router;
