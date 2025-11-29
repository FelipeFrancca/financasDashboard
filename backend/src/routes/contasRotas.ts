import { Router } from 'express';
import * as contasController from '../controllers/contasController';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams, validateQuery, idParamSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { createAccountSchema, updateAccountSchema, queryAccountsSchema } from '../dtos/account.dto';

const router = Router();

router.post('/', authenticateToken, validateBody(createAccountSchema), asyncHandler(contasController.criarConta as any));
router.get('/', authenticateToken, validateQuery(queryAccountsSchema), asyncHandler(contasController.listarContas as any));
router.get('/balance', authenticateToken, asyncHandler(contasController.obterSaldoTotal as any));
router.get('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(contasController.obterConta as any));
router.put('/:id', authenticateToken, validateParams(idParamSchema), validateBody(updateAccountSchema), asyncHandler(contasController.atualizarConta as any));
router.delete('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(contasController.deletarConta as any));

export default router;
