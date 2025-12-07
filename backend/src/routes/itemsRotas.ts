import { Router } from 'express';
import * as itemsController from '../controllers/itemsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/:dashboardId/items/stats', itemsController.getItemStats as any);

export default router;
