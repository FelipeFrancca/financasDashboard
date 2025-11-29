import { Prisma } from '@prisma/client';

/**
 * Definição das Associações e Tipos Estendidos do Prisma
 * Este arquivo centraliza os tipos que incluem relacionamentos.
 */

// Usuário com todos os dados relacionados
export type UsuarioCompleto = Prisma.UserGetPayload<{
    include: {
        accounts: true;
        transactions: true;
        budgets: true;
        categories: true;
        financialGoals: true;
        alerts: true;
        recurringTransactions: true;
        dashboardsOwned: true;
        dashboardMemberships: true;
    }
}>;

// Conta com transações
export type ContaComTransacoes = Prisma.AccountGetPayload<{
    include: {
        transactions: true;
    }
}>;

// Dashboard com membros
export type DashboardComMembros = Prisma.DashboardGetPayload<{
    include: {
        members: {
            include: {
                user: {
                    select: {
                        id: true;
                        name: true;
                        email: true;
                        avatar: true;
                    }
                }
            }
        }
    }
}>;

// Categoria com filhos (Árvore)
export type CategoriaComFilhos = Prisma.CategoryGetPayload<{
    include: {
        children: true;
    }
}>;
