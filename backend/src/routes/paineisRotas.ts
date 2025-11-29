import { Router } from 'express';
import * as paineisController from '../controllers/paineisController';
import { authenticateToken } from '../middleware/auth';
import { validateParams, idParamSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';


const router = Router();

// CRUD de dashboards
router.get('/', authenticateToken, asyncHandler(paineisController.listarDashboards as any));
router.post('/', authenticateToken, asyncHandler(paineisController.criarDashboard as any));

// Convites
router.post('/accept-invite', authenticateToken, asyncHandler(paineisController.aceitarConvite as any));
router.get('/shared/:code', asyncHandler(paineisController.obterPreviewConvite as any)); // Public route (maybe?) or auth required? Frontend sends token if logged in, but preview might be public. Let's assume public for now or check if frontend sends token.
// Actually, usually preview is public. But let's check frontend.
// Frontend: dashboardService.getSharedPreview(code) -> api.get.
// If user is not logged in, api.ts might not send token.
// But let's keep it open for now or require auth if needed.
// The controller uses req.params.code, doesn't need req.user for preview.
// So I will NOT add authenticateToken for preview.

router.post('/:id/invites', authenticateToken, validateParams(idParamSchema), asyncHandler(paineisController.criarConvite as any));

// Gerenciamento de membros
router.post('/:id/members', authenticateToken, validateParams(idParamSchema), asyncHandler(paineisController.adicionarMembro as any));
router.delete('/:id/members/:userId', authenticateToken, validateParams(idParamSchema), asyncHandler(paineisController.removerMembro as any));
router.get('/:id/members', authenticateToken, validateParams(idParamSchema), asyncHandler(paineisController.listarMembros as any));

export default router;

