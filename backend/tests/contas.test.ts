/**
 * Testes do Serviço de Contas
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { prisma } from "../src/database/conexao";

describe("Contas Service", () => {
    let skipTests = false;
    let testUser: any;
    let testDashboard: any;

    beforeAll(async () => {
        try {
            await prisma.$connect();

            testUser = await prisma.user.create({
                data: {
                    email: `contas-test-${Date.now()}@test.com`,
                    name: "Contas Test User",
                    password: "$2a$10$hashedpassword",
                }
            });

            testDashboard = await prisma.dashboard.create({
                data: {
                    title: "Contas Test Dashboard",
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
                await prisma.account.deleteMany({ where: { dashboardId: testDashboard.id } });
                await prisma.dashboardMember.deleteMany({ where: { dashboardId: testDashboard.id } });
                await prisma.dashboard.delete({ where: { id: testDashboard.id } });
                await prisma.user.delete({ where: { id: testUser.id } });
            } catch (e) { /* ignore */ }
        }
        await prisma.$disconnect();
    });

    it("should create an account", async () => {
        if (skipTests) {
            console.log("Test skipped: no database connection");
            return;
        }

        const account = await prisma.account.create({
            data: {
                name: "Conta Corrente Teste",
                type: "CHECKING",
                currency: "BRL",
                initialBalance: 1000,
                currentBalance: 1000,
                availableBalance: 1000,
                userId: testUser.id,
                dashboardId: testDashboard.id,
            }
        });

        expect(account).toBeDefined();
        expect(account.name).toBe("Conta Corrente Teste");
        expect(account.type).toBe("CHECKING");
    });

    it("should list accounts", async () => {
        if (skipTests) {
            console.log("Test skipped: no database connection");
            return;
        }

        const accounts = await prisma.account.findMany({
            where: { dashboardId: testDashboard.id, deletedAt: null }
        });

        expect(accounts).toBeDefined();
        expect(Array.isArray(accounts)).toBe(true);
    });

    it("should update account balance", async () => {
        if (skipTests) {
            console.log("Test skipped: no database connection");
            return;
        }

        const account = await prisma.account.create({
            data: {
                name: "Balance Test",
                type: "SAVINGS",
                currency: "BRL",
                initialBalance: 500,
                currentBalance: 500,
                availableBalance: 500,
                userId: testUser.id,
                dashboardId: testDashboard.id,
            }
        });

        const updated = await prisma.account.update({
            where: { id: account.id },
            data: { currentBalance: 1000 }
        });

        expect(updated.currentBalance).toBe(1000);
    });
});
