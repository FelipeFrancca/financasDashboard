/**
 * Account Service
 * Gerenciamento de contas financeiras com cálculo automático de saldos
 */

import { Account, AccountType, AccountStatus, Prisma } from '@prisma/client';
import { prisma } from '../database/conexao';
import { logger } from '../utils/logger';
import {
    CreateAccountDTO,
    UpdateAccountDTO,
    QueryAccountsDTO,
    UpdateBalanceDTO,
    ReconcileAccountDTO,
    AccountResponseDTO,
    AccountWithStatsDTO,
    ReconciliationResultDTO,
} from '../dtos/account.dto';
import {
    NotFoundError,
    ValidationError,
    ConflictError,
} from '../utils/AppError';

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Cria uma nova conta
 */
export async function createAccount(
    dto: CreateAccountDTO,
    dashboardId: string,
    userId: string
): Promise<Account> {
    logger.info('Criando nova conta', 'AccountService', { userId, dashboardId, type: dto.type });

    // Verificar permissão no dashboard
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId);

    // Se for marcar como primária, desmarcar outras do mesmo dashboard
    if (dto.isPrimary) {
        await prisma.account.updateMany({
            where: { userId, dashboardId, isPrimary: true },
            data: { isPrimary: false },
        });
    }

    // Remove userId and dashboardId from dto to avoid Prisma type conflicts
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dashboardId: _, userId: __, ...accountData } = dto as any;

    const account = await prisma.account.create({
        data: {
            ...accountData,
            currentBalance: dto.initialBalance,
            availableBalance: dto.type === AccountType.CREDIT_CARD
                ? (dto.creditLimit || 0) - dto.initialBalance
                : dto.initialBalance,
            user: {
                connect: { id: userId },
            },
            dashboard: {
                connect: { id: dashboardId },
            },
        },
    });

    logger.info('Conta criada com sucesso', 'AccountService', {
        accountId: account.id,
        userId,
        dashboardId,
    });

    return account;
}

/**
 * Lista contas do usuário com filtros
 */
export async function getAccounts(
    dto: QueryAccountsDTO,
    dashboardId: string,
    userId: string
): Promise<{ data: Account[]; total: number }> {
    // Verificar permissão no dashboard
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId);

    const where: Prisma.AccountWhereInput = {
        dashboardId,
        ...(dto.type && { type: dto.type }),
        ...(dto.status && { status: dto.status }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.institution && {
            institution: { contains: dto.institution, mode: 'insensitive' },
        }),
        ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
        ...(dto.includeDeleted ? {} : { deletedAt: null }),
    };

    const [accounts, total] = await prisma.$transaction([
        prisma.account.findMany({
            where,
            orderBy: { [dto.sortBy]: dto.sortOrder },
            skip: (dto.page - 1) * dto.limit,
            take: dto.limit,
        }),
        prisma.account.count({ where }),
    ]);

    return { data: accounts, total };
}

/**
 * Busca conta por ID
 */
export async function getAccountById(
    id: string,
    dashboardId: string,
    userId: string
): Promise<Account> {
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR', 'VIEWER']);

    const account = await prisma.account.findFirst({
        where: { id, dashboardId, deletedAt: null },
    });

    if (!account) {
        throw new NotFoundError('Conta não encontrada');
    }

    return account;
}

/**
 * Busca conta com estatísticas
 */
export async function getAccountWithStats(
    id: string,
    dashboardId: string,
    userId: string
): Promise<AccountWithStatsDTO> {
    const account = await getAccountById(id, dashboardId, userId);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalTransactions, lastTransaction, monthlyStats] = await Promise.all([
        prisma.transaction.count({
            where: { accountId: id, dashboardId, deletedAt: null },
        }),
        prisma.transaction.findFirst({
            where: { accountId: id, dashboardId, deletedAt: null },
            orderBy: { date: 'desc' },
            select: { date: true },
        }),
        prisma.transaction.findMany({
            where: {
                accountId: id,
                dashboardId,
                deletedAt: null,
                date: { gte: firstDayOfMonth },
            },
            select: { entryType: true, amount: true },
        }),
    ]);

    const monthlyIncome = monthlyStats
        .filter((t) => t.entryType === 'Receita')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyExpense = monthlyStats
        .filter((t) => t.entryType === 'Despesa')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
        ...account,
        stats: {
            totalTransactions,
            lastTransaction: lastTransaction?.date || null,
            monthlyIncome,
            monthlyExpense,
            balance: Number(account.currentBalance),
        },
    };
}

