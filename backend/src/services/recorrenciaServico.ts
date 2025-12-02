import { RecurringTransaction, RecurrenceFrequency } from '@prisma/client';
import { prisma } from '../database/conexao';
import { logger } from '../utils/logger';

export async function createRecurring(dashboardId: string, userId: string, data: any) {
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR']);

    // Calcular próxima data
    const nextDate = new Date(data.startDate); // Simplificado

    return prisma.recurringTransaction.create({
        data: {
            ...data,
            dashboardId,
            nextDate,
        },
    });
}

export async function getRecurring(dashboardId: string, userId: string) {
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId);

    return prisma.recurringTransaction.findMany({
        where: { dashboardId, deletedAt: null },
        orderBy: { nextDate: 'asc' },
    });
}

export async function processDueTransactions() {
    const now = new Date();

    const due = await prisma.recurringTransaction.findMany({
        where: {
            isActive: true,
            deletedAt: null,
            nextDate: { lte: now },
        },
    });

    logger.info(`Processando ${due.length} transações recorrentes...`);

    for (const rec of due) {
        // 1. Criar transação real
        await prisma.transaction.create({
            data: {
                dashboardId: rec.dashboardId,
                accountId: rec.accountId!,
                amount: rec.amount,
                entryType: rec.entryType,
                flowType: rec.flowType,
                category: rec.category,
                subcategory: rec.subcategory,
                description: rec.description,
                date: new Date(),
            },
        });

        // 2. Atualizar próxima data
        const nextDate = new Date(rec.nextDate);
        if (rec.frequency === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + rec.interval);
        else if (rec.frequency === 'WEEKLY') nextDate.setDate(nextDate.getDate() + (7 * rec.interval));
        else if (rec.frequency === 'DAILY') nextDate.setDate(nextDate.getDate() + rec.interval);
        else if (rec.frequency === 'YEARLY') nextDate.setFullYear(nextDate.getFullYear() + rec.interval);

        await prisma.recurringTransaction.update({
            where: { id: rec.id },
            data: {
                lastDate: new Date(),
                nextDate
            },
        });
    }
}

export async function updateRecurring(id: string, dashboardId: string, userId: string, data: any) {
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR']);

    return prisma.recurringTransaction.updateMany({
        where: { id, dashboardId },
        data,
    });
}

export async function deleteRecurring(id: string, dashboardId: string, userId: string) {
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR']);

    return prisma.recurringTransaction.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}
