/**
 * Validadores para rotas de autenticação
 */

import { z } from 'zod';

/**
 * Validação de email
 */
export const emailSchema = z
    .string({
        required_error: 'Email é obrigatório',
        invalid_type_error: 'Email deve ser uma string',
    })
    .email('Formato de email inválido')
    .toLowerCase()
    .trim();

/**
 * Validação de senha
 */
export const passwordSchema = z
    .string({
        required_error: 'Senha é obrigatória',
    })
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
    );

/**
 * Validação de nome
 */
export const nameSchema = z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional();

/**
 * Schema de registro
 */
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Schema de login
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string({
        required_error: 'Senha é obrigatória',
    }).min(1, 'Senha não pode estar vazia'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema de esqueci minha senha
 */
export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema de reset de senha
 */
export const resetPasswordSchema = z.object({
    token: z.string({
        required_error: 'Token é obrigatório',
    }).min(1, 'Token não pode estar vazio'),
    password: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Schema de refresh token
 */
export const refreshTokenSchema = z.object({
    refreshToken: z.string({
        required_error: 'Refresh token é obrigatório',
    }).min(1, 'Refresh token não pode estar vazio'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Schema de atualização de perfil
 */
export const updateProfileSchema = z.object({
    name: nameSchema,
    avatar: z.string().url('URL do avatar inválida').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Schema de alteração de senha
 */
export const changePasswordSchema = z.object({
    currentPassword: z.string({
        required_error: 'Senha atual é obrigatória',
    }).min(1, 'Senha atual não pode estar vazia'),
    newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
