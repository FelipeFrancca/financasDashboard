import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as notificationPreferencesController from '../controllers/notificationPreferencesController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/notification-preferences - Get user's notification preferences
router.get('/', notificationPreferencesController.obter);

// PUT /api/notification-preferences - Update notification preferences
router.put('/', notificationPreferencesController.atualizar);

export default router;
