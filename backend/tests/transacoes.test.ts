/**
 * Testes do Serviço de Transações
 * 
 * Estes são testes de integração que requerem banco de dados.
 * Se o banco não estiver disponível, os testes são automaticamente skipados.
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { prisma } from "../src/database/conexao";

describe("Transações Service", () => {
    let skipTests = false;
    let testUser: any;
    let testDashboard: any;

    beforeAll(async () => {
        try {
            await prisma.$connect();

            // Criar usuário de teste
            testUser = await prisma.user.create({
                data: {
                    email: `transacoes-test-${Date.now()}@test.com`,
                    name: "Transações Test User",
                    password: "$2a$10$hashedpassword",
                }
            });

            // Criar dashboard de teste
            testDashboard = await prisma.dashboard.create({
                data: {
                    title: "Transações Test Dashboard",
                    ownerId: testUser.id,
                    members: {
                        create: { userId: testUser.id, role: "OWNER", status: "APPROVED" }
                    }
                }
            });
        } catch (error) {
            skipTests = true;
            console.log("⚠️ Database not available - skipping integration tests");
        }
    });

    afterAll(async () => {
        if (!skipTests && testDashboard && testUser) {
            try {
                await prisma.transaction.deleteMany({ where: { dashboardId: testDashboard.id } });
                await prisma.dashboardMember.deleteMany({ where: { dashboardId: testDashboard.id } });
                await prisma.dashboard.delete({ where: { id: testDashboard.id } });
                await prisma.user.delete({ where: { id: testUser.id } });
            } catch (e) { /* ignore cleanup errors */ }
        }
        await prisma.$disconnect();
    });

    it("should create and retrieve transactions", async () => {
        if (skipTests) {
            console.log("Test skipped: no database connection");
            return;
        }

        // Criar transação
        const transaction = await prisma.transaction.create({
            data: {
                description: "Test Transaction",
                amount: 100,
                entryType: "Despesa",
                flowType: "Variável",
                category: "Teste",
                date: new Date(),
                userId: testUser.id,
                dashboardId: testDashboard.id,
            }
        });

        expect(transaction).toBeDefined();
        expect(transaction.description).toBe("Test Transaction");
        expect(transaction.amount).toBe(100);

        // Buscar transação
        const found = await prisma.transaction.findUnique({
            where: { id: transaction.id }
        });

        expect(found).toBeDefined();
        expect(found?.id).toBe(transaction.id);
    });

    it("should list transactions by dashboard", async () => {
        if (skipTests) {
            console.log("Test skipped: no database connection");
            return;
        }

        const transactions = await prisma.transaction.findMany({
            where: { dashboardId: testDashboard.id, deletedAt: null }
        });

        expect(transactions).toBeDefined();
        expect(Array.isArray(transactions)).toBe(true);
    });

    it("should soft delete a transaction", async () => {
        if (skipTests) {
            console.log("Test skipped: no database connection");
            return;
        }

        // Criar transação para deletar
        const transaction = await prisma.transaction.create({
            data: {
                description: "To Delete",
                amount: 50,
                entryType: "Despesa",
                flowType: "Variável",
                category: "Teste",
                date: new Date(),
                userId: testUser.id,
                dashboardId: testDashboard.id,
            }
        });

        // Soft delete
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { deletedAt: new Date() }
        });

        const deleted = await prisma.transaction.findUnique({
            where: { id: transaction.id }
        });

        expect(deleted?.deletedAt).not.toBeNull();
    });
});
