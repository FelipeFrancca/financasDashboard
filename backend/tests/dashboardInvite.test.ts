import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { PrismaClient, DashboardRole } from '@prisma/client';
import * as paineisServico from '../src/services/paineisServico';

const prisma = new PrismaClient();

describe('Dashboard Invite Service', () => {
    let testUser: any;
    let testUser2: any;
    let testDashboard: any;

    beforeAll(async () => {
        // Create test users
        testUser = await prisma.user.create({
            data: {
                email: `test-invite-${Date.now()}@test.com`,
                name: 'Test User Invites',
                password: 'hashedpassword123',
            }
        });

        testUser2 = await prisma.user.create({
            data: {
                email: `test-invite2-${Date.now()}@test.com`,
                name: 'Test User 2 Invites',
                password: 'hashedpassword123',
            }
        });

        // Create test dashboard
        testDashboard = await prisma.dashboard.create({
            data: {
                title: 'Test Dashboard for Invites',
                description: 'Dashboard for testing invite functionality',
                ownerId: testUser.id,
                members: {
                    create: {
                        userId: testUser.id,
                        role: 'OWNER'
                    }
                }
            }
        });
    });

    afterAll(async () => {
        // Cleanup
        await prisma.dashboardInvite.deleteMany({
            where: { dashboardId: testDashboard.id }
        });
        await prisma.dashboardMember.deleteMany({
            where: { dashboardId: testDashboard.id }
        });
        await prisma.dashboard.delete({
            where: { id: testDashboard.id }
        });
        await prisma.user.delete({ where: { id: testUser.id } });
        await prisma.user.delete({ where: { id: testUser2.id } });
        await prisma.$disconnect();
    });

    describe('createInvite', () => {
        it('should generate an invite with a unique code', async () => {
            const invite = await paineisServico.createInvite(
                testUser.id,
                testDashboard.id,
                { role: 'VIEWER' }
            );

            expect(invite).toBeDefined();
            expect(invite.code).toBeDefined();
            expect(invite.code.length).toBe(8);
            expect(invite.role).toBe('VIEWER');
            expect(invite.dashboardId).toBe(testDashboard.id);
            expect(invite.createdById).toBe(testUser.id);
        });

        it('should generate unique codes for multiple invites', async () => {
            const invite1 = await paineisServico.createInvite(
                testUser.id,
                testDashboard.id,
                { role: 'VIEWER' }
            );

            const invite2 = await paineisServico.createInvite(
                testUser.id,
                testDashboard.id,
                { role: 'EDITOR' }
            );

            expect(invite1.code).not.toBe(invite2.code);
        });

        it('should create invite with EDITOR role', async () => {
            const invite = await paineisServico.createInvite(
                testUser.id,
                testDashboard.id,
                { role: 'EDITOR' as DashboardRole }
            );

            expect(invite.role).toBe('EDITOR');
        });

        it('should create invite with expiration date', async () => {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const invite = await paineisServico.createInvite(
                testUser.id,
                testDashboard.id,
                { role: 'VIEWER', expiresAt }
            );

            expect(invite.expiresAt).toBeDefined();
            expect(new Date(invite.expiresAt!).getTime()).toBeGreaterThan(Date.now());
        });

        it('should create one-time invite', async () => {
            const invite = await paineisServico.createInvite(
                testUser.id,
                testDashboard.id,
                { role: 'VIEWER', isOneTime: true }
            );

            expect(invite.isOneTime).toBe(true);
        });

        it('should reject invite creation from non-owner/non-editor', async () => {
            await expect(
                paineisServico.createInvite(
                    testUser2.id,
                    testDashboard.id,
                    { role: 'VIEWER' }
                )
            ).rejects.toThrow();
        });
    });

    describe('getSharedPreview', () => {
        let testInvite: any;

        beforeEach(async () => {
            testInvite = await paineisServico.createInvite(
                testUser.id,
                testDashboard.id,
                { role: 'VIEWER' }
            );
        });

        it('should return preview data with correct structure', async () => {
            const preview = await paineisServico.getSharedPreview(testInvite.code);

            expect(preview).toBeDefined();
            expect(preview.dashboard).toBeDefined();
            expect(preview.dashboard.title).toBe('Test Dashboard for Invites');
            expect(preview.inviter).toBeDefined();
            expect(preview.inviter.name).toBe('Test User Invites');
            expect(preview.role).toBe('VIEWER');
        });

        it('should return correct dashboard title and description', async () => {
            const preview = await paineisServico.getSharedPreview(testInvite.code);

            expect(preview.dashboard.title).toBe(testDashboard.title);
            expect(preview.dashboard.description).toBe(testDashboard.description);
        });

        it('should return inviter information', async () => {
            const preview = await paineisServico.getSharedPreview(testInvite.code);

            expect(preview.inviter.name).toBe(testUser.name);
        });

        it('should throw error for invalid code', async () => {
            await expect(
                paineisServico.getSharedPreview('INVALID_CODE_XYZ')
            ).rejects.toThrow();
        });

        it('should return expiration date when set', async () => {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const inviteWithExpiry = await paineisServico.createInvite(
                testUser.id,
                testDashboard.id,
                { role: 'EDITOR', expiresAt }
            );

            const preview = await paineisServico.getSharedPreview(inviteWithExpiry.code);

            expect(preview.expiresAt).toBeDefined();
            expect(preview.role).toBe('EDITOR');
        });
    });

    describe('acceptInvite', () => {
        it('should add user as member with correct role', async () => {
            const invite = await paineisServico.createInvite(
                testUser.id,
                testDashboard.id,
                { role: 'VIEWER' }
            );

            const result = await paineisServico.acceptInvite(testUser2.id, invite.code);

            expect(result).toBeDefined();
            expect(result.id).toBe(testDashboard.id);

            // Check member was added
            const member = await prisma.dashboardMember.findUnique({
                where: {
                    dashboardId_userId: {
                        dashboardId: testDashboard.id,
                        userId: testUser2.id
                    }
                }
            });

            expect(member).toBeDefined();
            expect(member?.role).toBe('VIEWER');
        });

        it('should throw error for invalid invite code', async () => {
            await expect(
                paineisServico.acceptInvite(testUser2.id, 'BADCODE')
            ).rejects.toThrow();
        });

        it('should throw error for expired invite', async () => {
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

            const invite = await prisma.dashboardInvite.create({
                data: {
                    dashboardId: testDashboard.id,
                    code: `EXP${Date.now()}`.substring(0, 8).toUpperCase(),
                    role: 'VIEWER',
                    expiresAt: expiredDate,
                    createdById: testUser.id
                }
            });

            await expect(
                paineisServico.acceptInvite(testUser2.id, invite.code)
            ).rejects.toThrow();
        });
    });

    describe('Code Generation', () => {
        it('should generate codes with only uppercase alphanumeric characters', async () => {
            const codes: string[] = [];

            for (let i = 0; i < 10; i++) {
                const invite = await paineisServico.createInvite(
                    testUser.id,
                    testDashboard.id,
                    { role: 'VIEWER' }
                );
                codes.push(invite.code);
            }

            codes.forEach(code => {
                expect(code).toMatch(/^[A-Z0-9]+$/);
                expect(code.length).toBe(8);
            });
        });

        it('should generate mostly unique codes', async () => {
            const codes = new Set<string>();

            for (let i = 0; i < 20; i++) {
                const invite = await paineisServico.createInvite(
                    testUser.id,
                    testDashboard.id,
                    { role: 'VIEWER' }
                );
                codes.add(invite.code);
            }

            // All codes should be unique
            expect(codes.size).toBe(20);
        });
    });
});

