/**
 * Validadores para rotas de transações
 */

import { z } from 'zod';

/**
 * Tipos de entrada permitidos
 */
const entryTypes = ['Receita', 'Despesa'] as const;

/**
 * Tipos de fluxo permitidos
 */
const flowTypes = ['Fixa', 'Variável'] as const;

/**
 * Status de parcelas permitidos
 */
const installmentStatuses = ['N/A', 'Paga', 'Pendente'] as const;

/**
 * Schema de item de transação (para cupons fiscais com múltiplos produtos)
 */
export const transactionItemSchema = z.object({
    description: z.string().min(1, 'Descrição do item é obrigatória').max(500, 'Descrição muito longa'),
    quantity: z.number().positive('Quantidade deve ser positiva').default(1),
    unitPrice: z.number().nonnegative('Preço unitário não pode ser negativo').optional(),
    totalPrice: z.number().nonnegative('Preço total não pode ser negativo'),
});

export type TransactionItemInput = z.infer<typeof transactionItemSchema>;

/**
 * Schema de criação de transação
 */
export const createTransactionSchema = z.object({
    date: z.coerce.date({
        required_error: 'Data é obrigatória',
        invalid_type_error: 'Data inválida',
    }),
    entryType: z.enum(entryTypes, {
        required_error: 'Tipo de entrada é obrigatório',
        invalid_type_error: 'Tipo de entrada deve ser Receita ou Despesa',
    }),
    flowType: z.enum(flowTypes, {
        required_error: 'Tipo de fluxo é obrigatório',
        invalid_type_error: 'Tipo de fluxo deve ser Fixa ou Variável',
    }),
    category: z.string({
        required_error: 'Categoria é obrigatória',
    }).min(1, 'Categoria não pode estar vazia').max(100, 'Categoria muito longa'),
    subcategory: z.string().max(100, 'Subcategoria muito longa').optional(),
    description: z.string({
        required_error: 'Descrição é obrigatória',
    }).min(1, 'Descrição não pode estar vazia').max(500, 'Descrição muito longa'),
    amount: z.number({
        required_error: 'Valor é obrigatório',
        invalid_type_error: 'Valor deve ser um número',
    }).positive('Valor deve ser positivo'),
    paymentMethod: z.string().max(50, 'Método de pagamento muito longo').optional(),
    institution: z.string().max(100, 'Nome da instituição muito longo').optional(),
    cardBrand: z.string().max(50, 'Bandeira do cartão muito longa').optional(),
    installmentTotal: z.number().int().min(0).default(0),
    installmentNumber: z.number().int().min(0).default(0),
    installmentStatus: z.enum(installmentStatuses).default('N/A'),
    notes: z.string().max(1000, 'Notas muito longas').optional(),
    isTemporary: z.boolean().default(false),
    isThirdParty: z.boolean().default(false),
    thirdPartyName: z.string().max(100, 'Nome do terceiro muito longo').optional(),
    thirdPartyDescription: z.string().max(500, 'Descrição do terceiro muito longa').optional(),
    dashboardId: z.string().optional(), // Para associar a um dashboard específico
    items: z.array(transactionItemSchema).optional(), // Itens extraídos de cupons fiscais
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

/**
 * Schema de atualização de transação
 */
export const updateTransactionSchema = createTransactionSchema.partial();

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

/**
 * Schema de filtros de consulta
 */
export const transactionQuerySchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    entryType: z.enum(entryTypes).optional(),
    flowType: z.enum(flowTypes).optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    institution: z.string().optional(),
    installmentStatus: z.enum(installmentStatuses).optional(),
    search: z.string().optional(), // Busca por descrição
    minAmount: z.coerce.number().positive().optional(),
    maxAmount: z.coerce.number().positive().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    sortBy: z.enum(['date', 'amount', 'description', 'createdAt']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    dashboardId: z.string().optional(),
    ownership: z.enum(['all', 'client', 'thirdParty']).default('all'),
}).refine(
    (data) => {
        // Valida que startDate não seja depois de endDate
        if (data.startDate && data.endDate) {
            return data.startDate <= data.endDate;
        }
        return true;
    },
    {
        message: 'Data inicial não pode ser posterior à data final',
        path: ['startDate'],
    }
).refine(
    (data) => {
        // Valida que minAmount não seja maior que maxAmount
        if (data.minAmount && data.maxAmount) {
            return data.minAmount <= data.maxAmount;
        }
        return true;
    },
    {
        message: 'Valor mínimo não pode ser maior que o valor máximo',
        path: ['minAmount'],
    }
);

export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;

/**
 * Schema para bulk create
 */
export const bulkCreateTransactionSchema = z.array(createTransactionSchema)
    .min(1, 'Pelo menos uma transação deve ser fornecida')
    .max(100, 'Máximo de 100 transações por vez');

export type BulkCreateTransactionInput = z.infer<typeof bulkCreateTransactionSchema>;

/**
 * Schema para importação CSV
 */
export const importCsvSchema = z.object({
    file: z.string({
        required_error: 'Arquivo CSV é obrigatório',
    }),
    delimiter: z.string().length(1).default(','),
    skipHeader: z.boolean().default(true),
    dashboardId: z.string().optional(),
});

export type ImportCsvInput = z.infer<typeof importCsvSchema>;

/**
 * Schema para estatísticas
 */
export const statsQuerySchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    groupBy: z.enum(['month', 'category', 'entryType', 'institution']).default('month'),
    dashboardId: z.string().optional(),
    ownership: z.enum(['all', 'client', 'thirdParty']).default('all'),
});

export type StatsQueryInput = z.infer<typeof statsQuerySchema>;
