/**
 * Validadores para rotas de dashboards
 */

import { z } from 'zod';

/**
 * Roles de dashboard permitidos
 */
const dashboardRoles = ['VIEWER', 'EDITOR', 'OWNER'] as const;

/**
 * Schema de criação de dashboard
 */
export const createDashboardSchema = z.object({
    title: z.string({
        required_error: 'Título é obrigatório',
    })
        .min(3, 'Título deve ter no mínimo 3 caracteres')
        .max(100, 'Título deve ter no máximo 100 caracteres')
        .trim(),
    description: z.string()
        .max(500, 'Descrição deve ter no máximo 500 caracteres')
        .trim()
        .optional(),
});

export type CreateDashboardInput = z.infer<typeof createDashboardSchema>;

/**
 * Schema de atualização de dashboard
 */
export const updateDashboardSchema = z.object({
    title: z.string()
        .min(3, 'Título deve ter no mínimo 3 caracteres')
        .max(100, 'Título deve ter no máximo 100 caracteres')
        .trim()
        .optional(),
    description: z.string()
        .max(500, 'Descrição deve ter no máximo 500 caracteres')
        .trim()
        .optional(),
});

export type UpdateDashboardInput = z.infer<typeof updateDashboardSchema>;

/**
 * Schema de criação de convite
 */
export const createInviteSchema = z.object({
    role: z.enum(dashboardRoles, {
        required_error: 'Permissão é obrigatória',
        invalid_type_error: 'Permissão deve ser VIEWER, EDITOR ou OWNER',
    }).refine(
        (role) => role !== 'OWNER',
        'Não é possível criar convite com permissão OWNER'
    ),
    expiresAt: z.coerce.date().optional().refine(
        (date) => !date || date > new Date(),
        'Data de expiração deve ser no futuro'
    ),
    isOneTime: z.boolean().default(false),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;

/**
 * Schema de aceitar convite
 */
export const acceptInviteSchema = z.object({
    code: z.string({
        required_error: 'Código do convite é obrigatório',
    }).min(1, 'Código do convite não pode estar vazio'),
});

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

/**
 * Schema de atualização de membro
 */
export const updateMemberSchema = z.object({
    role: z.enum(dashboardRoles, {
        required_error: 'Permissão é obrigatória',
        invalid_type_error: 'Permissão deve ser VIEWER, EDITOR ou OWNER',
    }),
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

/**
 * Schema de query de dashboards
 */
export const dashboardQuerySchema = z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    sortBy: z.enum(['title', 'createdAt', 'updatedAt']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    includeShared: z.coerce.boolean().default(true),
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;

/**
 * Schema de filtros de membros
 */
export const memberQuerySchema = z.object({
    role: z.enum(dashboardRoles).optional(),
    search: z.string().optional(), // Busca por nome ou email
});

export type MemberQueryInput = z.infer<typeof memberQuerySchema>;

/**
 * Schema de validação de ID
 */
export const dashboardIdSchema = z.object({
    id: z.string({
        required_error: 'ID do dashboard é obrigatório',
    }).min(1, 'ID do dashboard não pode estar vazio'),
});

export type DashboardIdInput = z.infer<typeof dashboardIdSchema>;

/**
 * Schema de compartilhamento via email
 */
export const shareByEmailSchema = z.object({
    email: z.string({
        required_error: 'Email é obrigatório',
    }).email('Email inválido').toLowerCase().trim(),
    role: z.enum(['VIEWER', 'EDITOR'], {
        required_error: 'Permissão é obrigatória',
        invalid_type_error: 'Permissão deve ser VIEWER ou EDITOR',
    }),
    sendEmail: z.boolean().default(true), // Se deve enviar email de notificação
});

export type ShareByEmailInput = z.infer<typeof shareByEmailSchema>;
