/**
 * Middleware de Rate Limiting
 * Protege a API contra abuso e ataques de força bruta
 */

import type { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/AppError';
import { logger } from '../utils/logger';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

interface RateLimitOptions {
    windowMs: number;      // Janela de tempo em ms
    maxRequests: number;   // Máximo de requisições na janela
    message?: string;      // Mensagem customizada
    skipSuccessfulRequests?: boolean;  // Não contar requisições bem-sucedidas
    skipFailedRequests?: boolean;      // Não contar requisições falhadas
    keyGenerator?: (req: Request) => string; // Função para gerar chave única
}

class RateLimiter {
    private store: RateLimitStore = {};
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Limpar registros expirados a cada 1 minuto
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60 * 1000);
    }

    /**
     * Remove registros expirados do store
     */
    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const key in this.store) {
            if (this.store[key].resetTime < now) {
                delete this.store[key];
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug(`Rate limiter cleanup: ${cleaned} registros removidos`, 'RateLimiter');
        }
    }

    /**
     * Gera chave padrão baseada no IP
     */
    private defaultKeyGenerator(req: Request): string {
        return req.ip || req.connection.remoteAddress || 'unknown';
    }

    /**
     * Middleware de rate limiting
     */
    limit(options: RateLimitOptions) {
        const {
            windowMs,
            maxRequests,
            message,
            skipSuccessfulRequests = false,
            skipFailedRequests = false,
            keyGenerator,
        } = options;

        return (req: Request, res: Response, next: NextFunction): void => {
            const key = keyGenerator ? keyGenerator(req) : this.defaultKeyGenerator(req);
            const now = Date.now();

            // Inicializa ou reseta contador se a janela expirou
            if (!this.store[key] || this.store[key].resetTime < now) {
                this.store[key] = {
                    count: 0,
                    resetTime: now + windowMs,
                };
            }

            const record = this.store[key];

            // Adiciona headers informativos
            res.setHeader('X-RateLimit-Limit', maxRequests.toString());
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
            res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

            // Verifica se excedeu o limite
            if (record.count >= maxRequests) {
                const retryAfter = Math.ceil((record.resetTime - now) / 1000);
                res.setHeader('Retry-After', retryAfter.toString());

                logger.warn(
                    `Rate limit excedido`,
                    'RateLimiter',
                    {
                        key,
                        path: req.path,
                        method: req.method,
                        count: record.count,
                        limit: maxRequests,
                    }
                );

                throw new RateLimitError(
                    message || `Muitas requisições. Tente novamente em ${retryAfter} segundos.`
                );
            }

            // Incrementa contador (se configurado para contar este tipo de requisição)
            const shouldCount = !skipSuccessfulRequests && !skipFailedRequests;

            if (shouldCount) {
                record.count++;
            } else {
                // Interceptar resposta para decidir se conta
                const originalSend = res.send;
                res.send = function (body: any) {
                    const statusCode = res.statusCode;
                    const isSuccess = statusCode >= 200 && statusCode < 300;
                    const isFailed = statusCode >= 400;

                    if (
                        (!skipSuccessfulRequests || !isSuccess) &&
                        (!skipFailedRequests || !isFailed)
                    ) {
                        record.count++;
                    }

                    return originalSend.call(this, body);
                };
            }

            next();
        };
    }

    /**
     * Limpa todo o store (útil para testes)
     */
    reset(): void {
        this.store = {};
        logger.debug('Rate limiter store resetado', 'RateLimiter');
    }

    /**
     * Destroi o rate limiter (limpa interval)
     */
    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.store = {};
    }
}

// Instância singleton
const rateLimiter = new RateLimiter();

/**
 * Presets de rate limiting
 */

// Rate limit padrão: 500 requisições por 15 minutos
// (100 era muito baixo para SPAs que fazem múltiplas chamadas por navegação)
export const generalLimiter = rateLimiter.limit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 500,
    message: 'Muitas requisições. Tente novamente em alguns minutos.',
});

// Rate limit para autenticação: 5 tentativas por 15 minutos
export const authLimiter = rateLimiter.limit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    skipSuccessfulRequests: true, // Só conta falhas
    keyGenerator: (req) => {
        // Limitar por IP + email para login
        const email = req.body?.email || 'unknown';
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        return `auth:${ip}:${email}`;
    },
});

// Rate limit estrito para operações sensíveis: 10 por hora
export const strictLimiter = rateLimiter.limit({
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10,
    message: 'Limite de requisições para esta operação excedido. Tente novamente em 1 hora.',
});

// Rate limit para criação em massa: 3 por minuto
export const bulkOperationLimiter = rateLimiter.limit({
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 3,
    message: 'Muitas operações em massa. Aguarde 1 minuto.',
});

// Exportar instância para uso customizado
export { rateLimiter };
