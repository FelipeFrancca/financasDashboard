import { Alert, AlertType, AlertSeverity, Prisma } from '@prisma/client';
import { prisma } from '../database/conexao';
import { logger } from '../utils/logger';

export async function createAlert(
    dashboardId: string,
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
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR']);

    return prisma.alert.create({
        data: {
            ...data,
            dashboardId,
        },
    });
}

export async function getAlerts(dashboardId: string, userId: string, unreadOnly = false) {
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId);

    return prisma.alert.findMany({
        where: {
            dashboardId,
            ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
}

export async function markAsRead(alertId: string, dashboardId: string, userId: string) {
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId);

    return prisma.alert.updateMany({
        where: { id: alertId, dashboardId },
        data: { isRead: true, readAt: new Date() },
    });
}

export async function markAllAsRead(dashboardId: string, userId: string) {
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId);

    return prisma.alert.updateMany({
        where: { dashboardId, isRead: false },
        data: { isRead: true, readAt: new Date() },
    });
}

export async function checkAutomaticAlerts(dashboardId: string, userId: string) {
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId);

    // Verificar Orçamentos
    const budgets = await prisma.budget.findMany({
        where: { dashboardId, isActive: true, deletedAt: null },
    });

    // Lógica simplificada de verificação
    // Implementação real seria mais complexa
}

export async function deleteAlert(alertId: string, dashboardId: string, userId: string) {
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR']);

    return prisma.alert.deleteMany({
        where: { id: alertId, dashboardId },
    });
}
