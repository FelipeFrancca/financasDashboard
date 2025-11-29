import { RecurringTransaction, RecurrenceFrequency } from '@prisma/client';
import { prisma } from '../database/conexao';
import { logger } from '../utils/logger';

export async function createRecurring(userId: string, data: any) {
    // Calcular próxima data
    const nextDate = new Date(data.startDate); // Simplificado

    return prisma.recurringTransaction.create({
        data: {
            ...data,
            userId,
            nextDate,
        },
    });
}

export async function getRecurring(userId: string) {
    return prisma.recurringTransaction.findMany({
        where: { userId, deletedAt: null },
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
                userId: rec.userId,
                accountId: rec.accountId!,
                amount: rec.amount,
                type: rec.entryType === 'Receita' ? 'INCOME' : 'EXPENSE', // Ajustar enum
                category: rec.category,
                description: rec.description,
                date: new Date(),
                status: 'COMPLETED',
            },
        });

        // 2. Atualizar próxima data
        const nextDate = new Date(rec.nextDate);
        if (rec.frequency === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + rec.interval);
        else if (rec.frequency === 'WEEKLY') nextDate.setDate(nextDate.getDate() + (7 * rec.interval));
        // ... outros casos

        await prisma.recurringTransaction.update({
            where: { id: rec.id },
            data: {
                lastDate: new Date(),
                nextDate
            },
        });
    }
}
