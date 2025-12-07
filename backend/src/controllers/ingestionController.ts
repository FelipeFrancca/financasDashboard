/**
 * Controller para ingestão de documentos financeiros
 */

import type { Request, Response } from 'express';
import { IngestionService } from '../services/ingestionService';
import { ValidationError, InternalServerError } from '../utils/AppError';
import { logger } from '../utils/logger';
import {
    extractionResultSchema,
    fileUploadSchema,
} from '../validators/ingestionValidator';
import type { SupportedMimeType } from '../types/ingestion.types';

const ingestionService = new IngestionService();

/**
 * Upload e processamento de arquivo financeiro
 * POST /api/ingestion/upload
 */
export async function uploadFinancialDocument(
    req: Request,
    res: Response
): Promise<void> {
    const userId = (req as any).user?.userId;

    logger.info('Recebendo upload de documento financeiro', 'IngestionController', {
        userId,
    });

    // Valida se o arquivo foi enviado
    if (!req.file) {
        throw new ValidationError('Nenhum arquivo foi enviado');
    }

    const { buffer, mimetype, size } = req.file;

    // Valida o arquivo
    const fileValidation = fileUploadSchema.safeParse({
        buffer,
        mimetype,
        size,
    });

    if (!fileValidation.success) {
        throw new ValidationError(
            'Arquivo inválido',
            fileValidation.error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }))
        );
    }

    try {
        // Extrai categorias do corpo da requisição (se houver)
        let categories: string[] = [];
        if (req.body.categories) {
            try {
                // Se vier como string JSON (comum em FormData), faz parse
                if (typeof req.body.categories === 'string') {
                    categories = JSON.parse(req.body.categories);
                } else if (Array.isArray(req.body.categories)) {
                    categories = req.body.categories;
                }
            } catch (e) {
                logger.warn('Erro ao fazer parse das categorias', 'IngestionController', { error: e });
            }
        }

        // Processa o arquivo
        const result = await ingestionService.processFile(
            buffer,
            mimetype as SupportedMimeType,
            categories
        );

        // Valida o resultado da extração
        const validationResult = extractionResultSchema.safeParse(result);

        if (!validationResult.success) {
            logger.error(
                'Resultado da extração inválido',
                JSON.stringify(validationResult.error.format(), null, 2),
                'IngestionController'
            );
            throw new InternalServerError('Falha na validação dos dados extraídos');
        }

        logger.info('Documento processado com sucesso', 'IngestionController', {
            userId,
            method: result.extractionMethod,
            confidence: result.confidence,
            merchant: result.merchant,
            amount: result.amount,
        });

        res.status(200).json({
            success: true,
            data: validationResult.data,
        });
    } catch (error) {
        // Erros são tratados pelo error handler global
        throw error;
    }
}
