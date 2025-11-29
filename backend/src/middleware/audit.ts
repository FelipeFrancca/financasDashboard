import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/conexao';
import { logger } from '../utils/logger';
import { AuthRequest } from './auth';

/**
 * Middleware de Auditoria
 * Registra automaticamente ações de modificação no sistema
 */
export const auditMiddleware = (resourceName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        const originalSend = res.send;

        // Interceptar o envio da resposta para pegar o status e body
        res.send = function (body) {
            const duration = Date.now() - start;
            const authReq = req as AuthRequest;

            // Só registrar se tiver usuário logado e for uma operação de escrita
            // OU se for login/auth explícito
            if (authReq.user?.userId && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {

                // Executar de forma assíncrona para não travar a resposta
                (async () => {
                    try {
                        let action = 'UNKNOWN';
                        if (req.method === 'POST') action = 'CREATE';
                        if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
                        if (req.method === 'DELETE') action = 'DELETE';

                        // Tentar extrair ID do recurso da URL ou Body
                        const resourceId = req.params.id || req.body?.id || null;

                        // Sanitizar dados sensíveis (senha, tokens)
                        const sanitizedBody = { ...req.body };
                        delete sanitizedBody.password;
                        delete sanitizedBody.token;
                        delete sanitizedBody.confirmPassword;

                        await prisma.auditLog.create({
                            data: {
                                userId: authReq.user.userId,
                                action,
                                resource: resourceName,
                                resourceId,
                                method: req.method,
                                path: req.originalUrl,
                                ip: req.ip || req.socket.remoteAddress,
                                userAgent: req.get('user-agent'),
                                statusCode: res.statusCode,
                                duration,
                                newValues: action !== 'DELETE' ? sanitizedBody : undefined,
                                metadata: {
                                    query: req.query,
                                    params: req.params,
                                },
                            },
                        });
                    } catch (error: any) {
                        // Silently skip if audit_logs table doesn't exist
                        if (!error?.message?.includes('does not exist')) {
                            logger.error('Falha ao registrar log de auditoria', error);
                        }
                    }
                })();
            }

            return originalSend.call(this, body);
        };

        next();
    };
};
