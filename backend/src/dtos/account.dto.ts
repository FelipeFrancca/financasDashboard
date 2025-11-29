/**
 * DTOs para Account operations
 * Type-safe data transfer objects
 */

import { z } from 'zod';
import { AccountType, AccountStatus } from '@prisma/client';

// ============================================
// CREATE ACCOUNT DTO
// ============================================

export const createAccountSchema = z.object({
    name: z.string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),

    type: z.nativeEnum(AccountType, {
        errorMap: () => ({ message: 'Tipo de conta inválido' })
    }),

    institution: z.string()
        .max(100, 'Nome da instituição muito longo')
        .trim()
        .optional(),

    currency: z.string()
        .length(3, 'Código de moeda deve ter 3 letras')
        .toUpperCase()
        .default('BRL'),

    initialBalance: z.number()
        .finite('Saldo inicial inválido')
        .default(0),

    creditLimit: z.number()
        .positive('Limite deve ser positivo')
        .finite('Limite inválido')
        .optional(),

    isPrimary: z.boolean()
        .default(false),

    color: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida (use formato #RRGGBB)')
        .optional(),

    icon: z.string()
        .max(50, 'Nome do ícone muito longo')
        .optional(),

    description: z.string()
        .max(500, 'Descrição muito longa')
        .trim()
        .optional(),
}).refine(
    (data) => {
        // Cartão de crédito deve ter limite
        if (data.type === AccountType.CREDIT_CARD && !data.creditLimit) {
            return false;
        }
        return true;
    },
    {
        message: 'Cartão de crédito deve ter limite definido',
        path: ['creditLimit'],
    }
);

export type CreateAccountDTO = z.infer<typeof createAccountSchema>;

// ============================================
// UPDATE ACCOUNT DTO
// ============================================

export const updateAccountSchema = z.object({
    name: z.string()
        .min(3)
        .max(100)
        .trim()
        .optional(),

    institution: z.string()
        .max(100)
        .trim()
        .optional(),

    status: z.nativeEnum(AccountStatus)
        .optional(),

    initialBalance: z.number()
        .finite()
        .optional(),

    currentBalance: z.number()
        .finite()
        .optional(),

    creditLimit: z.number()
        .positive()
        .finite()
        .optional()
        .nullable(),

    isPrimary: z.boolean()
        .optional(),

    color: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional()
        .nullable(),

    icon: z.string()
        .max(50)
        .optional()
        .nullable(),

    description: z.string()
        .max(500)
        .trim()
        .optional()
        .nullable(),
});

export type UpdateAccountDTO = z.infer<typeof updateAccountSchema>;

// ============================================
// QUERY ACCOUNTS DTO
// ============================================

export const queryAccountsSchema = z.object({
    type: z.nativeEnum(AccountType)
        .optional(),

    status: z.nativeEnum(AccountStatus)
        .optional(),

    currency: z.string()
        .length(3)
        .toUpperCase()
        .optional(),

    institution: z.string()
        .optional(),

    isPrimary: z.coerce.boolean()
        .optional(),

    includeDeleted: z.coerce.boolean()
        .default(false),

    // Paginação
    page: z.coerce.number()
        .int()
        .positive()
        .default(1),

    limit: z.coerce.number()
        .int()
        .positive()
        .max(100)
        .default(50),

    // Ordenação
    sortBy: z.enum(['name', 'type', 'currentBalance', 'createdAt'])
        .default('name'),

    sortOrder: z.enum(['asc', 'desc'])
        .default('asc'),
});

export type QueryAccountsDTO = z.infer<typeof queryAccountsSchema>;

// ============================================
// ACCOUNT BALANCE OPERATION DTO
// ============================================

export const updateBalanceSchema = z.object({
    amount: z.number()
        .finite('Valor inválido'),

    operation: z.enum(['ADD', 'SUBTRACT', 'SET']),

    description: z.string()
        .max(500)
        .optional(),
});

export type UpdateBalanceDTO = z.infer<typeof updateBalanceSchema>;

// ============================================
// RECONCILIATION DTO
// ============================================

export const reconcileAccountSchema = z.object({
    statementBalance: z.number()
        .finite('Saldo do extrato inválido'),

    statementDate: z.coerce.date(),

    notes: z.string()
        .max(1000)
        .optional(),
});

export type ReconcileAccountDTO = z.infer<typeof reconcileAccountSchema>;

// ============================================
// RESPONSE DTOS
// ============================================

export interface AccountResponseDTO {
    id: string;
    name: string;
    type: AccountType;
    institution: string | null;
    currency: string;
    initialBalance: number;
    currentBalance: number;
    availableBalance: number;
    creditLimit: number | null;
    status: AccountStatus;
    isPrimary: boolean;
    color: string | null;
    icon: string | null;
    description: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AccountWithStatsDTO extends AccountResponseDTO {
    stats: {
        totalTransactions: number;
        lastTransaction: Date | null;
        monthlyIncome: number;
        monthlyExpense: number;
        balance: number;
    };
}

export interface ReconciliationResultDTO {
    accountId: string;
    calculatedBalance: number;
    statementBalance: number;
    difference: number;
    isReconciled: boolean;
    reconciledAt: Date;
    notes: string | null;
}
