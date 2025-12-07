import { Dashboard, DashboardRole, DashboardMember } from '@prisma/client';
import { prisma } from '../database/conexao';
import { NotFoundError, ForbiddenError } from '../utils/AppError';

// Verificar permissão
export async function checkPermission(userId: string, dashboardId: string, requiredRole: DashboardRole[] = ['OWNER', 'EDITOR', 'VIEWER']) {
  const member = await prisma.dashboardMember.findUnique({
    where: {
      dashboardId_userId: { userId, dashboardId }
    }
  });

  if (!member) {
    // Verificar se é dono
    const dashboard = await prisma.dashboard.findUnique({ where: { id: dashboardId } });
    if (dashboard?.ownerId === userId) return 'OWNER';
    throw new ForbiddenError('Acesso negado ao dashboard');
  }

  if (!requiredRole.includes(member.role)) {
    throw new ForbiddenError('Permissão insuficiente');
  }

  return member.role;
}

export async function addMember(ownerId: string, dashboardId: string, email: string, role: DashboardRole) {
  // Verificar se quem adiciona é Owner
  await checkPermission(ownerId, dashboardId, ['OWNER']);

  const userToAdd = await prisma.user.findUnique({ where: { email } });
  if (!userToAdd) throw new NotFoundError('Usuário não encontrado');

  return prisma.dashboardMember.create({
    data: {
      userId: userToAdd.id,
      dashboardId,
      role,
    }
  });
}

export async function removeMember(requesterId: string, dashboardId: string, userIdToRemove: string) {
  await checkPermission(requesterId, dashboardId, ['OWNER']);

  return prisma.dashboardMember.delete({
    where: {
      dashboardId_userId: { userId: userIdToRemove, dashboardId }
    }
  });
}

export async function listMembers(userId: string, dashboardId: string) {
  await checkPermission(userId, dashboardId);

  return prisma.dashboardMember.findMany({
    where: { dashboardId },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
  });
}

// Listar todos os dashboards do usuário (próprios e como membro)
export async function listDashboards(userId: string) {
  // Buscar dashboards onde o usuário é dono
  const ownedDashboards = await prisma.dashboard.findMany({
    where: { ownerId: userId },
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Buscar dashboards onde o usuário é membro
  const memberDashboards = await prisma.dashboardMember.findMany({
    where: { userId },
    include: {
      dashboard: {
        include: {
          owner: { select: { id: true, name: true, email: true, avatar: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Combinar e formatar os resultados
  const owned = ownedDashboards.map(d => ({ ...d, role: 'OWNER' as DashboardRole, isOwner: true }));
  const member = memberDashboards.map(m => ({ ...m.dashboard, role: m.role, isOwner: false }));

  return [...owned, ...member];
}

// Criar novo dashboard
export async function createDashboard(userId: string, title: string, description?: string) {
  return prisma.dashboard.create({
    data: {
      title,
      description,
      ownerId: userId
    },
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      members: true
    }
  });
}

// Atualizar dashboard
export async function updateDashboard(userId: string, dashboardId: string, updates: { title?: string; description?: string }) {
  await checkPermission(userId, dashboardId, ['OWNER']);

  return prisma.dashboard.update({
    where: { id: dashboardId },
    data: updates,
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      members: true
    }
  });
}

// Deletar dashboard
export async function deleteDashboard(userId: string, dashboardId: string) {
  await checkPermission(userId, dashboardId, ['OWNER']);

  // Delete all related data in order
  await prisma.$transaction(async (tx) => {
    // Delete transactions
    await tx.transaction.deleteMany({ where: { dashboardId } });

    // Delete categories
    await tx.category.deleteMany({ where: { dashboardId } });

    // Delete accounts
    await tx.account.deleteMany({ where: { dashboardId } });

    // Delete goals
    await tx.goal.deleteMany({ where: { dashboardId } });

    // Delete budgets
    await tx.budget.deleteMany({ where: { dashboardId } });

    // Delete recurrences
    await tx.recurrence.deleteMany({ where: { dashboardId } });

    // Delete transfers
    await tx.transfer.deleteMany({ where: { dashboardId } });

    // Delete alerts
    await tx.alert.deleteMany({ where: { dashboardId } });

    // Delete invites
    await tx.dashboardInvite.deleteMany({ where: { dashboardId } });

    // Delete members
    await tx.dashboardMember.deleteMany({ where: { dashboardId } });

    // Finally delete the dashboard itself
    await tx.dashboard.delete({ where: { id: dashboardId } });
  });

  return { success: true };
}

// Criar convite
export async function createInvite(userId: string, dashboardId: string, opts: { role?: DashboardRole, expiresAt?: Date, isOneTime?: boolean }) {
  await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR']);

  const code = Math.random().toString(36).substring(2, 10).toUpperCase();

  return prisma.dashboardInvite.create({
    data: {
      dashboardId,
      code,
      role: opts.role || 'VIEWER',
      expiresAt: opts.expiresAt,
      isOneTime: opts.isOneTime || false,
      createdById: userId
    }
  });
}

// Aceitar convite
export async function acceptInvite(userId: string, code: string) {
  const invite = await prisma.dashboardInvite.findUnique({
    where: { code },
    include: { dashboard: true }
  });

  if (!invite) throw new NotFoundError('Convite não encontrado');
  if (invite.expiresAt && invite.expiresAt < new Date()) throw new ForbiddenError('Convite expirado');
  if (invite.isOneTime && invite.usedById) throw new ForbiddenError('Convite já utilizado');

  // Verificar se já é membro
  const existingMember = await prisma.dashboardMember.findUnique({
    where: {
      dashboardId_userId: {
        userId,
        dashboardId: invite.dashboardId
      }
    }
  });

  if (existingMember) throw new ForbiddenError('Você já é membro deste dashboard');

  // Adicionar membro
  await prisma.dashboardMember.create({
    data: {
      userId,
      dashboardId: invite.dashboardId,
      role: invite.role
    }
  });

  // Marcar como usado se for one-time
  if (invite.isOneTime) {
    await prisma.dashboardInvite.update({
      where: { id: invite.id },
      data: { usedById: userId }
    });
  }

  return invite.dashboard;
}

// Obter preview do convite
export async function getSharedPreview(code: string) {
  const invite = await prisma.dashboardInvite.findUnique({
    where: { code },
    include: {
      dashboard: {
        include: {
          owner: { select: { name: true, avatar: true } }
        }
      }
    }
  });

  if (!invite) throw new NotFoundError('Convite não encontrado');
  if (invite.expiresAt && invite.expiresAt < new Date()) throw new ForbiddenError('Convite expirado');
  if (invite.isOneTime && invite.usedById) throw new ForbiddenError('Convite já utilizado');

  return {
    dashboardTitle: invite.dashboard.title,
    dashboardDescription: invite.dashboard.description,
    ownerName: invite.dashboard.owner.name,
    role: invite.role
  };
}
