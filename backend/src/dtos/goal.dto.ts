/**
 * Financial Goal DTOs - Validação para metas financeiras
 */
import { z } from 'zod';
import { GoalStatus } from '@prisma/client';

// ============================================
// CREATE GOAL DTO
// ============================================

export const createGoalSchema = z.object({
    dashboardId: z.string(),
    name: z.string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),

    description: z.string().max(500).optional(),

    targetAmount: z.number()
        .positive('Valor alvo deve ser positivo')
        .finite('Valor inválido'),

    currentAmount: z.number()
        .min(0, 'Valor atual não pode ser negativo')
        .finite()
        .default(0),

    deadline: z.coerce.date()
        .refine(date => date > new Date(), 'Prazo deve ser no futuro')
        .optional(),

    category: z.string().optional(),
}).passthrough();

export type CreateGoalDTO = z.infer<typeof createGoalSchema>;

// ============================================
// UPDATE GOAL DTO
// ============================================

export const updateGoalSchema = z.object({
    dashboardId: z.string(),
    name: z.string().min(3).max(100).trim().optional(),
    description: z.string().max(500).optional().nullable(),
    targetAmount: z.number().positive().finite().optional(),
    currentAmount: z.number().min(0).finite().optional(),
    deadline: z.coerce.date().optional().nullable(),
    category: z.string().optional().nullable(),
    status: z.nativeEnum(GoalStatus).optional(),
}).passthrough();

export type UpdateGoalDTO = z.infer<typeof updateGoalSchema>;

// ============================================
// QUERY GOALS DTO
// ============================================

export const queryGoalsSchema = z.object({
    status: z.nativeEnum(GoalStatus).optional(),
    isCompleted: z.coerce.boolean().optional(),
    dashboardId: z.string().min(1, 'Dashboard ID é obrigatório'),

    // Paginação
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),

    // Ordenação
    sortBy: z.enum(['deadline', 'targetAmount', 'createdAt']).default('deadline'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type QueryGoalsDTO = z.infer<typeof queryGoalsSchema>;

// ============================================
// RESPONSE DTO
// ============================================

export interface GoalResponseDTO {
    id: string;
    name: string;
    description: string | null;
    targetAmount: number;
    currentAmount: number;
    deadline: Date | null;
    category: string | null;
    status: GoalStatus;
    isCompleted: boolean;
    percentage: number;
    remainingAmount: number;
    daysRemaining: number | null;
}
