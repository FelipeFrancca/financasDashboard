import { Router } from 'express';
import * as paineisController from '../controllers/paineisController';
import { authenticateToken } from '../middleware/auth';
import { validateParams, idParamSchema, idUserIdParamSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';


const router = Router();

// CRUD de dashboards
router.get('/', authenticateToken, asyncHandler(paineisController.listarDashboards as any));
router.post('/', authenticateToken, asyncHandler(paineisController.criarDashboard as any));
router.put('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(paineisController.atualizarDashboard as any));
router.delete('/:id', authenticateToken, validateParams(idParamSchema), asyncHandler(paineisController.excluirDashboard as any));

// Convites
router.post('/accept-invite', authenticateToken, asyncHandler(paineisController.aceitarConvite as any));
router.get('/shared/:code', asyncHandler(paineisController.obterPreviewConvite as any));

router.post('/:id/invites', authenticateToken, validateParams(idParamSchema), asyncHandler(paineisController.criarConvite as any));

// Gerenciamento de membros
router.post('/:id/members', authenticateToken, validateParams(idParamSchema), asyncHandler(paineisController.adicionarMembro as any));
router.put('/:id/members/:userId', authenticateToken, validateParams(idUserIdParamSchema), asyncHandler(paineisController.atualizarMembro as any));
router.put('/:id/members/:userId/approve', authenticateToken, validateParams(idUserIdParamSchema), asyncHandler(paineisController.aprovarMembro as any));
router.delete('/:id/members/:userId', authenticateToken, validateParams(idUserIdParamSchema), asyncHandler(paineisController.removerMembro as any));
router.get('/:id/members', authenticateToken, validateParams(idParamSchema), asyncHandler(paineisController.listarMembros as any));

export default router;

