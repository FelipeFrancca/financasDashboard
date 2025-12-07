/**
 * Push Notification Routes
 * API endpoints for managing push notification subscriptions
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as pushNotificationServico from '../services/pushNotificationServico';

const router = express.Router();

/**
 * GET /api/push/vapid-public-key
 * Get the VAPID public key for push subscription
 * Public route - no authentication required
 */
router.get('/vapid-public-key', (req, res) => {
    try {
        const publicKey = pushNotificationServico.getVapidPublicKey();
        const enabled = pushNotificationServico.isPushEnabled();

        res.json({
            success: true,
            data: {
                publicKey,
                enabled,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter chave pública VAPID',
            error: error.message,
        });
    }
});

// Apply authentication to remaining routes
router.use(authenticateToken);

/**
 * GET /api/push/status
 * Check if user has active push subscriptions
 */
router.get('/status', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
        }

        const hasSubscription = await pushNotificationServico.hasActiveSubscription(userId);
        const subscriptions = await pushNotificationServico.getUserSubscriptions(userId);

        res.json({
            success: true,
            data: {
                enabled: pushNotificationServico.isPushEnabled(),
                subscribed: hasSubscription,
                subscriptionCount: subscriptions.length,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar status de push',
            error: error.message,
        });
    }
});

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
router.post('/subscribe', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
        }

        const { subscription, userAgent } = req.body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({
                success: false,
                message: 'Dados de subscription inválidos',
            });
        }

        const result = await pushNotificationServico.subscribe(userId, subscription, userAgent);

        res.json({
            success: true,
            message: 'Inscrito em notificações push com sucesso',
            data: { id: result.id },
        });
    } catch (error: any) {
        console.error('Erro ao inscrever push:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao inscrever em notificações push',
            error: error.message,
        });
    }
});

/**
 * DELETE /api/push/unsubscribe
 * Unsubscribe from push notifications
 */
router.delete('/unsubscribe', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
        }

        const { endpoint } = req.body;

        if (endpoint) {
            // Unsubscribe specific endpoint
            await pushNotificationServico.unsubscribe(userId, endpoint);
        } else {
            // Unsubscribe all
            await pushNotificationServico.unsubscribeAll(userId);
        }

        res.json({
            success: true,
            message: 'Desinscrito de notificações push com sucesso',
        });
    } catch (error: any) {
        console.error('Erro ao desinscrever push:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao desinscrever de notificações push',
            error: error.message,
        });
    }
});

/**
 * POST /api/push/test
 * Send a test push notification (for debugging)
 */
router.post('/test', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
        }

        const result = await pushNotificationServico.sendPushNotification(userId, {
            title: '🔔 Teste de Notificação',
            body: 'Se você está vendo isso, as notificações push estão funcionando!',
            tag: 'test',
            data: {
                type: 'TEST',
                url: '/profile',
            },
        });

        res.json({
            success: true,
            message: 'Notificação de teste enviada',
            data: result,
        });
    } catch (error: any) {
        console.error('Erro ao enviar teste push:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar notificação de teste',
            error: error.message,
        });
    }
});

export default router;
