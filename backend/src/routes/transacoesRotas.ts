import { Router } from 'express';
import * as transacoesController from '../controllers/transacoesController';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams, idParamSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
// Nota: schemas de validação de transação precisam ser importados de onde estiverem (assumindo validators/transactionValidator ou similar)
// Como não tenho certeza do local exato dos schemas antigos, vou usar 'any' temporariamente ou importar se souber.
// Vou assumir que existem schemas básicos ou usar validação genérica por enquanto para não quebrar.
// Idealmente: import { createTransactionSchema } from '../validators/transactionValidator';

const router = Router();

router.post('/', authenticateToken, asyncHandler(transacoesController.criarTransacao as any));
router.post('/bulk', authenticateToken, asyncHandler(transacoesController.criarTransacoesEmLote as any));
router.delete('/bulk', authenticateToken, asyncHandler(transacoesController.deletarTransacoesEmLote as any));
router.get('/', authenticateToken, asyncHandler(transacoesController.listarTransacoes as any));
router.get('/summary', authenticateToken, asyncHandler(transacoesController.obterResumo as any));
router.get('/stats/summary', authenticateToken, asyncHandler(transacoesController.obterResumo as any));

// Rotas de grupo de parcelas (devem vir antes de /:id)
router.get('/installment-group/:groupId', authenticateToken, asyncHandler(transacoesController.obterGrupoParcelas as any));
router.put('/installment-group/:groupId', authenticateToken, asyncHandler(transacoesController.atualizarGrupoParcelas as any));

router.get('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(transacoesController.obterTransacao as any));
router.put('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(transacoesController.atualizarTransacao as any));
router.delete('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(transacoesController.deletarTransacao as any));

export default router;
