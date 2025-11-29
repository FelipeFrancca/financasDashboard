/**
 * Transfer DTOs
 * Type-safe data transfer objects para transferências entre contas
 */

import { z } from 'zod';

// ============================================
// CREATE TRANSFER DTO
// ============================================

export const createTransferSchema = z.object({
    fromAccountId: z.string()
        .min(1, 'Conta de origem é obrigatória')
        .cuid('ID de conta de origem inválido'),

    toAccountId: z.string()
        .min(1, 'Conta de destino é obrigatória')
        .cuid('ID de conta de destino inválido'),

    amount: z.number()
        .positive('Valor deve ser positivo')
        .finite('Valor inválido')
        .refine(val => val > 0.01, 'Valor mínimo é R$ 0.01'),

    date: z.coerce.date()
        .default(() => new Date()),

    description: z.string()
        .min(3, 'Descrição deve ter no mínimo 3 caracteres')
        .max(200, 'Descrição deve ter no máximo 200 caracteres')
        .trim()
        .default('Transferência entre contas'),

    notes: z.string()
        .max(500, 'Notas muito longas')
        .trim()
        .optional(),
}).refine(
    (data) => data.fromAccountId !== data.toAccountId,
    {
        message: 'Conta de origem e destino não podem ser iguais',
        path: ['toAccountId'],
    }
);

export type CreateTransferDTO = z.infer<typeof createTransferSchema>;

// ============================================
// TRANSFER RESPONSE DTO
// ============================================

export interface TransferResponseDTO {
    id: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: Date;
    description: string;
    notes: string | null;
    fromTransaction: {
        id: string;
        accountId: string;
        amount: number;
        entryType: string;
    };
    toTransaction: {
        id: string;
        accountId: string;
        amount: number;
        entryType: string;
    };
    createdAt: Date;
}

// ============================================
// QUERY TRANSFERS DTO
// ============================================

export const queryTransfersSchema = z.object({
    fromAccountId: z.string().cuid().optional(),
    toAccountId: z.string().cuid().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    minAmount: z.coerce.number().positive().optional(),
    maxAmount: z.coerce.number().positive().optional(),

    // Paginação
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),

    // Ordenação
    sortBy: z.enum(['date', 'amount']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryTransfersDTO = z.infer<typeof queryTransfersSchema>;
