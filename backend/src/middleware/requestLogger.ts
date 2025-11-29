/**
 * Middleware de Logging de Requisições HTTP
 * Registra todas as requisições com detalhes úteis
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RequestLogData {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    ip: string;
    userAgent?: string;
    userId?: string;
    responseSize?: number;
}

/**
 * Middleware de logging de requisições HTTP
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // Captura informações da requisição
    const { method, url, ip } = req;
    const userAgent = req.get('user-agent');

    // Intercepta o método send para capturar a resposta
    const originalSend = res.send;

    res.send = function (body: any): Response {
        // Restaura o método original
        res.send = originalSend;

        // Calcula duração
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Dados do log
        const logData: RequestLogData = {
            method,
            url,
            statusCode,
            duration,
            ip: ip || 'unknown',
            userAgent,
            userId: (req as any).user?.userId,
            responseSize: body ? Buffer.byteLength(JSON.stringify(body)) : 0,
        };

        // Monta mensagem do log
        const message = `${method} ${url} ${statusCode} - ${duration}ms`;

        // Define nível de log baseado no status code
        if (statusCode >= 500) {
            logger.error(message, undefined, 'HTTP', logData);
        } else if (statusCode >= 400) {
            logger.warn(message, 'HTTP', logData);
        } else {
            logger.http(message, 'HTTP', logData);
        }

        return originalSend.call(this, body);
    };

    next();
}

/**
 * Middleware para logar apenas requisições lentas (> threshold)
 */
export function slowRequestLogger(thresholdMs: number = 1000) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const startTime = Date.now();

        const originalSend = res.send;

        res.send = function (body: any): Response {
            res.send = originalSend;

            const duration = Date.now() - startTime;

            // Só loga se exceder o threshold
            if (duration > thresholdMs) {
                logger.warn(
                    `Requisição lenta: ${req.method} ${req.url} - ${duration}ms`,
                    'SlowRequest',
                    {
                        method: req.method,
                        url: req.url,
                        duration,
                        threshold: thresholdMs,
                        userId: (req as any).user?.userId,
                    }
                );
            }

            return originalSend.call(this, body);
        };

        next();
    };
}
