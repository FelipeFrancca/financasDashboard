/**
 * Transfer Service
 * Gerenciamento de transferências entre contas
 */

import { Transaction } from '@prisma/client';
import { prisma } from '../database/conexao';
import { logger } from '../utils/logger';
import {
    CreateTransferDTO,
    TransferResponseDTO,
    QueryTransfersDTO,
} from '../dtos/transfer.dto';
import {
    NotFoundError,
    ValidationError,
    InternalServerError,
} from '../utils/AppError';
import * as accountService from './contasServico';

// ============================================
// TRANSFER OPERATIONS
// ============================================

/**
 * Cria uma transferência entre contas
 * Cria 2 transações linkadas: despesa na origem e receita no destino
 */
export async function createTransfer(
    dto: CreateTransferDTO,
    userId: string
): Promise<TransferResponseDTO> {
    logger.info('Criando transferência', 'TransferService', {
        userId,
        from: dto.fromAccountId,
        to: dto.toAccountId,
        amount: dto.amount,
    });

    // 1. Validar contas existem e pertencem ao usuário
    const [fromAccount, toAccount] = await Promise.all([
        accountService.getAccountById(dto.fromAccountId, userId),
        accountService.getAccountById(dto.toAccountId, userId),
    ]);

    // 2. Validar saldo suficiente na conta de origem
    if (fromAccount.currentBalance < dto.amount && fromAccount.type !== 'CREDIT_CARD') {
        throw new ValidationError('Saldo insuficiente na conta de origem', {
            available: fromAccount.currentBalance,
            required: dto.amount,
        });
    }

    // 3. Criar transferência em uma transação DB
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 3.1 Criar transação de débito (saída) na conta origem
            const debitTransaction = await tx.transaction.create({
                data: {
                    date: dto.date,
                    entryType: 'Despesa',
                    flowType: 'Variável',
                    category: 'Transferência',
                    subcategory: `Para: ${toAccount.name}`,
                    description: dto.description,
                    amount: dto.amount,
                    accountId: dto.fromAccountId,
                    transferToAccountId: dto.toAccountId,
                    userId,
                    notes: dto.notes,
                },
            });

            // 3.2 Criar transação de crédito (entrada) na conta destino
            const creditTransaction = await tx.transaction.create({
                data: {
                    date: dto.date,
                    entryType: 'Receita',
                    flowType: 'Variável',
                    category: 'Transferência',
                    subcategory: `De: ${fromAccount.name}`,
                    description: dto.description,
                    amount: dto.amount,
                    accountId: dto.toAccountId,
                    transferToAccountId: dto.fromAccountId,
                    linkedTransactionId: debitTransaction.id,
                    userId,
                    notes: dto.notes,
                },
            });

            // 3.3 Linkar transações (atualizar a primeira com o ID da segunda)
            await tx.transaction.update({
                where: { id: debitTransaction.id },
                data: { linkedTransactionId: creditTransaction.id },
            });

            // 3.4 Atualizar saldos das contas
            await tx.account.update({
                where: { id: dto.fromAccountId },
                data: {
                    currentBalance: { decrement: dto.amount },
                    availableBalance: fromAccount.type === 'CREDIT_CARD'
                        ? { decrement: dto.amount }
                        : { decrement: dto.amount },
                },
            });

            await tx.account.update({
                where: { id: dto.toAccountId },
                data: {
                    currentBalance: { increment: dto.amount },
                    availableBalance: toAccount.type === 'CREDIT_CARD'
                        ? { increment: dto.amount }
                        : { increment: dto.amount },
                },
            });

            return {
                debitTransaction,
                creditTransaction,
            };
        });

        logger.info('Transferência criada com sucesso', 'TransferService', {
            userId,
            debitId: result.debitTransaction.id,
            creditId: result.creditTransaction.id,
        });

        // Retornar resposta formatada
        return {
            id: result.debitTransaction.linkedTransactionId!,
            fromAccountId: dto.fromAccountId,
            toAccountId: dto.toAccountId,
            amount: dto.amount,
            date: dto.date,
            description: dto.description,
            notes: dto.notes || null,
            fromTransaction: {
                id: result.debitTransaction.id,
                accountId: result.debitTransaction.accountId!,
                amount: result.debitTransaction.amount,
                entryType: result.debitTransaction.entryType,
            },
            toTransaction: {
                id: result.creditTransaction.id,
                accountId: result.creditTransaction.accountId!,
                amount: result.creditTransaction.amount,
                entryType: result.creditTransaction.entryType,
            },
            createdAt: result.debitTransaction.createdAt,
        };
    } catch (error) {
        logger.error('Erro ao criar transferência', error as Error, 'TransferService', {
            userId,
            dto,
        });
        throw new InternalServerError('Erro ao processar transferência');
    }
}

