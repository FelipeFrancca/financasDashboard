/**
 * Testes do Serviço de Painéis (Dashboards)
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { prisma } from "../src/database/conexao";

describe("Painéis Service", () => {
    let skipTests = false;
    let testUser: any;
    const createdDashboards: string[] = [];

    beforeAll(async () => {
        try {
            await prisma.$connect();

            testUser = await prisma.user.create({
                data: {
                    email: `paineis-test-${Date.now()}@test.com`,
                    name: "Paineis Test User",
                    password: "$2a$10$hashedpassword",
                }
            });
        } catch (error) {
            skipTests = true;
            console.log("⚠️ Database not available - skipping integration tests");
        }
    });

    afterAll(async () => {
        if (!skipTests && testUser) {
            try {
                for (const id of createdDashboards) {
                    await prisma.dashboardMember.deleteMany({ where: { dashboardId: id } });
                    await prisma.dashboard.delete({ where: { id } }).catch(() => { });
                }
                await prisma.user.delete({ where: { id: testUser.id } }).catch(() => { });
            } catch (e) { /* ignore */ }
        }
        await prisma.$disconnect();
    });

    it("should create a dashboard", async () => {
        if (skipTests) {
            console.log("Test skipped: no database connection");
            return;
        }

        const dashboard = await prisma.dashboard.create({
            data: {
                title: "Dashboard Teste",
                ownerId: testUser.id,
                members: {
                    create: { userId: testUser.id, role: "OWNER", status: "APPROVED" }
                }
            }
        });

        expect(dashboard).toBeDefined();
        expect(dashboard.title).toBe("Dashboard Teste");
        createdDashboards.push(dashboard.id);
    });

    it("should list user dashboards", async () => {
        if (skipTests) {
            console.log("Test skipped: no database connection");
            return;
        }

        // Criar outro dashboard
        const dashboard = await prisma.dashboard.create({
            data: {
                title: "Dashboard Secundário",
                ownerId: testUser.id,
                members: {
                    create: { userId: testUser.id, role: "OWNER", status: "APPROVED" }
                }
            }
        });
        createdDashboards.push(dashboard.id);

        const dashboards = await prisma.dashboard.findMany({
            where: { ownerId: testUser.id }
        });

        expect(dashboards).toBeDefined();
        expect(dashboards.length).toBeGreaterThanOrEqual(2);
    });

    it("should update dashboard", async () => {
        if (skipTests || createdDashboards.length === 0) {
            console.log("Test skipped: no database connection or dashboards");
            return;
        }

        const updated = await prisma.dashboard.update({
            where: { id: createdDashboards[0] },
            data: { title: "Dashboard Atualizado", description: "Nova descrição" }
        });

        expect(updated.title).toBe("Dashboard Atualizado");
        expect(updated.description).toBe("Nova descrição");
    });

    it("should delete dashboard", async () => {
        if (skipTests) {
            console.log("Test skipped: no database connection");
            return;
        }

        const dashboard = await prisma.dashboard.create({
            data: {
                title: "To Delete",
                ownerId: testUser.id,
                members: {
                    create: { userId: testUser.id, role: "OWNER", status: "APPROVED" }
                }
            }
        });

        await prisma.dashboardMember.deleteMany({ where: { dashboardId: dashboard.id } });
        await prisma.dashboard.delete({ where: { id: dashboard.id } });

        const deleted = await prisma.dashboard.findUnique({
            where: { id: dashboard.id }
        });

        expect(deleted).toBeNull();
    });
});
