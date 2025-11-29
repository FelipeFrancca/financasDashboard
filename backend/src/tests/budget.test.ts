import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as budgetService from '../services/orcamentosServico';
import { prisma } from '../database/conexao';
import { BudgetPeriod } from '@prisma/client';

describe('Budget Service', () => {
    let testUserId: string;
    let testBudgetId: string;

    beforeAll(async () => {
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
    });

    afterAll(async () => {
        // Limpar dados de teste
        if (testUserId) {
            await prisma.budget.deleteMany({ where: { userId: testUserId } });
            await prisma.user.delete({ where: { id: testUserId } });
        }
    });

    test('should create budget', async () => {
        const budget = await budgetService.createBudget(
            {
                name: 'Alimentação',
                amount: 1000,
                period: 'MONTHLY' as BudgetPeriod,
                category: 'Alimentação',
                startDate: new Date(),
            },
            testUserId
        );

        expect(budget).toBeDefined();
        expect(budget.name).toBe('Alimentação');
        expect(budget.amount).toBe(1000);
        testBudgetId = budget.id;
    });

    test('should get budget by id', async () => {
        const budget = await budgetService.getBudgetById(testBudgetId, testUserId);
        expect(budget).toBeDefined();
        expect(budget.id).toBe(testBudgetId);
    });

    test('should update budget', async () => {
        const updated = await budgetService.updateBudget(
            testBudgetId,
            { amount: 1500 },
            testUserId
        );
        expect(updated.amount).toBe(1500);
    });

    test('should get budget progress', async () => {
        const progress = await budgetService.getBudgetProgress(testBudgetId, testUserId);
        expect(progress).toBeDefined();
        expect(progress.budgetId).toBe(testBudgetId);
        expect(progress.status).toBe('OK');
    });

    test('should delete budget', async () => {
        console.log('Tentando deletar budget:', testBudgetId);
        await budgetService.deleteBudget(testBudgetId, testUserId);

        // Verificar se foi deletado (soft delete)
        const budget = await prisma.budget.findUnique({ // findUnique é melhor para ID
            where: { id: testBudgetId }
        });
        console.log('Budget após delete:', budget);
        expect(budget).not.toBeNull();
        expect(budget?.deletedAt).not.toBeNull();
    });
});
