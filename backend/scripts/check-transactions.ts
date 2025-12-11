import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const dashboardId = 'cmixqce0f0003i0lto2de5lry';

    const expenses = await prisma.transaction.aggregate({
        where: { dashboardId, type: 'EXPENSE' },
        _count: true,
        _sum: { amount: true }
    });

    const income = await prisma.transaction.aggregate({
        where: { dashboardId, type: 'INCOME' },
        _count: true,
        _sum: { amount: true }
    });

    console.log('Dashboard:', dashboardId);
    console.log('DESPESAS:', expenses._count, 'transacoes =', expenses._sum.amount?.toFixed(2) || 0);
    console.log('RECEITAS:', income._count, 'transacoes =', income._sum.amount?.toFixed(2) || 0);

    const allTransactions = await prisma.transaction.findMany({
        where: { dashboardId },
        select: { description: true, amount: true, installmentCurrent: true, installmentTotal: true }
    });

    const withInstallments = allTransactions.filter(t => t.installmentTotal && t.installmentTotal > 1);
    console.log('Com parcelas:', withInstallments.length);
    console.log('Sem parcelas:', allTransactions.length - withInstallments.length);
}

main().finally(() => prisma.$disconnect());
