/**
 * Budget DTOs - Validação completa de orçamentos
 */
import { z } from 'zod';
import { BudgetPeriod } from '@prisma/client';

// ============================================
// CREATE BUDGET DTO
// ============================================

export const createBudgetSchema = z.object({
    dashboardId: z.string(),
    name: z.string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),

    amount: z.number()
        .positive('Valor deve ser positivo')
        .finite('Valor inválido')
        .max(999999999, 'Valor muito alto'),

    period: z.nativeEnum(BudgetPeriod, {
        errorMap: () => ({ message: 'Período inválido' })
    }).default('MONTHLY'),

    category: z.string()
        .max(100, 'Categoria muito longa')
        .trim()
        .optional(),

    startDate: z.coerce.date()
        .default(() => new Date()),

    endDate: z.coerce.date()
        .optional(),

    alertAt: z.number()
        .min(1, 'Alerta deve ser no mínimo 1%')
        .max(100, 'Alerta deve ser no máximo 100%')
        .optional(),
}).passthrough().refine(
    (data) => {
        if (data.endDate && data.startDate >= data.endDate) {
            return false;
        }
        return true;
    },
    {
        message: 'Data final deve ser posterior à data inicial',
        path: ['endDate'],
    }
);

export type CreateBudgetDTO = z.infer<typeof createBudgetSchema>;

// ============================================
// UPDATE BUDGET DTO
// ============================================

export const updateBudgetSchema = z.object({
    dashboardId: z.string(),
    name: z.string().min(3).max(100).trim().optional(),
    amount: z.number().positive().finite().max(999999999).optional(),
    period: z.nativeEnum(BudgetPeriod).optional(),
    category: z.string().max(100).trim().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    alertAt: z.number().min(1).max(100).optional().nullable(),
    isActive: z.boolean().optional(),
}).passthrough();

export type UpdateBudgetDTO = z.infer<typeof updateBudgetSchema>;

// ============================================
// QUERY BUDGETS DTO
// ============================================

export const queryBudgetsSchema = z.object({
    period: z.nativeEnum(BudgetPeriod).optional(),
    category: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    includeDeleted: z.coerce.boolean().default(false),
    dashboardId: z.string().min(1, 'Dashboard ID é obrigatório'),

    // Paginação
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),

    // Ordenação
    sortBy: z.enum(['name', 'amount', 'createdAt']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type QueryBudgetsDTO = z.infer<typeof queryBudgetsSchema>;

// ============================================
// RESPONSE DTOs
// ============================================

export interface BudgetResponseDTO {
    id: string;
    name: string;
    amount: number;
    period: BudgetPeriod;
    category: string | null;
    startDate: Date;
    endDate: Date | null;
    alertAt: number | null;
    isActive: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface BudgetProgressDTO {
    budgetId: string;
    name: string;
    amount: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'OK' | 'WARNING' | 'EXCEEDED';
    period: BudgetPeriod;
    category: string | null;
    startDate: Date;
    endDate: Date | null;
    daysRemaining: number | null;
}

export interface BudgetSummaryDTO {
    totalBudgets: number;
    activeBudgets: number;
    totalBudgeted: number;
    totalSpent: number;
    totalRemaining: number;
    overBudgetCount: number;
    warningBudgetCount: number;
}

export interface BudgetAlertDTO {
    budgetId: string;
    name: string;
    amount: number;
    spent: number;
    percentage: number;
    alertAt: number;
    message: string;
    severity: 'WARNING' | 'CRITICAL';
}
