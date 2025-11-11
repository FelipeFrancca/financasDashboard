import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export type CreateDashboardInput = {
  title: string;
  description?: string;
};

export async function createDashboard(ownerId: string, data: CreateDashboardInput) {
  const dashboard = await (prisma as any).dashboard.create({
    data: {
      title: data.title,
      description: data.description || null,
      ownerId,
    },
  });
  // add owner as member with OWNER role
  await (prisma as any).dashboardMember.create({
    data: {
      dashboardId: dashboard.id,
      userId: ownerId,
      role: "OWNER",
    },
  });
  return dashboard;
}

export async function listUserDashboards(userId: string) {
  // Get all dashboards where user is a member
  const memberships = await (prisma as any).dashboardMember.findMany({ 
    where: { userId }, 
    include: { dashboard: true } 
  });
  
  // Map to include role and isOwner flag
  return memberships.map((m: any) => ({
    ...m.dashboard,
    role: m.role,
    isOwner: m.dashboard.ownerId === userId,
  }));
}

export async function getDashboardWithPermission(dashboardId: string, userId?: string) {
  const dashboard = await (prisma as any).dashboard.findUnique({ where: { id: dashboardId }, include: { owner: true } });
  if (!dashboard) return null;
  if (!userId) return { dashboard, role: null };
  const membership = await (prisma as any).dashboardMember.findFirst({ where: { dashboardId, userId } });
  return { dashboard, role: membership ? membership.role : null };
}

export async function createInvite(dashboardId: string, createdById: string, role: string = "VIEWER", expiresAt?: Date, isOneTime: boolean = false) {
  const code = crypto.randomBytes(6).toString("hex");
  const invite = await (prisma as any).dashboardInvite.create({
    data: {
      dashboardId,
      code,
      role,
      expiresAt: expiresAt || null,
      isOneTime,
      createdById,
    },
  });
  return invite;
}

export async function acceptInviteByCode(userId: string, code: string) {
  const invite = await (prisma as any).dashboardInvite.findUnique({ where: { code } });
  if (!invite) throw new Error("Código de convite inválido");
  if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) throw new Error("Convite expirado");
  // add member
  await (prisma as any).dashboardMember.upsert({
    where: { dashboardId_userId: { dashboardId: invite.dashboardId, userId } },
    update: { role: invite.role },
    create: { dashboardId: invite.dashboardId, userId, role: invite.role },
  });
  if (invite.isOneTime) {
    await (prisma as any).dashboardInvite.update({ where: { id: invite.id }, data: { usedById: userId } });
  }
  return { dashboardId: invite.dashboardId, role: invite.role };
}

export async function getInviteByCode(code: string) {
  return (prisma as any).dashboardInvite.findUnique({ where: { code } });
}

export { prisma };
