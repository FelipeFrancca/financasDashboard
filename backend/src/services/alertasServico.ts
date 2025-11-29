import { Alert, AlertType, AlertSeverity, Prisma } from '@prisma/client';
import { prisma } from '../database/conexao';
import { logger } from '../utils/logger';

export async function createAlert(
    userId: string,
    data: {
        type: AlertType;
        severity: AlertSeverity;
        title: string;
        message: string;
        relatedType?: string;
        relatedId?: string;
        metadata?: any;
    }
) {
    return prisma.alert.create({
        data: {
            ...data,
            userId,
        },
    });
}

export async function getAlerts(userId: string, unreadOnly = false) {
    return prisma.alert.findMany({
        where: {
            userId,
            ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
}

export async function markAsRead(alertId: string, userId: string) {
    return prisma.alert.updateMany({
        where: { id: alertId, userId },
        data: { isRead: true, readAt: new Date() },
    });
}

export async function markAllAsRead(userId: string) {
    return prisma.alert.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
    });
}

// Função para verificar alertas automáticos (pode ser chamada por cron)
export async function checkAutomaticAlerts(userId: string) {
    // 1. Verificar Orçamentos
    const budgets = await prisma.budget.findMany({
        where: { userId, isActive: true, deletedAt: null },
    });

    // Lógica simplificada de verificação...
    // Implementação real seria mais complexa
}

export async function deleteAlert(alertId: string, userId: string) {
    return prisma.alert.deleteMany({
        where: { id: alertId, userId },
    });
}
