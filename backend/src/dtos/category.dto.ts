/**
 * Category DTOs - Validação para categorias hierárquicas
 */
import { z } from 'zod';

// ============================================
// CREATE CATEGORY DTO
// ============================================

export const createCategorySchema = z.object({
    name: z.string()
        .min(2, 'Nome deve ter no mínimo 2 caracteres')
        .max(50, 'Nome deve ter no máximo 50 caracteres')
        .trim(),

    type: z.enum(['Receita', 'Despesa'], {
        errorMap: () => ({ message: 'Tipo deve ser Receita ou Despesa' })
    }),

    icon: z.string().max(50).optional(),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida').optional(),

    parentId: z.string().cuid().optional().nullable(),

    order: z.number().int().min(0).optional(),
});

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;

// ============================================
// UPDATE CATEGORY DTO
// ============================================

export const updateCategorySchema = z.object({
    name: z.string().min(2).max(50).trim().optional(),
    type: z.enum(['Receita', 'Despesa']).optional(),
    icon: z.string().max(50).optional(),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    parentId: z.string().cuid().optional().nullable(),
    isActive: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
});

export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;

// ============================================
// QUERY CATEGORIES DTO
// ============================================

export const queryCategoriesSchema = z.object({
    type: z.enum(['Receita', 'Despesa']).optional(),
    isActive: z.coerce.boolean().optional(),
    parentId: z.string().optional(), // 'null' string to filter root categories
    includeSystem: z.coerce.boolean().default(true),
});

export type QueryCategoriesDTO = z.infer<typeof queryCategoriesSchema>;

// ============================================
// RESPONSE DTO
// ============================================

export interface CategoryResponseDTO {
    id: string;
    name: string;
    type: string;
    icon: string | null;
    color: string | null;
    parentId: string | null;
    isSystem: boolean;
    isActive: boolean;
    order: number;
    children?: CategoryResponseDTO[];
}