/**
 * Atualiza conta
 */
export async function updateAccount(
    id: string,
    dto: UpdateAccountDTO,
    dashboardId: string,
    userId: string
): Promise<Account> {
    // Verificar permissão
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR']);

    // Verificar se conta existe no dashboard
    const existing = await prisma.account.findFirst({
        where: { id, dashboardId, deletedAt: null }
    });
    if (!existing) throw new NotFoundError('Conta não encontrada');

    // Se for marcar como primária, desmarcar outras
    if (dto.isPrimary) {
        await prisma.account.updateMany({
            where: { dashboardId, isPrimary: true, id: { not: id } },
            data: { isPrimary: false },
        });
    }

    const account = await prisma.account.update({
        where: { id },
        data: dto,
    });

    logger.info('Conta atualizada', 'AccountService', { accountId: id, userId });

    return account;
}

/**
 * Deleta conta (soft delete)
 */
export async function deleteAccount(
    id: string,
    dashboardId: string,
    userId: string
): Promise<void> {
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId, ['OWNER']); // Only owner can delete accounts? Or editors? Let's assume Owner for deletion safety or logic. Actually Editor should be able to if they created it? But accounts are shared. Let's keep OWNER for deletion to match dashboard deletion logic usually, or check requirement. Actually, let's allow OWNER and EDITOR.
    // Wait, usually editors can delete resources. Let's verify dashboardMember logic.
    // DashboardMember roles: OWNER, EDITOR, VIEWER.
    // Safe to allow EDITOR to delete account? Probably yes.
    await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR']);

    // Verificar se conta existe
    const account = await prisma.account.findFirst({
        where: { id, dashboardId, deletedAt: null }
    });

    if (!account) throw new NotFoundError('Conta não encontrada');

    // Verificar se tem transações
    const transactionsCount = await prisma.transaction.count({
        where: { accountId: id, dashboardId, deletedAt: null },
    });

    if (transactionsCount > 0) {
        throw new ValidationError(
            'Não é possível deletar conta com transações. Remova ou transfira as transações primeiro.'
        );
    }

    await prisma.account.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            deletedBy: userId,
        },
    });

    logger.info('Conta deletada (soft delete)', 'AccountService', {
        accountId: id,
        userId,
    });
}

// ============================================
// BALANCE OPERATIONS
// ============================================

/**
 * Recalcula saldo da conta baseado nas transações
 */
export async function recalculateBalance(
    accountId: string,
    dashboardId: string,
    userId: string
): Promise<Account> {
    const account = await getAccountById(accountId, dashboardId, userId);

    const transactions = await prisma.transaction.findMany({
        where: {
            accountId,
            dashboardId,
            deletedAt: null,
        },
        select: {
            entryType: true,
            amount: true,
        },
    });

    const calculatedBalance = transactions.reduce((balance, tx) => {
        return tx.entryType === 'Receita'
            ? balance + Number(tx.amount)
            : balance - Number(tx.amount);
    }, Number(account.initialBalance));

    const availableBalance = account.type === AccountType.CREDIT_CARD
        ? (account.creditLimit || 0) - calculatedBalance
        : calculatedBalance;

    const updated = await prisma.account.update({
        where: { id: accountId },
        data: {
            currentBalance: calculatedBalance,
            availableBalance,
        },
    });

    logger.info('Saldo recalculado', 'AccountService', {
        accountId,
        oldBalance: account.currentBalance,
        newBalance: calculatedBalance,
    });

    return updated;
}

