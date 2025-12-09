import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDashboardData() {
    try {
        console.log('🧹 Limpando dados do dashboard...\n');

        // Buscar o único dashboard
        const dashboard = await prisma.dashboard.findFirst();

        if (!dashboard) {
            console.log('❌ Nenhum dashboard encontrado.');
            return;
        }

        console.log(`📊 Dashboard encontrado: "${dashboard.name}" (${dashboard.id})`);

        // Deletar transações
        try {
            const deletedTransactions = await prisma.transaction.deleteMany({
                where: { dashboardId: dashboard.id }
            });
            console.log(`✅ ${deletedTransactions.count} transações deletadas`);
        } catch (e) {
            console.log('⚠️ Erro ao deletar transações (pode não existir)');
        }

        // Deletar contas
        try {
            const deletedAccounts = await prisma.account.deleteMany({
                where: { dashboardId: dashboard.id }
            });
            console.log(`✅ ${deletedAccounts.count} contas deletadas`);
        } catch (e) {
            console.log('⚠️ Erro ao deletar contas (pode não existir)');
        }

        // Deletar categorias
        try {
            const deletedCategories = await prisma.category.deleteMany({
                where: { dashboardId: dashboard.id }
            });
            console.log(`✅ ${deletedCategories.count} categorias deletadas`);
        } catch (e) {
            console.log('⚠️ Erro ao deletar categorias (pode não existir)');
        }

        // Deletar orçamentos
        try {
            const deletedBudgets = await prisma.budget.deleteMany({
                where: { dashboardId: dashboard.id }
            });
            console.log(`✅ ${deletedBudgets.count} orçamentos deletados`);
        } catch (e) {
            console.log('⚠️ Erro ao deletar orçamentos (pode não existir)');
        }

        // Deletar metas
        try {
            const deletedGoals = await prisma.goal.deleteMany({
                where: { dashboardId: dashboard.id }
            });
            console.log(`✅ ${deletedGoals.count} metas deletadas`);
        } catch (e) {
            console.log('⚠️ Erro ao deletar metas (pode não existir)');
        }

        // Deletar recorrências
        try {
            const deletedRecurring = await prisma.recurringTransaction.deleteMany({
                where: { dashboardId: dashboard.id }
            });
            console.log(`✅ ${deletedRecurring.count} recorrências deletadas`);
        } catch (e) {
            console.log('⚠️ Erro ao deletar recorrências (pode não existir)');
        }

        // Deletar alertas
        try {
            const deletedAlerts = await prisma.alert.deleteMany({
                where: { dashboardId: dashboard.id }
            });
            console.log(`✅ ${deletedAlerts.count} alertas deletados`);
        } catch (e) {
            console.log('⚠️ Erro ao deletar alertas (pode não existir)');
        }

        console.log('\n🎉 Limpeza concluída! Dashboard pronto para novos testes.');
        console.log('ℹ️  Membros do dashboard foram mantidos.');

    } catch (error) {
        console.error('Erro ao limpar dados:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDashboardData();
