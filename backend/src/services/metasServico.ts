/**
 * Goal Service - Gerenciamento de metas financeiras
 */

import { FinancialGoal, GoalStatus, Prisma } from '@prisma/client';
import { prisma } from '../database/conexao';
import { logger } from '../utils/logger';
import {
    CreateGoalDTO,
    UpdateGoalDTO,
    QueryGoalsDTO,
    GoalResponseDTO,
} from '../dtos/goal.dto';
import { NotFoundError, ValidationError } from '../utils/AppError';

// ============================================
// CRUD OPERATIONS
// ============================================

export async function createGoal(
    dto: CreateGoalDTO,
    userId: string
): Promise<FinancialGoal> {
    const goal = await prisma.financialGoal.create({
        data: {
            ...dto,
            userId,
            status: 'ACTIVE',
            isCompleted: dto.currentAmount >= dto.targetAmount,
            completedAt: dto.currentAmount >= dto.targetAmount ? new Date() : null,
        },
    });

    logger.info('Meta criada', 'GoalService', { id: goal.id, userId });
    return goal;
}

export async function getGoals(
    dto: QueryGoalsDTO,
    userId: string
): Promise<{ data: GoalResponseDTO[]; total: number }> {
    const where: Prisma.FinancialGoalWhereInput = {
        userId,
        deletedAt: null,
        ...(dto.status && { status: dto.status }),
        ...(dto.isCompleted !== undefined && { isCompleted: dto.isCompleted }),
    };

    const [goals, total] = await prisma.$transaction([
        prisma.financialGoal.findMany({
            where,
            orderBy: { [dto.sortBy]: dto.sortOrder },
            skip: (dto.page - 1) * dto.limit,
            take: dto.limit,
        }),
        prisma.financialGoal.count({ where }),
    ]);

    return {
        data: goals.map(mapToResponse),
        total,
    };
}

export async function getGoalById(
    id: string,
    userId: string
): Promise<GoalResponseDTO> {
    const goal = await prisma.financialGoal.findFirst({
        where: { id, userId, deletedAt: null },
    });

    if (!goal) {
        throw new NotFoundError('Meta não encontrada');
    }

    return mapToResponse(goal);
}

export async function updateGoal(
    id: string,
    dto: UpdateGoalDTO,
    userId: string
): Promise<FinancialGoal> {
    const goal = await prisma.financialGoal.findFirst({
        where: { id, userId, deletedAt: null },
    });

    if (!goal) {
        throw new NotFoundError('Meta não encontrada');
    }

    // Lógica de conclusão automática
    let isCompleted = goal.isCompleted;
    let completedAt = goal.completedAt;
    let status = dto.status || goal.status;

    const newCurrentAmount = dto.currentAmount !== undefined ? dto.currentAmount : goal.currentAmount;
    const newTargetAmount = dto.targetAmount !== undefined ? dto.targetAmount : goal.targetAmount;

    if (newCurrentAmount >= newTargetAmount && !goal.isCompleted) {
        isCompleted = true;
        completedAt = new Date();
        status = 'COMPLETED';
    } else if (newCurrentAmount < newTargetAmount && goal.isCompleted) {
        isCompleted = false;
        completedAt = null;
        status = 'ACTIVE';
    }

    const updated = await prisma.financialGoal.update({
        where: { id },
        data: {
            ...dto,
            isCompleted,
            completedAt,
            status,
        },
    });

    logger.info('Meta atualizada', 'GoalService', { id, userId });
    return updated;
}

export async function deleteGoal(
    id: string,
    userId: string
): Promise<void> {
    const goal = await prisma.financialGoal.findFirst({
        where: { id, userId, deletedAt: null },
    });

    if (!goal) {
        throw new NotFoundError('Meta não encontrada');
    }

    await prisma.financialGoal.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            status: 'CANCELLED',
        },
    });

    logger.info('Meta deletada', 'GoalService', { id });
}

// ============================================
// HELPERS
// ============================================

function mapToResponse(goal: FinancialGoal): GoalResponseDTO {
    const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

    let daysRemaining: number | null = null;
    if (goal.deadline) {
        const now = new Date();
        const diffTime = goal.deadline.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
        id: goal.id,
        name: goal.name,
        description: goal.description,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
        category: goal.category,
        status: goal.status,
        isCompleted: goal.isCompleted,
        percentage: Math.round(percentage * 100) / 100,
        remainingAmount,
        daysRemaining,
    };
}