describe('Dashboard Member Update Service', () => {
    let testUser: any;
    let testUser2: any;
    let testDashboard: any;

    beforeAll(async () => {
        testUser = await prisma.user.create({
            data: {
                email: `test-member-${Date.now()}@test.com`,
                name: 'Test User Member',
                password: 'hashedpassword123',
            }
        });

        testUser2 = await prisma.user.create({
            data: {
                email: `test-member2-${Date.now()}@test.com`,
                name: 'Test User 2 Member',
                password: 'hashedpassword123',
            }
        });

        testDashboard = await prisma.dashboard.create({
            data: {
                title: 'Test Dashboard for Members',
                ownerId: testUser.id,
                members: {
                    create: [
                        { userId: testUser.id, role: 'OWNER' },
                        { userId: testUser2.id, role: 'VIEWER' }
                    ]
                }
            }
        });
    });

    afterAll(async () => {
        await prisma.dashboardMember.deleteMany({
            where: { dashboardId: testDashboard.id }
        });
        await prisma.dashboard.delete({
            where: { id: testDashboard.id }
        });
        await prisma.user.delete({ where: { id: testUser.id } });
        await prisma.user.delete({ where: { id: testUser2.id } });
        await prisma.$disconnect();
    });

    describe('updateMemberRole', () => {
        it('should update member role from VIEWER to EDITOR', async () => {
            const updatedMember = await paineisServico.updateMemberRole(
                testUser.id,
                testDashboard.id,
                testUser2.id,
                'EDITOR'
            );

            expect(updatedMember.role).toBe('EDITOR');
        });

        it('should update member role from EDITOR to VIEWER', async () => {
            // First set to EDITOR
            await paineisServico.updateMemberRole(
                testUser.id,
                testDashboard.id,
                testUser2.id,
                'EDITOR'
            );

            // Then change back to VIEWER
            const updatedMember = await paineisServico.updateMemberRole(
                testUser.id,
                testDashboard.id,
                testUser2.id,
                'VIEWER'
            );

            expect(updatedMember.role).toBe('VIEWER');
        });

        it('should reject changing role to OWNER', async () => {
            await expect(
                paineisServico.updateMemberRole(
                    testUser.id,
                    testDashboard.id,
                    testUser2.id,
                    'OWNER'
                )
            ).rejects.toThrow();
        });

        it('should reject role change from non-owner', async () => {
            await expect(
                paineisServico.updateMemberRole(
                    testUser2.id,
                    testDashboard.id,
                    testUser2.id,
                    'EDITOR'
                )
            ).rejects.toThrow();
        });

        it('should include user info in the response', async () => {
            const updatedMember = await paineisServico.updateMemberRole(
                testUser.id,
                testDashboard.id,
                testUser2.id,
                'VIEWER'
            );

            expect(updatedMember.user).toBeDefined();
            expect(updatedMember.user.id).toBe(testUser2.id);
            expect(updatedMember.user.email).toBe(testUser2.email);
        });
    });
});
