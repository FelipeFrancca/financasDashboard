import { PrismaClient } from "@prisma/client";
import type { Transaction, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

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
};

export type TransactionCreateInput = Omit<Transaction, "id" | "createdAt" | "updatedAt">;
export type TransactionUpdateInput = Partial<TransactionCreateInput>;

export async function getAllTransactions(filters: TransactionFilters = {}, userId?: string): Promise<Transaction[]> {
  const where: any = {};

  // Filter by user if provided
  if (userId) {
    where.userId = userId;
  }

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
  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: "insensitive" } },
      { category: { contains: filters.search, mode: "insensitive" } },
      { subcategory: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });
}

export async function getTransactionById(id: string, userId: string): Promise<Transaction | null> {
  return prisma.transaction.findFirst({
    where: { 
      id,
      userId,
    } as any,
  });
}

export async function createTransaction(data: any, userId: string): Promise<Transaction> {
  return prisma.transaction.create({
    data: {
      ...data,
      date: new Date(data.date),
      userId,
    },
  });
}

export async function createManyTransactions(dataArray: any[], userId: string): Promise<Transaction[]> {
  const transactions = await Promise.all(
    dataArray.map((data) =>
      prisma.transaction.create({
        data: {
          ...data,
          date: new Date(data.date),
          userId,
        },
      })
    )
  );
  return transactions;
}

export async function updateTransaction(id: string, data: any, userId: string): Promise<Transaction | null> {
  try {
    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    return await prisma.transaction.updateMany({
      where: { 
        id,
        userId,
      } as any,
      data: updateData,
    }).then(async () => {
      // Return the updated transaction
      return await prisma.transaction.findFirst({
        where: { id, userId } as any,
      });
    });
  } catch (error) {
    return null;
  }
}

export async function deleteTransaction(id: string, userId: string): Promise<void> {
  await prisma.transaction.deleteMany({
    where: { 
      id,
      userId,
    } as any,
  });
}

export async function getStatsSummary(filters: TransactionFilters = {}, userId?: string) {
  const transactions = await getAllTransactions(filters, userId);

  const totalIncome = transactions
    .filter((t) => t.entryType === "Receita")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.entryType === "Despesa")
    .reduce((sum, t) => sum + t.amount, 0);

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
