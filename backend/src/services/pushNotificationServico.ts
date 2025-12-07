/**
 * Push Notification Service
 * Handles Web Push notifications using the web-push library
 */

import webpush from 'web-push';
import { prisma } from '../database/conexao';
import { logger } from '../utils/logger';
import { getNotificationPreferences } from './notificationPreferencesServico';

// Initialize VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@finchart.com.br';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    logger.info('Push notifications initialized with VAPID keys');
} else {
    logger.warn('VAPID keys not configured - push notifications disabled');
}

/**
 * Get the public VAPID key for frontend subscription
 */
export function getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
}

/**
 * Check if push notifications are configured
 */
export function isPushEnabled(): boolean {
    return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

/**
 * Subscribe a user to push notifications
 */
export async function subscribe(
    userId: string,
    subscription: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    },
    userAgent?: string
) {
    if (!isPushEnabled()) {
        throw new Error('Push notifications are not configured');
    }

    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findUnique({
        where: { endpoint: subscription.endpoint },
    });

    if (existing) {
        // Update existing subscription
        return prisma.pushSubscription.update({
            where: { endpoint: subscription.endpoint },
            data: {
                userId,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userAgent,
            },
        });
    }

    // Create new subscription
    return prisma.pushSubscription.create({
        data: {
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            userAgent,
        },
    });
}

/**
 * Unsubscribe a user from push notifications
 */
export async function unsubscribe(userId: string, endpoint: string) {
    return prisma.pushSubscription.deleteMany({
        where: {
            userId,
            endpoint,
        },
    });
}

/**
 * Unsubscribe all devices for a user
 */
export async function unsubscribeAll(userId: string) {
    return prisma.pushSubscription.deleteMany({
        where: { userId },
    });
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(userId: string) {
    return prisma.pushSubscription.findMany({
        where: { userId },
    });
}

/**
 * Check if user has any active subscriptions
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
    const count = await prisma.pushSubscription.count({
        where: { userId },
    });
    return count > 0;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification(
    userId: string,
    payload: {
        title: string;
        body: string;
        icon?: string;
        badge?: string;
        tag?: string;
        data?: Record<string, any>;
        actions?: Array<{ action: string; title: string; icon?: string }>;
    }
) {
    if (!isPushEnabled()) {
        logger.debug('Push notifications disabled, skipping');
        return { sent: 0, failed: 0 };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
    });

    if (subscriptions.length === 0) {
        logger.debug(`No push subscriptions found for user ${userId}`);
        return { sent: 0, failed: 0 };
    }

    const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/finchart-logo.png',
        badge: payload.badge || '/finchart-logo.png',
        tag: payload.tag,
        data: payload.data || {},
        actions: payload.actions,
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                },
                notificationPayload
            );
            sent++;
        } catch (error: any) {
            failed++;
            logger.error(`Failed to send push to ${sub.endpoint}:`, error.message);

            // Remove invalid subscriptions (410 Gone or 404 Not Found)
            if (error.statusCode === 410 || error.statusCode === 404) {
                await prisma.pushSubscription.delete({
                    where: { id: sub.id },
                }).catch(() => { });
                logger.info(`Removed expired subscription ${sub.id}`);
            }
        }
    }

    logger.info(`Push notifications sent: ${sent} success, ${failed} failed for user ${userId}`);
    return { sent, failed };
}

/**
 * Send push notification for a budget alert
 */
export async function sendBudgetAlertPush(
    userId: string,
    data: {
        categoria: string;
        percentual: number;
        limite: number;
        gasto: number;
    }
) {
    const preferences = await getNotificationPreferences(userId);

    if (!preferences.inAppEnabled || !preferences.inAppBudgetAlerts) {
        return;
    }

    return sendPushNotification(userId, {
        title: '⚠️ Alerta de Orçamento',
        body: `Você usou ${data.percentual.toFixed(0)}% do orçamento de ${data.categoria}`,
        tag: `budget-${data.categoria}`,
        data: {
            type: 'BUDGET_ALERT',
            url: '/dashboard/alerts',
            ...data,
        },
        actions: [
            { action: 'view', title: 'Ver detalhes' },
            { action: 'dismiss', title: 'Dispensar' },
        ],
    });
}

/**
 * Send push notification for a goal milestone
 */
export async function sendGoalMilestonePush(
    userId: string,
    data: {
        meta: string;
        percentual: number;
        valorAtual: number;
        valorAlvo: number;
    }
) {
    const preferences = await getNotificationPreferences(userId);

    if (!preferences.inAppEnabled || !preferences.inAppGoalMilestones) {
        return;
    }

    const emoji = data.percentual >= 100 ? '🎉' : '📈';
    const message = data.percentual >= 100
        ? `Parabéns! Você atingiu sua meta "${data.meta}"!`
        : `Você atingiu ${data.percentual.toFixed(0)}% da meta "${data.meta}"`;

    return sendPushNotification(userId, {
        title: `${emoji} Marco de Meta`,
        body: message,
        tag: `goal-${data.meta}`,
        data: {
            type: 'GOAL_MILESTONE',
            url: '/dashboard/goals',
            ...data,
        },
        actions: [
            { action: 'view', title: 'Ver meta' },
        ],
    });
}

/**
 * Send push notification for dashboard activity
 */
export async function sendDashboardActivityPush(
    userId: string,
    data: {
        dashboardName: string;
        actorName: string;
        action: string;
    }
) {
    const preferences = await getNotificationPreferences(userId);

    if (!preferences.inAppEnabled || !preferences.inAppDashboardActivity) {
        return;
    }

    return sendPushNotification(userId, {
        title: '📊 Atividade no Dashboard',
        body: `${data.actorName} ${data.action} em "${data.dashboardName}"`,
        tag: `activity-${data.dashboardName}`,
        data: {
            type: 'DASHBOARD_ACTIVITY',
            url: '/dashboards',
            ...data,
        },
    });
}

/**
 * Send push notification for dashboard invite
 */
export async function sendDashboardInvitePush(
    userId: string,
    data: {
        dashboardName: string;
        inviterName: string;
        role: string;
    }
) {
    const preferences = await getNotificationPreferences(userId);

    if (!preferences.inAppEnabled || !preferences.inAppDashboardInvites) {
        return;
    }

    return sendPushNotification(userId, {
        title: '📨 Convite de Dashboard',
        body: `${data.inviterName} convidou você para "${data.dashboardName}" como ${data.role}`,
        tag: `invite-${data.dashboardName}`,
        data: {
            type: 'DASHBOARD_INVITE',
            url: '/dashboards',
            ...data,
        },
        actions: [
            { action: 'view', title: 'Ver convite' },
        ],
    });
}
