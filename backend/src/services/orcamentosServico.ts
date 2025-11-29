/**
 * Budget Service - CRUD completo
 */

import { Budget, BudgetPeriod, Prisma } from '@prisma/client';
import { prisma } from '../database/conexao';
import { logger } from '../utils/logger';
import {
    CreateBudgetDTO,
    UpdateBudgetDTO,
    QueryBudgetsDTO,
    BudgetProgressDTO,
    BudgetSummaryDTO,
    BudgetAlertDTO,
} from '../dtos/budget.dto';
import { NotFoundError, ValidationError } from '../utils/AppError';

// ============================================
// CRUD OPERATIONS
// ============================================

export async function createBudget(
    dto: CreateBudgetDTO,
    userId: string
): Promise<Budget> {
    logger.info('Criando orçamento', 'BudgetService', { userId, name: dto.name });

    const budget = await prisma.budget.create({
        data: {
            ...dto,
            userId,
        },
    });

    logger.info('Orçamento criado', 'BudgetService', { budgetId: budget.id });
    return budget;
}

export async function getBudgets(
    dto: QueryBudgetsDTO,
    userId: string
): Promise<{ data: Budget[]; total: number }> {
    const where: Prisma.BudgetWhereInput = {
        userId,
        ...(dto.period && { period: dto.period }),
        ...(dto.category && { category: dto.category }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.includeDeleted ? {} : { deletedAt: null }),
    };

    const [budgets, total] = await prisma.$transaction([
        prisma.budget.findMany({
            where,
            orderBy: { [dto.sortBy]: dto.sortOrder },
            skip: (dto.page - 1) * dto.limit,
            take: dto.limit,
        }),
        prisma.budget.count({ where }),
    ]);

    return { data: budgets, total };
}

export async function getBudgetById(
    id: string,
    userId: string
): Promise<Budget> {
    const budget = await prisma.budget.findFirst({
        where: { id, userId, deletedAt: null },
    });

    if (!budget) {
        throw new NotFoundError('Orçamento não encontrado');
    }

    return budget;
}

export async function updateBudget(
    id: string,
    dto: UpdateBudgetDTO,
    userId: string
): Promise<Budget> {
    await getBudgetById(id, userId);

    const budget = await prisma.budget.update({
        where: { id },
        data: dto,
    });

    logger.info('Orçamento atualizado', 'BudgetService', { budgetId: id });
    return budget;
}

export async function deleteBudget(
    id: string,
    userId: string
): Promise<void> {
    await getBudgetById(id, userId);

    await prisma.budget.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            deletedBy: userId,
        },
    });

    logger.info('Orçamento deletado', 'BudgetService', { budgetId: id });
}

// ============================================
// BUSINESS LOGIC
// ============================================

export async function getBudgetProgress(
    id: string,
    userId: string
): Promise<BudgetProgressDTO> {
    const budget = await getBudgetById(id, userId);

    // Calcular período atual
    const now = new Date();
    const { startDate, endDate } = calculatePeriodDates(budget.period, budget.startDate);

    // Buscar transações no período
    const transactions = await prisma.transaction.findMany({
        where: {
            userId,
            deletedAt: null,
            date: {
                gte: startDate,
                ...(endDate && { lte: endDate }),
            },
            entryType: 'Despesa',
            ...(budget.category && { category: budget.category }),
        },
    });

    const spent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;

    let status: 'OK' | 'WARNING' | 'EXCEEDED';
    if (percentage >= 100) {
        status = 'EXCEEDED';
    } else if (budget.alertAt && percentage >= budget.alertAt) {
        status = 'WARNING';
    } else {
        status = 'OK';
    }

    const daysRemaining = endDate
        ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return {
        budgetId: budget.id,
        name: budget.name,
        amount: budget.amount,
        spent,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
        status,
        period: budget.period,
        category: budget.category,
        startDate,
        endDate,
        daysRemaining,
    };
}

export async function getBudgetsSummary(
    userId: string
): Promise<BudgetSummaryDTO> {
    const budgets = await prisma.budget.findMany({
        where: { userId, isActive: true, deletedAt: null },
    });

    const progressPromises = budgets.map((b) => getBudgetProgress(b.id, userId));
    const progresses = await Promise.all(progressPromises);

    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = progresses.reduce((sum, p) => sum + p.spent, 0);
    const totalRemaining = progresses.reduce((sum, p) => sum + p.remaining, 0);
    const overBudgetCount = progresses.filter((p) => p.status === 'EXCEEDED').length;
    const warningBudgetCount = progresses.filter((p) => p.status === 'WARNING').length;

    return {
        totalBudgets: budgets.length,
        activeBudgets: budgets.filter((b) => b.isActive).length,
        totalBudgeted,
        totalSpent,
        totalRemaining,
        overBudgetCount,
        warningBudgetCount,
    };
}

export async function getBudgetAlerts(
    userId: string
): Promise<BudgetAlertDTO[]> {
    const budgets = await prisma.budget.findMany({
        where: {
            userId,
            isActive: true,
            deletedAt: null,
            alertAt: { not: null },
        },
    });

    const alerts: BudgetAlertDTO[] = [];

    for (const budget of budgets) {
        const progress = await getBudgetProgress(budget.id, userId);

        if (progress.status === 'WARNING' || progress.status === 'EXCEEDED') {
            alerts.push({
                budgetId: budget.id,
                name: budget.name,
                amount: budget.amount,
                spent: progress.spent,
                percentage: progress.percentage,
                alertAt: budget.alertAt!,
                message:
                    progress.status === 'EXCEEDED'
                        ? `Orçamento "${budget.name}" foi excedido!`
                        : `Orçamento "${budget.name}" atingiu ${progress.percentage.toFixed(1)}% do limite`,
                severity: progress.status === 'EXCEEDED' ? 'CRITICAL' : 'WARNING',
            });
        }
    }

    return alerts;
}

// ============================================
// HELPERS
// ============================================

function calculatePeriodDates(
    period: BudgetPeriod,
    startDate: Date
): { startDate: Date; endDate: Date | null } {
    const now = new Date();

    switch (period) {
        case 'DAILY':
            return {
                startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
            };

        case 'WEEKLY':
            const dayOfWeek = now.getDay();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - dayOfWeek);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return { startDate: weekStart, endDate: weekEnd };

        case 'MONTHLY':
            return {
                startDate: new Date(now.getFullYear(), now.getMonth(), 1),
                endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
            };

        case 'QUARTERLY':
            const quarter = Math.floor(now.getMonth() / 3);
            return {
                startDate: new Date(now.getFullYear(), quarter * 3, 1),
                endDate: new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59),
            };

        case 'YEARLY':
            return {
                startDate: new Date(now.getFullYear(), 0, 1),
                endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
            };

        case 'CUSTOM':
        default:
            return { startDate, endDate: null };
    }
}
