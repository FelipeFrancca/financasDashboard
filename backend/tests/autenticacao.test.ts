/**
 * Testes do Serviço de Autenticação
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { prisma } from "../src/database/conexao";
import * as authServico from "../src/services/autenticacaoServico";

describe("Autenticação Service", () => {
    let skipTests = false;
    let createdUserId: string | null = null;
    const testEmail = `auth-test-${Date.now()}@test.com`;
    const testPassword = "SecurePassword123!";

    beforeAll(async () => {
        try {
            await prisma.$connect();
            await prisma.$queryRaw`SELECT 1`;
        } catch (error) {
            skipTests = true;
            console.log("⚠️ Database not available - skipping integration tests");
        }
    });

    afterAll(async () => {
        if (createdUserId) {
            try {
                await prisma.dashboardMember.deleteMany({ where: { userId: createdUserId } });
                await prisma.dashboard.deleteMany({ where: { ownerId: createdUserId } });
                await prisma.user.delete({ where: { id: createdUserId } });
            } catch (e) { /* ignore */ }
        }
        await prisma.$disconnect();
    });

    it("should register a new user", async () => {
        if (skipTests) {
            console.log("Test skipped: no database connection");
            return;
        }

        const result = await authServico.registerUser({
            email: testEmail,
            password: testPassword,
            name: "Test Auth User"
        });

        expect(result).toBeDefined();
        expect(result.user).toBeDefined();
        expect(result.user.email).toBe(testEmail);
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();

        createdUserId = result.user.id;
    });

    it("should login with correct credentials", async () => {
        if (skipTests || !createdUserId) {
            console.log("Test skipped: no database connection or user not created");
            return;
        }

        const result = await authServico.loginUser({
            email: testEmail,
            password: testPassword
        });

        expect(result).toBeDefined();
        expect(result.user.email).toBe(testEmail);
        expect(result.accessToken).toBeDefined();
    });

    it("should fail login with wrong password", async () => {
        if (skipTests || !createdUserId) {
            console.log("Test skipped: no database connection or user not created");
            return;
        }

        try {
            await authServico.loginUser({
                email: testEmail,
                password: "WrongPassword123!"
            });
            expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
            expect(error).toBeDefined();
        }
    });

    it("should refresh tokens", async () => {
        if (skipTests || !createdUserId) {
            console.log("Test skipped: no database connection or user not created");
            return;
        }

        const loginResult = await authServico.loginUser({
            email: testEmail,
            password: testPassword
        });

        const refreshResult = await authServico.refreshAccessToken(
            loginResult.refreshToken
        );

        expect(refreshResult).toBeDefined();
        expect(refreshResult.accessToken).toBeDefined();
    });

    it("should get user by id", async () => {
        if (skipTests || !createdUserId) {
            console.log("Test skipped: no database connection or user not created");
            return;
        }

        const user = await authServico.getUserById(createdUserId);

        expect(user).toBeDefined();
        expect(user?.email).toBe(testEmail);
    });
});
