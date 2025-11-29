/**
 * Exemplo de como usar os novos validadores e middlewares nas rotas
 * Este arquivo serve como referência para atualizar as demais rotas
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { validateBody, validateQuery, validateParams, idParamSchema } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";
import { authLimiter } from "../middleware/rateLimiter";
import {
    createTransactionSchema,
    updateTransactionSchema,
    transactionQuerySchema,
    bulkCreateTransactionSchema,
} from "../validators/transactionValidator";
import * as transactionService from "../services/transacoesServico";
import { logger } from "../utils/logger";

const router = Router();

/**
 * EXEMPLO 1: GET com query params e paginação
 */
router.get(
    "/",
    authenticateToken,
    validateQuery(transactionQuerySchema),
    asyncHandler(async (req: AuthRequest, res: Response as any) => {
        const filters = req.query;
        const userId = req.user.userId;

        logger.debug("Listando transações", "TransactionRoute", { userId, filters });

        const transactions = await transactionService.getAllTransactions(filters, userId);

        res.json({
            success: true,
            data: transactions,
            count: transactions.length,
        });
    })
);

/**
 * EXEMPLO 2: GET por ID com validação de params
 */
router.get(
    "/:id",
    authenticateToken,
    validateParams(idParamSchema),
    asyncHandler(async (req: AuthRequest, res: Response as any) => {
        const { id } = req.params;
        const userId = req.user.userId;

        const transaction = await transactionService.getTransactionById(id, userId);

        res.json({
            success: true,
            data: transaction,
        });
    })
);

/**
 * EXEMPLO 3: POST com validação de body
 */
router.post(
    "/",
    authenticateToken,
    validateBody(createTransactionSchema),
    asyncHandler(async (req: AuthRequest, res: Response as any) => {
        const data = req.body;
        const userId = req.user.userId;

        logger.info("Criando transação", "TransactionRoute", { userId });

        const transaction = await transactionService.createTransaction(data, userId);

        res.status(201).json({
            success: true,
            data: transaction,
            message: "Transação criada com sucesso",
        });
    })
);

/**
 * EXEMPLO 4: POST bulk com rate limiting específico
 */
router.post(
    "/bulk",
    authenticateToken,
    authLimiter, // Rate limit mais restrito para bulk
    validateBody(bulkCreateTransactionSchema),
    asyncHandler(async (req: AuthRequest, res: Response as any) => {
        const dataArray = req.body;
        const userId = req.user.userId;

        logger.info(`Criando ${dataArray.length} transações em bulk`, "TransactionRoute", { userId });

        const transactions: any[] = [];
        for (const data of dataArray) {
            const transaction = await transactionService.createTransaction(data, userId);
            transactions.push(transaction);
        }

        res.status(201).json({
            success: true,
            data: transactions,
            count: transactions.length,
            message: `${transactions.length} transações criadas com sucesso`,
        });
    })
);

/**
 * EXEMPLO 5: PUT com validação de params e body
 */
router.put(
    "/:id",
    authenticateToken,
    validateParams(idParamSchema),
    validateBody(updateTransactionSchema),
    asyncHandler(async (req: AuthRequest, res: Response as any) => {
        const { id } = req.params;
        const data = req.body;
        const userId = req.user.userId;

        logger.info("Atualizando transação", "TransactionRoute", { userId, transactionId: id });

        const transaction = await transactionService.updateTransaction(id, data, userId);

        res.json({
            success: true,
            data: transaction,
            message: "Transação atualizada com sucesso",
        });
    })
);

/**
 * EXEMPLO 6: DELETE
 */
router.delete(
    "/:id",
    authenticateToken,
    validateParams(idParamSchema),
    asyncHandler(async (req: AuthRequest, res: Response as any) => {
        const { id } = req.params;
        const userId = req.user.userId;

        logger.info("Deletando transação", "TransactionRoute", { userId, transactionId: id });

        await transactionService.deleteTransaction(id, userId);

        res.status(204).send();
    })
);

export default router;

/**
 * OBSERVAÇÕES:
 * 
 * 1. asyncHandler: Envelopa funções async e captura erros automaticamente
 * 
 * 2. validateBody/Query/Params: Valida e transforma dados com Zod
 *    - Se inválido, retorna 400 com erro detalhado
 *    - Se válido, os dados já vêm tipados e transformados
 * 
 * 3. Erros customizados: Lance AppError, ValidationError, etc nos services
 *    - São automaticamente tratados pelo errorHandler
 *    - Logs são gerados automaticamente
 * 
 * 4. Rate limiting: Adicione middlewares específicos quando necessário
 *    - authLimiter: para login/auth (5 req/15min)
 *    - strictLimiter: para operações sensíveis (10 req/hora)
 *    - bulkOperationLimiter: para bulk (3 req/min)
 * 
 * 5. Logging: Use logger.info/warn/error conforme necessário
 *    - Request logging é automático
 *    - Errors são logados automaticamente
 * 
 * 6. Respostas padronizadas:
 *    - Sucesso: { success: true, data: ..., message?: ... }
 *    - Erro: { error: { message, code, details? } }
 */
