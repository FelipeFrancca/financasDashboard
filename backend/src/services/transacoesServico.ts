import { prisma } from '../database/conexao';
import type { Transaction, Prisma } from "@prisma/client";

export type TransactionFilters = {
  startDate?: string;
  endDate?: string;
  entryType?: string;
  flowType?: string;
  category?: string;
  institution?: string;
  installmentStatus?: string;
  search?: string;
  minAmount?: string;
  ownership?: 'all' | 'client' | 'thirdParty';
};

export type TransactionCreateInput = Omit<Transaction, "id" | "createdAt" | "updatedAt">;
export type TransactionUpdateInput = Partial<TransactionCreateInput>;

export async function getAllTransactions(filters: TransactionFilters = {}, dashboardId: string, userId: string): Promise<Transaction[]> {
  const { checkPermission } = await import('./paineisServico');
  await checkPermission(userId, dashboardId);

  const where: any = { dashboardId, deletedAt: null };

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.date.lte = new Date(filters.endDate);
    }
  }
  if (filters.entryType) {
    where.entryType = filters.entryType;
  }
  if (filters.flowType) {
    where.flowType = filters.flowType;
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.institution) {
    where.institution = { contains: filters.institution, mode: "insensitive" };
  }
  if (filters.installmentStatus) {
    where.installmentStatus = filters.installmentStatus;
  }
  if (filters.minAmount) {
    where.amount = { gte: parseFloat(filters.minAmount) };
  }

  // Ownership filter
  if (filters.ownership === 'client') {
    where.isThirdParty = false;
  } else if (filters.ownership === 'thirdParty') {
    where.isThirdParty = true;
  }

  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: "insensitive" } },
      { category: { contains: filters.search, mode: "insensitive" } },
      { subcategory: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
      { thirdPartyName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: { items: true },
  });
}

export async function getTransactionById(id: string, dashboardId: string, userId: string): Promise<Transaction | null> {
  const { checkPermission } = await import('./paineisServico');
  await checkPermission(userId, dashboardId);

  return prisma.transaction.findFirst({
    where: { id, dashboardId, deletedAt: null },
    include: { items: true },
  });
}

export async function createTransaction(data: any, dashboardId: string, userId: string): Promise<Transaction> {
  const { checkPermission } = await import('./paineisServico');
  await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR']);

  // Extract items from data if present
  const { items, ...transactionData } = data;

  return prisma.transaction.create({
    data: {
      ...transactionData,
      date: new Date(transactionData.date),
      dashboardId,
      userId,
      // Create items if provided
      ...(items && items.length > 0 && {
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      }),
    },
    include: { items: true },
  });
}

export async function createManyTransactions(dataArray: any[], dashboardId: string, userId: string): Promise<Transaction[]> {
  const { checkPermission } = await import('./paineisServico');
  await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR']);

  const transactions = await Promise.all(
    dataArray.map((data) => {
      const { items, ...transactionData } = data;
      return prisma.transaction.create({
        data: {
          ...transactionData,
          date: new Date(transactionData.date),
          dashboardId,
          userId,
          // Create items if provided
          ...(items && items.length > 0 && {
            items: {
              create: items.map((item: any) => ({
                description: item.description,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            },
          }),
        },
        include: { items: true },
      });
    })
  );
  return transactions;
}

export async function updateTransaction(id: string, data: any, dashboardId: string, userId: string): Promise<Transaction | null> {
  const { checkPermission } = await import('./paineisServico');
  await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR']);

  try {
    // Extract items from data
    const { items, ...updateData } = data;

    if (data.date) {
      updateData.date = new Date(data.date);
    }

    // Update transaction and handle items in a transaction
    return await prisma.$transaction(async (tx) => {
      // Update the transaction itself
      await tx.transaction.updateMany({
        where: { id, dashboardId, deletedAt: null },
        data: updateData,
      });

      // If items are provided, replace all existing items
      if (items !== undefined) {
        // Delete existing items
        await tx.transactionItem.deleteMany({
          where: { transactionId: id },
        });

        // Create new items if any
        if (items && items.length > 0) {
          await tx.transactionItem.createMany({
            data: items.map((item: any) => ({
              transactionId: id,
              description: item.description,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          });
        }
      }

      return await tx.transaction.findFirst({
        where: { id, dashboardId },
        include: { items: true },
      });
    });
  } catch (error) {
    return null;
  }
}

export async function deleteTransaction(id: string, dashboardId: string, userId: string): Promise<void> {
  const { checkPermission } = await import('./paineisServico');
  await checkPermission(userId, dashboardId, ['OWNER', 'EDITOR']);

  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function getStatsSummary(filters: TransactionFilters = {}, dashboardId: string, userId: string) {
  const transactions = await getAllTransactions(filters, dashboardId, userId);

  const totalIncome = transactions
    .filter((t) => t.entryType === "Receita")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.entryType === "Despesa")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netResult = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    netResult,
    savingsRate: Math.round(savingsRate * 100) / 100,
    transactionCount: transactions.length,
  };
}

export { prisma };