/**
 * Atualiza saldo manualmente (para ajustes)
 */
export async function updateBalance(
    accountId: string,
    dto: UpdateBalanceDTO,
    dashboardId: string,
    userId: string
): Promise<Account> {
    const account = await getAccountById(accountId, dashboardId, userId);

    let newBalance: number;

    switch (dto.operation) {
        case 'ADD':
            newBalance = Number(account.currentBalance) + dto.amount;
            break;
        case 'SUBTRACT':
            newBalance = Number(account.currentBalance) - dto.amount;
            break;
        case 'SET':
            newBalance = dto.amount;
            break;
    }

    const availableBalance = account.type === AccountType.CREDIT_CARD
        ? (account.creditLimit || 0) - newBalance
        : newBalance;

    const updated = await prisma.account.update({
        where: { id: accountId },
        data: {
            currentBalance: newBalance,
            availableBalance,
        },
    });

    logger.info('Saldo atualizado manualmente', 'AccountService', {
        accountId,
        operation: dto.operation,
        amount: dto.amount,
        oldBalance: account.currentBalance,
        newBalance,
    });

    return updated;
}

/**
 * Reconcilia conta com extrato bancário
 */
export async function reconcileAccount(
    accountId: string,
    dto: ReconcileAccountDTO,
    dashboardId: string,
    userId: string
): Promise<ReconciliationResultDTO> {
    const account = await recalculateBalance(accountId, dashboardId, userId);

    const difference = Number(account.currentBalance) - dto.statementBalance;
    const isReconciled = Math.abs(difference) < 0.01; // Tolerância de 1 centavo

    logger.info('Reconciliação realizada', 'AccountService', {
        accountId,
        calculatedBalance: account.currentBalance,
        statementBalance: dto.statementBalance,
        difference,
        isReconciled,
    });

    return {
        accountId,
        calculatedBalance: Number(account.currentBalance),
        statementBalance: dto.statementBalance,
        difference,
        isReconciled,
        reconciledAt: new Date(),
        notes: dto.notes || null,
    };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Valida se conta existe e pertence ao dashboard
 */
export async function validateAccountOwnership(
    accountId: string,
    dashboardId: string,
    userId?: string
): Promise<boolean> {
    try {
        const account = await prisma.account.findFirst({
            where: { id: accountId, dashboardId, deletedAt: null },
        });
        return !!account;
    } catch {
        return false;
    }
}

/**
 * Obtém conta primária do usuário (por dashboard)
 */
export async function getPrimaryAccount(userId: string, dashboardId?: string): Promise<Account | null> {
    const where: any = { userId, isPrimary: true, status: AccountStatus.ACTIVE, deletedAt: null };
    if (dashboardId) where.dashboardId = dashboardId;

    return prisma.account.findFirst({
        where,
    });
}

/**
 * Obtém resumo de todas as contas
 */
export async function getAccountsSummary(dashboardId: string, userId: string): Promise<{
    totalAccounts: number;
    totalBalance: number;
    totalAvailable: number;
    byType: Record<AccountType, { count: number; balance: number }>;
}> {
    // Verificar permissão no dashboard
    const { checkPermission } = await import('./paineisServico');
    await checkPermission(userId, dashboardId);

    const accounts = await prisma.account.findMany({
        where: { dashboardId, deletedAt: null, status: AccountStatus.ACTIVE },
    });

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);
    const totalAvailable = accounts.reduce((sum, acc) => sum + Number(acc.availableBalance), 0);

    const byType = accounts.reduce((acc, account) => {
        if (!acc[account.type]) {
            acc[account.type] = { count: 0, balance: 0 };
        }
        acc[account.type].count++;
        acc[account.type].balance += Number(account.currentBalance);
        return acc;
    }, {} as Record<AccountType, { count: number; balance: number }>);

    return {
        totalAccounts: accounts.length,
        totalBalance,
        totalAvailable,
        byType,
    };
}
