/**
 * Test Helpers - Utilitários reutilizáveis para testes
 */

import { prisma } from "../../src/database/conexao";

/**
 * Cria um usuário de teste
 */
export async function createTestUser(suffix: string = Date.now().toString()) {
    return prisma.user.create({
        data: {
            email: `test-${suffix}@test.com`,
            name: `Test User ${suffix}`,
            password: '$2a$10$hashedpassword',
        }
    });
}

/**
 * Cria um dashboard de teste para um usuário
 */
export async function createTestDashboard(userId: string, title: string = 'Test Dashboard') {
    return prisma.dashboard.create({
        data: {
            title,
            ownerId: userId,
            members: {
                create: { userId, role: 'OWNER' }
            }
        }
    });
}

/**
 * Cria uma conta de teste
 */
export async function createTestAccount(userId: string, dashboardId: string, name: string = 'Test Account') {
    return prisma.account.create({
        data: {
            name,
            type: 'CHECKING',
            currency: 'BRL',
            initialBalance: 1000,
            currentBalance: 1000,
            availableBalance: 1000,
            userId,
            dashboardId,
        }
    });
}

/**
 * Cria transações de teste
 */
export async function createTestTransactions(
    userId: string,
    dashboardId: string,
    count: number = 5
) {
    const transactions = [];
    const categories = ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação'];

    for (let i = 0; i < count; i++) {
        transactions.push({
            description: `Transaction ${i + 1}`,
            amount: Math.floor(Math.random() * 500) + 50,
            entryType: i % 3 === 0 ? 'Receita' : 'Despesa',
            flowType: i % 2 === 0 ? 'Fixa' : 'Variável',
            category: categories[i % categories.length],
            date: new Date(),
            userId,
            dashboardId,
        });
    }

    await prisma.transaction.createMany({ data: transactions });
    return prisma.transaction.findMany({
        where: { dashboardId, deletedAt: null }
    });
}

/**
 * Limpa dados de teste de um dashboard
 */
export async function cleanupTestData(dashboardId: string, userId: string) {
    try {
        // Deletar transações
        await prisma.transaction.deleteMany({ where: { dashboardId } });

        // Deletar contas
        await prisma.account.deleteMany({ where: { dashboardId } });

        // Deletar categorias
        await prisma.category.deleteMany({ where: { dashboardId } });

        // Deletar orçamentos
        await prisma.budget.deleteMany({ where: { dashboardId } });

        // Deletar metas
        await prisma.goal.deleteMany({ where: { dashboardId } });

        // Deletar membros do dashboard
        await prisma.dashboardMember.deleteMany({ where: { dashboardId } });

        // Deletar dashboard
        await prisma.dashboard.delete({ where: { id: dashboardId } });

        // Deletar usuário
        await prisma.user.delete({ where: { id: userId } });
    } catch (error) {
        console.warn('Cleanup warning:', error);
    }
}

/**
 * Verifica se o banco de dados está disponível
 */
export async function isDatabaseAvailable(): Promise<boolean> {
    try {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch {
        return false;
    }
}

/**
 * Gera um ID aleatório tipo CUID
 */
export function randomId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
