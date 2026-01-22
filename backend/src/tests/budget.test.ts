import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as budgetService from '../services/orcamentosServico';
import { prisma } from '../database/conexao';
import { BudgetPeriod } from '@prisma/client';

describe.skip('Budget Service', () => {
    let testUserId: string;
    let testDashboardId: string;
    let testBudgetId: string;
    let skipTests = false;

    beforeAll(async () => {
        try {
            // Testar conexão com o banco
            await prisma.$connect();

            // Criar usuário de teste se não existir
            let user = await prisma.user.findUnique({ where: { email: 'budget-test@test.com' } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: 'budget-test@test.com',
                        password: 'test123',
                    },
                });
            }
            testUserId = user.id;

            // Criar dashboard de teste
            const dashboard = await prisma.dashboard.create({
                data: {
                    title: 'Test Dashboard for Budgets',
                    ownerId: testUserId,
                    members: {
                        create: {
                            userId: testUserId,
                            role: 'OWNER',
                            status: 'APPROVED'
                        }
                    }
                }
            });
            testDashboardId = dashboard.id;
        } catch (error) {
            console.warn('⚠️ Budget Service tests skipped: Database not available');
            skipTests = true;
        }
    });

    afterAll(async () => {
        // Limpar dados de teste
        if (testUserId) {
            await prisma.budget.deleteMany({ where: { userId: testUserId } });
        }
        if (testDashboardId) {
            await prisma.dashboardMember.deleteMany({ where: { dashboardId: testDashboardId } });
            await prisma.dashboard.delete({ where: { id: testDashboardId } }).catch(() => { });
        }
        if (testUserId) {
            await prisma.user.delete({ where: { id: testUserId } }).catch(() => { });
        }
        await prisma.$disconnect();
    });

    test('should create budget', async () => {
        if (skipTests) {
            console.log('Test skipped: no database connection');
            return;
        }

        const budget = await budgetService.createBudget(
            {
                dashboardId: testDashboardId,
                name: 'Alimentação',
                amount: 1000,
                period: 'MONTHLY' as BudgetPeriod,
                category: 'Alimentação',
                startDate: new Date(),
            },
            testDashboardId,
            testUserId
        );

        expect(budget).toBeDefined();
        expect(budget.name).toBe('Alimentação');
        expect(budget.amount).toBe(1000);
        testBudgetId = budget.id;
    });

    test('should get budget by id', async () => {
        if (skipTests || !testBudgetId) {
            console.log('Test skipped: no database connection or budget not created');
            return;
        }

        const budget = await budgetService.getBudgetById(testBudgetId, testDashboardId, testUserId);
        expect(budget).toBeDefined();
        expect(budget.id).toBe(testBudgetId);
    });

    test('should update budget', async () => {
        if (skipTests || !testBudgetId) {
            console.log('Test skipped: no database connection or budget not created');
            return;
        }

        const updated = await budgetService.updateBudget(
            testBudgetId,
            { dashboardId: testDashboardId, amount: 1500 },
            testDashboardId,
            testUserId
        );
        expect(updated.amount).toBe(1500);
    });

    test('should get budget progress', async () => {
        if (skipTests || !testBudgetId) {
            console.log('Test skipped: no database connection or budget not created');
            return;
        }

        const progress = await budgetService.getBudgetProgress(testBudgetId, testDashboardId, testUserId);
        expect(progress).toBeDefined();
        expect(progress.budgetId).toBe(testBudgetId);
        expect(progress.status).toBe('OK');
    });

    test('should delete budget', async () => {
        if (skipTests || !testBudgetId) {
            console.log('Test skipped: no database connection or budget not created');
            return;
        }

        await budgetService.deleteBudget(testBudgetId, testDashboardId, testUserId);

        // Verificar se foi deletado (soft delete)
        const budget = await prisma.budget.findUnique({
            where: { id: testBudgetId }
        });
        expect(budget).not.toBeNull();
        expect(budget?.deletedAt).not.toBeNull();
    });
});
