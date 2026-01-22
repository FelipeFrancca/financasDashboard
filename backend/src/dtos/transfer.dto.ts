/**
 * Transfer DTOs
 * Type-safe data transfer objects para transferências entre contas
 */

import { z } from 'zod';

// ============================================
// CREATE TRANSFER DTO
// ============================================

export const createTransferSchema = z.object({
    dashboardId: z.string(),
    amount: z.number()
        .positive('Valor deve ser positivo')
        .finite('Valor inválido'),

    date: z.coerce.date()
        .default(() => new Date()),

    description: z.string()
        .max(100, 'Descrição muito longa')
        .trim()
        .optional(),

    fromAccountId: z.string().cuid('Conta de origem inválida'),
    toAccountId: z.string().cuid('Conta de destino inválida'),
}).passthrough().refine(
    (data) => data.fromAccountId !== data.toAccountId,
    {
        message: 'Conta de origem e destino devem ser diferentes',
        path: ['toAccountId'],
    }
);

export type CreateTransferDTO = z.infer<typeof createTransferSchema>;

// ============================================
// QUERY TRANSFERS DTO
// ============================================

export const queryTransfersSchema = z.object({
    dashboardId: z.string().cuid(), // Required for multi-dashboard support
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    accountId: z.string().cuid().optional(),
    fromAccountId: z.string().cuid().optional(),
    toAccountId: z.string().cuid().optional(),
    minAmount: z.coerce.number().optional(),
    maxAmount: z.coerce.number().optional(),

    // Paginação
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),

    // Ordenação
    sortBy: z.enum(['date', 'amount']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryTransfersDTO = z.infer<typeof queryTransfersSchema>;
