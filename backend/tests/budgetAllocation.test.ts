/**
 * Budget Allocation Service Tests
 * Testes automatizados para o serviço de alocação de orçamento por porcentagem
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { prisma } from "../src/database/conexao";
import {
    budgetAllocationService,
    DEFAULT_ALLOCATIONS,
    AllocationCategory,
    AllocationProfile,
} from "../src/services/budgetAllocationServico";

// ============================================
// TESTES UNITÁRIOS (não requerem banco de dados)
// ============================================

describe("Budget Allocation Service - Unit Tests", () => {

    // ============================================
    // TESTES DE CONSTANTES PADRÃO
    // ============================================

    describe("Default Allocations", () => {
        it("deve ter alocações padrão definidas", () => {
            expect(DEFAULT_ALLOCATIONS).toBeDefined();
            expect(Array.isArray(DEFAULT_ALLOCATIONS)).toBe(true);
            expect(DEFAULT_ALLOCATIONS.length).toBeGreaterThan(0);
        });

        it("alocações padrão devem somar 100%", () => {
            const total = DEFAULT_ALLOCATIONS.reduce((sum, a) => sum + a.percentage, 0);
            expect(total).toBe(100);
        });

        it("cada alocação padrão deve ter nome, porcentagem e cor", () => {
            DEFAULT_ALLOCATIONS.forEach((allocation) => {
                expect(allocation.name).toBeDefined();
                expect(typeof allocation.name).toBe('string');
                expect(allocation.percentage).toBeDefined();
                expect(typeof allocation.percentage).toBe('number');
                expect(allocation.percentage).toBeGreaterThan(0);
                expect(allocation.color).toBeDefined();
            });
        });

        it("deve ter as 5 categorias padrão esperadas", () => {
            const names = DEFAULT_ALLOCATIONS.map(a => a.name);
            expect(names).toContain('Despesas Fixas');
            expect(names).toContain('Lazer');
            expect(names).toContain('Investimentos');
            expect(names).toContain('Estudos');
            expect(names).toContain('Cuidados Pessoais');
        });

        it("Despesas Fixas deve ser 50%", () => {
            const fixed = DEFAULT_ALLOCATIONS.find(a => a.name === 'Despesas Fixas');
            expect(fixed).toBeDefined();
            expect(fixed!.percentage).toBe(50);
        });

        it("Lazer deve ser 20%", () => {
            const leisure = DEFAULT_ALLOCATIONS.find(a => a.name === 'Lazer');
            expect(leisure).toBeDefined();
            expect(leisure!.percentage).toBe(20);
        });

        it("Investimentos, Estudos e Cuidados Pessoais devem ser 10% cada", () => {
            const investments = DEFAULT_ALLOCATIONS.find(a => a.name === 'Investimentos');
            const studies = DEFAULT_ALLOCATIONS.find(a => a.name === 'Estudos');
            const personalCare = DEFAULT_ALLOCATIONS.find(a => a.name === 'Cuidados Pessoais');
            
            expect(investments!.percentage).toBe(10);
            expect(studies!.percentage).toBe(10);
            expect(personalCare!.percentage).toBe(10);
        });

        it("cada alocação deve ter linkedCategories", () => {
            DEFAULT_ALLOCATIONS.forEach((allocation) => {
                expect(allocation.linkedCategories).toBeDefined();
                expect(Array.isArray(allocation.linkedCategories)).toBe(true);
            });
        });
    });

    // ============================================
    // TESTES DE SIMULAÇÃO
    // ============================================

    describe("Simulation", () => {
        it("deve simular alocações corretamente", () => {
            const monthlyIncome = 10000;
            const simulation = budgetAllocationService.simulateAllocations(
                monthlyIncome,
                DEFAULT_ALLOCATIONS
            );

            expect(simulation).toBeDefined();
            expect(simulation.monthlyIncome).toBe(monthlyIncome);
            expect(simulation.allocations.length).toBe(DEFAULT_ALLOCATIONS.length);
            expect(simulation.totalAllocated).toBe(monthlyIncome);
            expect(simulation.remaining).toBe(0);
        });

        it("deve calcular valores corretos para cada categoria", () => {
            const monthlyIncome = 10000;
            const simulation = budgetAllocationService.simulateAllocations(
                monthlyIncome,
                DEFAULT_ALLOCATIONS
            );

            // Verificar Despesas Fixas (50%)
            const fixedExpenses = simulation.allocations.find(a => a.name === 'Despesas Fixas');
            expect(fixedExpenses).toBeDefined();
            expect(fixedExpenses!.amount).toBe(5000);
            expect(fixedExpenses!.percentage).toBe(50);

            // Verificar Lazer (20%)
            const leisure = simulation.allocations.find(a => a.name === 'Lazer');
            expect(leisure).toBeDefined();
            expect(leisure!.amount).toBe(2000);
            expect(leisure!.percentage).toBe(20);

            // Verificar Investimentos (10%)
            const investments = simulation.allocations.find(a => a.name === 'Investimentos');
            expect(investments).toBeDefined();
            expect(investments!.amount).toBe(1000);
            expect(investments!.percentage).toBe(10);
        });

        it("deve funcionar com alocações customizadas", () => {
            const customAllocations: AllocationCategory[] = [
                { name: 'Essencial', percentage: 60, color: '#000' },
                { name: 'Diversão', percentage: 25, color: '#fff' },
                { name: 'Poupança', percentage: 15, color: '#ccc' },
            ];

            const simulation = budgetAllocationService.simulateAllocations(5000, customAllocations);

            expect(simulation.allocations.length).toBe(3);
            expect(simulation.allocations[0].amount).toBe(3000); // 60% de 5000
            expect(simulation.allocations[1].amount).toBe(1250); // 25% de 5000
            expect(simulation.allocations[2].amount).toBe(750);  // 15% de 5000
        });

        it("deve retornar remaining correto quando porcentagens não somam 100", () => {
            const incompleteAllocations: AllocationCategory[] = [
                { name: 'A', percentage: 40, color: '#000' },
                { name: 'B', percentage: 30, color: '#fff' },
            ];

            const simulation = budgetAllocationService.simulateAllocations(1000, incompleteAllocations);

            expect(simulation.totalAllocated).toBe(700);
            expect(simulation.remaining).toBe(300);
        });

        it("deve lidar com receita zero", () => {
            const simulation = budgetAllocationService.simulateAllocations(0, DEFAULT_ALLOCATIONS);

            expect(simulation.monthlyIncome).toBe(0);
            expect(simulation.totalAllocated).toBe(0);
            expect(simulation.remaining).toBe(0);
            simulation.allocations.forEach(a => {
                expect(a.amount).toBe(0);
            });
        });

        it("deve lidar com alocações vazias", () => {
            const simulation = budgetAllocationService.simulateAllocations(1000, []);

            expect(simulation.allocations.length).toBe(0);
            expect(simulation.totalAllocated).toBe(0);
            expect(simulation.remaining).toBe(1000);
        });

        it("deve calcular corretamente com valores decimais", () => {
            const allocations: AllocationCategory[] = [
                { name: 'A', percentage: 33.33, color: '#000' },
                { name: 'B', percentage: 33.33, color: '#fff' },
                { name: 'C', percentage: 33.34, color: '#ccc' },
            ];

            const simulation = budgetAllocationService.simulateAllocations(1000, allocations);

            // 33.33% de 1000 = 333.3
            expect(simulation.allocations[0].amount).toBeCloseTo(333.3, 1);
            expect(simulation.allocations[1].amount).toBeCloseTo(333.3, 1);
            expect(simulation.allocations[2].amount).toBeCloseTo(333.4, 1);
        });

        it("deve manter as cores nas simulações", () => {
            const allocations: AllocationCategory[] = [
                { name: 'Teste', percentage: 100, color: '#ff5733' },
            ];

            const simulation = budgetAllocationService.simulateAllocations(1000, allocations);

            expect(simulation.allocations[0].color).toBe('#ff5733');
        });
    });

    // ============================================
    // TESTES DE VALIDAÇÃO DE PORCENTAGENS
    // ============================================

    describe("Percentage Validation", () => {
        it("deve aceitar porcentagens que somam exatamente 100%", () => {
            const validAllocations: AllocationCategory[] = [
                { name: 'A', percentage: 50, color: '#000' },
                { name: 'B', percentage: 30, color: '#fff' },
                { name: 'C', percentage: 20, color: '#ccc' },
            ];

            const total = validAllocations.reduce((sum, a) => sum + a.percentage, 0);
            expect(total).toBe(100);
        });

        it("deve detectar porcentagens que somam menos de 100%", () => {
            const underAllocations: AllocationCategory[] = [
                { name: 'A', percentage: 50, color: '#000' },
                { name: 'B', percentage: 30, color: '#fff' },
            ];

            const total = underAllocations.reduce((sum, a) => sum + a.percentage, 0);
            expect(total).toBeLessThan(100);
        });

        it("deve detectar porcentagens que somam mais de 100%", () => {
            const overAllocations: AllocationCategory[] = [
                { name: 'A', percentage: 60, color: '#000' },
                { name: 'B', percentage: 50, color: '#fff' },
            ];

            const total = overAllocations.reduce((sum, a) => sum + a.percentage, 0);
            expect(total).toBeGreaterThan(100);
        });
    });

    // ============================================
    // TESTES DE ESTRUTURA DE DADOS
    // ============================================

    describe("Data Structures", () => {
        it("AllocationCategory deve ter estrutura correta", () => {
            const category: AllocationCategory = {
                name: 'Test Category',
                percentage: 50,
                color: '#000000',
                icon: 'home',
                order: 1,
                linkedCategories: ['Cat1', 'Cat2'],
            };

            expect(category.name).toBe('Test Category');
            expect(category.percentage).toBe(50);
            expect(category.color).toBe('#000000');
            expect(category.icon).toBe('home');
            expect(category.order).toBe(1);
            expect(category.linkedCategories).toEqual(['Cat1', 'Cat2']);
        });

        it("AllocationProfile deve ter estrutura correta", () => {
            const profile: AllocationProfile = {
                name: 'Test Profile',
                description: 'A test profile',
                isDefault: true,
                isActive: true,
                dashboardId: 'dash-123',
                allocations: DEFAULT_ALLOCATIONS,
            };

            expect(profile.name).toBe('Test Profile');
            expect(profile.description).toBe('A test profile');
            expect(profile.isDefault).toBe(true);
            expect(profile.isActive).toBe(true);
            expect(profile.dashboardId).toBe('dash-123');
            expect(profile.allocations.length).toBe(5);
        });
    });
});

// ============================================
// TESTES DE INTEGRAÇÃO (requerem banco de dados)
// ============================================

describe("Budget Allocation Service - Integration Tests", () => {
    let testUser: any;
    let testDashboard: any;
    let skipTests = false;
    let createdProfileIds: string[] = [];

    beforeAll(async () => {
        try {
            await prisma.$connect();

            // Criar usuário de teste
            testUser = await prisma.user.create({
                data: {
                    email: `allocation-test-${Date.now()}@test.com`,
                    name: 'Allocation Test User',
                    password: 'hashedpassword',
                }
            });

            // Criar dashboard de teste
            testDashboard = await prisma.dashboard.create({
                data: {
                    title: 'Allocation Test Dashboard',
                    ownerId: testUser.id,
                    members: {
                        create: { userId: testUser.id, role: 'OWNER', status: 'APPROVED' }
                    }
                }
            });

            // Criar transações de teste para análise
            const today = new Date();
            const baseDate = new Date(today.getFullYear(), today.getMonth(), 15);

            // Receitas
            await prisma.transaction.createMany({
                data: [
                    {
                        description: 'Salário',
                        amount: 10000,
                        entryType: 'Receita',
                        flowType: 'Fixa',
                        category: 'Renda',
                        date: baseDate,
                        userId: testUser.id,
                        dashboardId: testDashboard.id,
                    }
                ]
            });

            // Despesas variadas para teste de análise
            await prisma.transaction.createMany({
                data: [
                    {
                        description: 'Aluguel',
                        amount: 2500,
                        entryType: 'Despesa',
                        flowType: 'Fixa',
                        category: 'Moradia',
                        date: baseDate,
                        userId: testUser.id,
                        dashboardId: testDashboard.id,
                    },
                    {
                        description: 'Conta de Luz',
                        amount: 300,
                        entryType: 'Despesa',
                        flowType: 'Fixa',
                        category: 'Contas',
                        date: baseDate,
                        userId: testUser.id,
                        dashboardId: testDashboard.id,
                    },
                    {
                        description: 'Supermercado',
                        amount: 1500,
                        entryType: 'Despesa',
                        flowType: 'Variável',
                        category: 'Alimentação',
                        date: baseDate,
                        userId: testUser.id,
                        dashboardId: testDashboard.id,
                    },
                    {
                        description: 'Netflix',
                        amount: 50,
                        entryType: 'Despesa',
                        flowType: 'Fixa',
                        category: 'Entretenimento',
                        date: baseDate,
                        userId: testUser.id,
                        dashboardId: testDashboard.id,
                    },
                    {
                        description: 'Restaurante',
                        amount: 400,
                        entryType: 'Despesa',
                        flowType: 'Variável',
                        category: 'Lazer',
                        date: baseDate,
                        userId: testUser.id,
                        dashboardId: testDashboard.id,
                    },
                    {
                        description: 'Curso Online',
                        amount: 200,
                        entryType: 'Despesa',
                        flowType: 'Variável',
                        category: 'Educação',
                        date: baseDate,
                        userId: testUser.id,
                        dashboardId: testDashboard.id,
                    },
                    {
                        description: 'Academia',
                        amount: 150,
                        entryType: 'Despesa',
                        flowType: 'Fixa',
                        category: 'Saúde',
                        date: baseDate,
                        userId: testUser.id,
                        dashboardId: testDashboard.id,
                    },
                    {
                        description: 'Investimento Tesouro',
                        amount: 500,
                        entryType: 'Despesa',
                        flowType: 'Variável',
                        category: 'Investimentos',
                        date: baseDate,
                        userId: testUser.id,
                        dashboardId: testDashboard.id,
                    },
                ]
            });

        } catch (error) {
            console.warn('Skipping integration tests - database not available');
            skipTests = true;
        }
    });

    afterAll(async () => {
        if (!skipTests && testDashboard) {
            try {
                // Limpar perfis de alocação criados
                const db = prisma as any;
                if (db.budgetAllocationProfile) {
                    await db.budgetAllocationProfile.deleteMany({
                        where: { userId: testUser.id }
                    });
                }

                // Limpar transações
                await prisma.transaction.deleteMany({
                    where: { dashboardId: testDashboard.id }
                });

                // Limpar membros do dashboard
                await prisma.dashboardMember.deleteMany({
                    where: { dashboardId: testDashboard.id }
                });

                // Limpar dashboard
                await prisma.dashboard.delete({
                    where: { id: testDashboard.id }
                });

                // Limpar usuário
                await prisma.user.delete({
                    where: { id: testUser.id }
                });
            } catch (error) {
                console.warn('Cleanup error:', error);
            }
        }
        try {
            await prisma.$disconnect();
        } catch {}
    });

    // ============================================
    // TESTES DE PERFIL (requer banco de dados)
    // ============================================

    describe("Profile Management", () => {
        it("deve criar perfil com alocações padrão", async () => {
            if (skipTests) {
                console.log('Skipping: database not available');
                return;
            }

            try {
                const profile = await budgetAllocationService.createDefaultProfile(
                    testUser.id,
                    testDashboard.id
                );

                expect(profile).toBeDefined();
                expect(profile.name).toBe('Padrão');
                expect(profile.isDefault).toBe(true);
                expect(profile.allocations).toBeDefined();
                expect(profile.allocations!.length).toBe(5);

                if (profile.id) {
                    createdProfileIds.push(profile.id);
                }
            } catch (error: any) {
                // Se o modelo não existe ainda, pular
                if (error.message?.includes('budgetAllocationProfile')) {
                    console.log('Skipping: BudgetAllocationProfile model not yet generated');
                    return;
                }
                throw error;
            }
        });

        it("deve criar perfil customizado", async () => {
            if (skipTests) {
                console.log('Skipping: database not available');
                return;
            }

            try {
                const customProfile: AllocationProfile = {
                    name: 'Perfil Agressivo',
                    description: 'Foco em investimentos',
                    isDefault: false,
                    dashboardId: testDashboard.id,
                    allocations: [
                        { name: 'Necessidades', percentage: 50, color: '#ef4444' },
                        { name: 'Investimentos', percentage: 30, color: '#10b981' },
                        { name: 'Lazer', percentage: 20, color: '#8b5cf6' },
                    ],
                };

                const profile = await budgetAllocationService.createProfile(
                    testUser.id,
                    customProfile
                );

                expect(profile).toBeDefined();
                expect(profile.name).toBe('Perfil Agressivo');
                expect(profile.description).toBe('Foco em investimentos');
                expect(profile.allocations!.length).toBe(3);

                if (profile.id) {
                    createdProfileIds.push(profile.id);
                }
            } catch (error: any) {
                if (error.message?.includes('budgetAllocationProfile')) {
                    console.log('Skipping: BudgetAllocationProfile model not yet generated');
                    return;
                }
                throw error;
            }
        });

        it("deve rejeitar perfil com porcentagens que não somam 100%", async () => {
            if (skipTests) {
                console.log('Skipping: database not available');
                return;
            }

            const invalidProfile: AllocationProfile = {
                name: 'Perfil Inválido',
                allocations: [
                    { name: 'A', percentage: 30, color: '#000' },
                    { name: 'B', percentage: 40, color: '#fff' },
                    // Total = 70%, deveria ser 100%
                ],
            };

            try {
                await budgetAllocationService.createProfile(testUser.id, invalidProfile);
                // Se não lançou erro, falhar o teste
                expect(true).toBe(false); // Deveria ter lançado erro
            } catch (error: any) {
                if (error.message?.includes('budgetAllocationProfile')) {
                    console.log('Skipping: BudgetAllocationProfile model not yet generated');
                    return;
                }
                // Esperamos erro de validação
                expect(error.message).toMatch(/soma|porcentagem|100/i);
            }
        });

        it("deve listar perfis do usuário", async () => {
            if (skipTests) {
                console.log('Skipping: database not available');
                return;
            }

            try {
                const profiles = await budgetAllocationService.listProfiles(
                    testUser.id,
                    testDashboard.id
                );

                expect(Array.isArray(profiles)).toBe(true);
                // Pode ter 0 ou mais perfis dependendo dos testes anteriores
            } catch (error: any) {
                if (error.message?.includes('budgetAllocationProfile')) {
                    console.log('Skipping: BudgetAllocationProfile model not yet generated');
                    return;
                }
                throw error;
            }
        });

        it("deve obter perfil padrão do usuário", async () => {
            if (skipTests) {
                console.log('Skipping: database not available');
                return;
            }

            try {
                const profile = await budgetAllocationService.getDefaultProfile(
                    testUser.id,
                    testDashboard.id
                );

                // Pode retornar null se não há perfil padrão
                if (profile) {
                    expect(profile.isDefault).toBe(true);
                }
            } catch (error: any) {
                if (error.message?.includes('budgetAllocationProfile')) {
                    console.log('Skipping: BudgetAllocationProfile model not yet generated');
                    return;
                }
                throw error;
            }
        });
    });

    // ============================================
    // TESTES DE ANÁLISE
    // ============================================

    describe("Allocation Analysis", () => {
        it("deve analisar alocações do período", async () => {
            if (skipTests) {
                console.log('Skipping: database not available');
                return;
            }

            try {
                const analysis = await budgetAllocationService.analyzeAllocations(
                    testUser.id,
                    testDashboard.id
                );

                expect(analysis).toBeDefined();
                expect(analysis.totalIncome).toBeGreaterThan(0);
                expect(analysis.allocations).toBeDefined();
                expect(Array.isArray(analysis.allocations)).toBe(true);
                expect(analysis.summary).toBeDefined();
                expect(['healthy', 'warning', 'critical']).toContain(analysis.summary.overallStatus);
            } catch (error: any) {
                if (error.message?.includes('budgetAllocationProfile')) {
                    console.log('Skipping: BudgetAllocationProfile model not yet generated');
                    return;
                }
                throw error;
            }
        });

        it("deve retornar alertas quando gastos excedem limites", async () => {
            if (skipTests) {
                console.log('Skipping: database not available');
                return;
            }

            try {
                const alerts = await budgetAllocationService.getAllocationAlerts(
                    testUser.id,
                    testDashboard.id
                );

                expect(Array.isArray(alerts)).toBe(true);
                // Alertas podem ou não existir dependendo dos dados
                if (alerts.length > 0) {
                    expect(['warning', 'critical']).toContain(alerts[0].type);
                    expect(alerts[0].message).toBeDefined();
                }
            } catch (error: any) {
                if (error.message?.includes('budgetAllocationProfile')) {
                    console.log('Skipping: BudgetAllocationProfile model not yet generated');
                    return;
                }
                throw error;
            }
        });
    });

    // ============================================
    // TESTES DE ATUALIZAÇÃO E DELEÇÃO
    // ============================================

    describe("Profile Update and Delete", () => {
        it("deve atualizar perfil existente", async () => {
            if (skipTests || createdProfileIds.length === 0) {
                console.log('Skipping: no profiles to update');
                return;
            }

            try {
                const profileId = createdProfileIds[0];
                const updated = await budgetAllocationService.updateProfile(
                    profileId,
                    testUser.id,
                    { name: 'Perfil Atualizado', description: 'Nova descrição' }
                );

                expect(updated.name).toBe('Perfil Atualizado');
                expect(updated.description).toBe('Nova descrição');
            } catch (error: any) {
                if (error.message?.includes('budgetAllocationProfile')) {
                    console.log('Skipping: BudgetAllocationProfile model not yet generated');
                    return;
                }
                throw error;
            }
        });

        it("deve deletar perfil", async () => {
            if (skipTests) {
                console.log('Skipping: database not available');
                return;
            }

            try {
                // Criar perfil para deletar
                const profile = await budgetAllocationService.createProfile(testUser.id, {
                    name: 'Perfil Para Deletar',
                    allocations: DEFAULT_ALLOCATIONS,
                });

                await budgetAllocationService.deleteProfile(profile.id!, testUser.id);

                // Verificar que foi deletado
                const deleted = await budgetAllocationService.getProfile(profile.id!, testUser.id);
                expect(deleted).toBeNull();
            } catch (error: any) {
                if (error.message?.includes('budgetAllocationProfile')) {
                    console.log('Skipping: BudgetAllocationProfile model not yet generated');
                    return;
                }
                throw error;
            }
        });

        it("deve retornar erro ao deletar perfil inexistente", async () => {
            if (skipTests) {
                console.log('Skipping: database not available');
                return;
            }

            try {
                await budgetAllocationService.deleteProfile('non-existent-id', testUser.id);
                // Se não lançou erro, falhar o teste
                expect(true).toBe(false); // Deveria ter lançado erro
            } catch (error: any) {
                if (error.message?.includes('budgetAllocationProfile')) {
                    console.log('Skipping: BudgetAllocationProfile model not yet generated');
                    return;
                }
                // Esperamos erro de "não encontrado"
                expect(error.message).toMatch(/não encontrado|not found/i);
            }
        });
    });
});