/**
 * Lista transferências do usuário
 */
export async function getTransfers(
    dto: QueryTransfersDTO,
    userId: string
): Promise<{ data: Transaction[]; total: number }> {
    const where: any = {
        userId,
        deletedAt: null,
        category: 'Transferência',
        OR: [
            ...(dto.fromAccountId ? [{ accountId: dto.fromAccountId, entryType: 'Despesa' }] : []),
            ...(dto.toAccountId ? [{ accountId: dto.toAccountId, entryType: 'Receita' }] : []),
        ],
    };

    if (dto.startDate || dto.endDate) {
        where.date = {};
        if (dto.startDate) where.date.gte = dto.startDate;
        if (dto.endDate) where.date.lte = dto.endDate;
    }

    if (dto.minAmount || dto.maxAmount) {
        where.amount = {};
        if (dto.minAmount) where.amount.gte = dto.minAmount;
        if (dto.maxAmount) where.amount.lte = dto.maxAmount;
    }

    const [transfers, total] = await prisma.$transaction([
        prisma.transaction.findMany({
            where,
            orderBy: { [dto.sortBy]: dto.sortOrder },
            skip: (dto.page - 1) * dto.limit,
            take: dto.limit,
            include: {
                account: { select: { id: true, name: true, type: true } },
            },
        }),
        prisma.transaction.count({ where }),
    ]);

    return { data: transfers, total };
}

/**
 * Busca transferência por ID
 */
export async function getTransferById(
    transferId: string,
    userId: string
): Promise<TransferResponseDTO> {
    const transaction = await prisma.transaction.findFirst({
        where: {
            id: transferId,
            userId,
            deletedAt: null,
            category: 'Transferência',
        },
        include: {
            account: true,
            linkedTransaction: {
                include: {
                    account: true,
                },
            },
        },
    });

    if (!transaction || !transaction.linkedTransaction) {
        throw new NotFoundError('Transferência não encontrada');
    }

    const isDebit = transaction.entryType === 'Despesa';
    const debitTx = isDebit ? transaction : transaction.linkedTransaction;
    const creditTx = isDebit ? transaction.linkedTransaction : transaction;

    return {
        id: transaction.id,
        fromAccountId: debitTx.accountId!,
        toAccountId: creditTx.accountId!,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        notes: transaction.notes,
        fromTransaction: {
            id: debitTx.id,
            accountId: debitTx.accountId!,
            amount: debitTx.amount,
            entryType: debitTx.entryType,
        },
        toTransaction: {
            id: creditTx.id,
            accountId: creditTx.accountId!,
            amount: creditTx.amount,
            entryType: creditTx.entryType,
        },
        createdAt: transaction.createdAt,
    };
}

/**
 * Cancela/deleta uma transferência
 * Deleta ambas transações linkadas e reverte os saldos
 */
export async function deleteTransfer(
    transferId: string,
    userId: string
): Promise<void> {
    logger.info('Cancelando transferência', 'TransferService', { userId, transferId });

    // Buscar transferência
    const transfer = await getTransferById(transferId, userId);

    // Deletar em transação DB
    await prisma.$transaction(async (tx) => {
        // Soft delete das transações
        await tx.transaction.updateMany({
            where: {
                id: { in: [transfer.fromTransaction.id, transfer.toTransaction.id] },
                userId,
            },
            data: {
                deletedAt: new Date(),
                deletedBy: userId,
            },
        });

        // Reverter saldos
        await tx.account.update({
            where: { id: transfer.fromAccountId },
            data: {
                currentBalance: { increment: transfer.amount },
                availableBalance: { increment: transfer.amount },
            },
        });

        await tx.account.update({
            where: { id: transfer.toAccountId },
            data: {
                currentBalance: { decrement: transfer.amount },
                availableBalance: { decrement: transfer.amount },
            },
        });
    });

    logger.info('Transferência cancelada', 'TransferService', {
        userId,
        transferId,
    });
}
