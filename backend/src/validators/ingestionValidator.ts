/**
 * Validadores para o módulo de ingestão financeira
 * Usa Zod para validação de schema
 */

import { z } from 'zod';

/**
 * Schema para um item de transação
 */
export const transactionItemSchema = z.object({
    description: z.string().min(1, 'Descrição do item é obrigatória'),
    quantity: z.number().positive().optional(),
    unitPrice: z.number().positive().optional(),
    totalPrice: z.number().positive('Preço total deve ser positivo'),
});

/**
 * Schema para transação individual extraída de uma fatura
 */
export const extractedTransactionSchema = z.object({
    merchant: z.string().nullable(),
    date: z.string().nullable(),
    amount: z.number(),
    category: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    installmentInfo: z.string().nullable().optional(),
    cardLastDigits: z.string().nullable().optional(),
    isRefund: z.boolean().optional(),
});

/**
 * Schema para metadados de fatura de cartão
 */
export const statementInfoSchema = z.object({
    institution: z.string().nullable().optional(),
    cardLastDigits: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    totalAmount: z.number().nullable().optional(),
    creditLimit: z.number().nullable().optional(),
    periodStart: z.string().nullable().optional(),
    periodEnd: z.string().nullable().optional(),
    holderName: z.string().nullable().optional(),
});

/**
 * Schema para o resultado da extração de dados financeiros
 * Suporta tanto extração simples quanto multi-transação
 */
export const extractionResultSchema = z.object({
    // Campos para extração simples
    merchant: z.string().nullable().optional(),
    date: z.string().nullable().optional(),
    amount: z.number().nonnegative('Valor não pode ser negativo'),
    category: z.string().nullable().optional(),
    items: z.array(transactionItemSchema).nullable().optional(),
    confidence: z.number().min(0).max(1),
    extractionMethod: z.enum(['regex', 'ai']),
    rawData: z.any().optional(),

    // Campos para extração multi-transação
    isMultiTransaction: z.boolean().optional(),
    transactions: z.array(extractedTransactionSchema).optional(),
    statementInfo: statementInfoSchema.optional(),
});

/**
 * Schema para validação de arquivo enviado
 */
export const fileUploadSchema = z.object({
    mimetype: z.enum(['application/pdf', 'image/jpeg', 'image/png'], {
        errorMap: () => ({
            message: 'Tipo de arquivo não suportado. Use PDF, JPEG ou PNG.',
        }),
    }),
    size: z.number().max(10 * 1024 * 1024, 'Arquivo muito grande. Máximo: 10MB'),
    buffer: z.instanceof(Buffer, { message: 'Buffer de arquivo inválido' }),
});

/**
 * Tipo inferido do schema de resultado
 */
export type ExtractionResultValidated = z.infer<typeof extractionResultSchema>;

/**
 * Tipo inferido do schema de transação extraída
 */
export type ExtractedTransactionValidated = z.infer<typeof extractedTransactionSchema>;

/**
 * Tipo inferido do schema de upload
 */
export type FileUploadValidated = z.infer<typeof fileUploadSchema>;

