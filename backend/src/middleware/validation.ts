/**
 * Helper para validação de dados com Zod
 * Simplifica o uso de validação nas rotas
 */

import type { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../utils/AppError';

/**
 * Localização dos dados a validar
 */
type ValidationSource = 'body' | 'query' | 'params';

/**
 * Middleware de validação genérico
 */
export function validate(schema: ZodSchema, source: ValidationSource = 'body') {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Valida e transforma os dados  
            const validated = schema.parse(req[source]);

            // Substitui os dados originais pelos validados/transformados
            req[source] = validated;

            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                // Formata erros do Zod
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));

                next(new ValidationError('Erro de validação nos dados enviados', formattedErrors));
            } else {
                next(error);
            }
        }
    };
}

/**
 * Validação de body
 */
export function validateBody(schema: ZodSchema) {
    return validate(schema, 'body');
}

/**
 * Validação de query params
 */
export function validateQuery(schema: ZodSchema) {
    return validate(schema, 'query');
}

/**
 * Validação de route params
 */
export function validateParams(schema: ZodSchema) {
    return validate(schema, 'params');
}

/**
 * Validação de múltiplas fontes
 */
export function validateAll(schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const errors: any[] = [];

            // Valida body
            if (schemas.body) {
                try {
                    req.body = schemas.body.parse(req.body);
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        errors.push(...error.errors.map(err => ({
                            source: 'body',
                            field: err.path.join('.'),
                            message: err.message,
                            code: err.code,
                        })));
                    }
                }
            }

            // Valida query
            if (schemas.query) {
                try {
                    req.query = schemas.query.parse(req.query);
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        errors.push(...error.errors.map(err => ({
                            source: 'query',
                            field: err.path.join('.'),
                            message: err.message,
                            code: err.code,
                        })));
                    }
                }
            }

            // Valida params
            if (schemas.params) {
                try {
                    req.params = schemas.params.parse(req.params);
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        errors.push(...error.errors.map(err => ({
                            source: 'params',
                            field: err.path.join('.'),
                            message: err.message,
                            code: err.code,
                        })));
                    }
                }
            }

            // Se houver erros, lança ValidationError
            if (errors.length > 0) {
                throw new ValidationError('Erro de validação nos dados enviados', errors);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Helper para criar schemas de params com ID
 */
export const idParamSchema = z.object({
    id: z.string().min(1, 'ID não pode estar vazio'),
});

/**
 * Helper para paginação padrão
 */
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Helper para ordenação padrão
 */
export function sortingSchema<T extends string>(
    fields: readonly T[],
    defaultField: T = fields[0]
) {
    return z.object({
        sortBy: z.enum(fields as [T, ...T[]]).default(defaultField),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
    });
}
