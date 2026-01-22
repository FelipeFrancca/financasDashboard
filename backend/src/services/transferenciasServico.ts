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

    // 1. Validar contas existem e pertencem ao usuário/dashboard
    const [fromAccount, toAccount] = await Promise.all([
        accountService.getAccountById(dto.fromAccountId, dto.dashboardId, userId),
        accountService.getAccountById(dto.toAccountId, dto.dashboardId, userId),
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
                    description: dto.description || `Transferência para ${toAccount.name}`,
                    amount: dto.amount,
                    accountId: dto.fromAccountId,
                    transferToAccountId: dto.toAccountId,
                    userId,
                    dashboardId: dto.dashboardId,
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
                    description: dto.description || `Transferência de ${fromAccount.name}`,
                    amount: dto.amount,
                    accountId: dto.toAccountId,
                    transferToAccountId: dto.fromAccountId,
                    linkedTransactionId: debitTransaction.id,
                    userId,
                    dashboardId: dto.dashboardId,
                    notes: dto.notes,
                },
            });

            // 3.3 Linkar transações (atualizar a primeira com o ID da segunda)
            await tx.transaction.update({
                where: { id: debitTransaction.id },
                data: { linkedTransactionId: creditTransaction.id },
            });

            return { debitTransaction, creditTransaction };
        });

        // 3.4 Atualizar saldos das contas (fora da transaction para evitar deadlocks complexos)
        await Promise.all([
            accountService.recalculateBalance(dto.fromAccountId, dto.dashboardId, userId),
            accountService.recalculateBalance(dto.toAccountId, dto.dashboardId, userId),
        ]);

        logger.info('Transferência criada com sucesso', 'TransferService', {
            userId,
            debitId: result.debitTransaction.id,
            creditId: result.creditTransaction.id,
        });

        // Retornar resposta formatada com os dados retornados do banco
        return {
            id: result.debitTransaction.linkedTransactionId!,
            fromAccountId: dto.fromAccountId,
            toAccountId: dto.toAccountId,
            fromAccountName: fromAccount.name,
            toAccountName: toAccount.name,
            amount: dto.amount,
            date: dto.date,
            description: dto.description,
            linkedTransactionId: result.creditTransaction.id,
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
        dashboardId: dto.dashboardId,
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

    if (dto.accountId) {
        where.OR = undefined; // Remove o OR anterior se accountId especifico for passado
        where.accountId = dto.accountId;
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
    dashboardId: string,
    userId: string
): Promise<TransferResponseDTO> {
    const transaction = await prisma.transaction.findFirst({
        where: {
            id: transferId,
            userId,
            dashboardId,
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
        fromAccountName: debitTx.account?.name,
        toAccountName: creditTx.account?.name,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        linkedTransactionId: creditTx.id,
    };
}

/**
 * Cancela/deleta uma transferência
 * Deleta ambas transações linkadas e reverte os saldos
 */
export async function deleteTransfer(
    transferId: string,
    dashboardId: string,
    userId: string
): Promise<void> {
    logger.info('Cancelando transferência', 'TransferService', { userId, transferId });

    // Buscar transferência
    const transfer = await getTransferById(transferId, dashboardId, userId);

    // Deletar em transação DB
    await prisma.$transaction(async (tx) => {
        // Soft delete das transações (baseada na debit e credit IDs do response)
        // O response retorna ID da transação principal (debit) e linkedTransactionId (credit)
        const idsToDelete = [transfer.id];
        if (transfer.linkedTransactionId) idsToDelete.push(transfer.linkedTransactionId);

        await tx.transaction.updateMany({
            where: {
                id: { in: idsToDelete },
                userId,
                dashboardId,
            },
            data: {
                deletedAt: new Date(),
                deletedBy: userId,
            },
        });
    });

    // Reverter saldos
    await Promise.all([
        accountService.recalculateBalance(transfer.fromAccountId, dashboardId, userId),
        accountService.recalculateBalance(transfer.toAccountId, dashboardId, userId),
    ]);

    logger.info('Transferência cancelada', 'TransferService', {
        userId,
        transferId,
    });
}
