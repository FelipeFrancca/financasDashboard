import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeDecember() {
    try {
        console.log('📊 ANÁLISE DETALHADA - DEZEMBRO 2025\n');
        console.log('='.repeat(70));

        const dashboard = await prisma.dashboard.findFirst();
        if (!dashboard) {
            console.log('❌ Nenhum dashboard encontrado.');
            return;
        }

        // Transações de dezembro 2025
        const decStart = new Date('2025-12-01');
        const decEnd = new Date('2025-12-31T23:59:59');

        const decTransactions = await prisma.transaction.findMany({
            where: {
                dashboardId: dashboard.id,
                date: { gte: decStart, lte: decEnd }
            },
            orderBy: { date: 'asc' }
        });

        console.log(`\n📅 Transações em DEZEMBRO 2025: ${decTransactions.length}`);
        console.log('-'.repeat(70));

        let totalDez = 0;
        for (const t of decTransactions) {
            const valor = t.amount;
            totalDez += valor;
            const data = new Date(t.date).toLocaleDateString('pt-BR');
            const parcela = t.installmentTotal > 1 ? `(${t.installmentNumber}/${t.installmentTotal})` : '';
            const desc = (t.description || '').substring(0, 45).padEnd(45);
            console.log(`R$ ${valor.toFixed(2).padStart(8)} | ${data} | ${desc} ${parcela}`);
        }

        console.log('-'.repeat(70));
        console.log(`TOTAL DEZEMBRO 2025: R$ ${totalDez.toFixed(2)}`);
        console.log(`Valor esperado da fatura: R$ 4.108,88`);
        console.log(`Diferença: R$ ${(4108.88 - totalDez).toFixed(2)}`);

        // Verificar todas as transações e suas datas
        console.log('\n\n📋 TODAS AS TRANSAÇÕES COM VENCIMENTO:');
        console.log('='.repeat(70));

        const allTx = await prisma.transaction.findMany({
            where: { dashboardId: dashboard.id },
            orderBy: { date: 'asc' }
        });

        // Agrupar por mês de vencimento
        const byDueMonth: Record<string, number> = {};
        for (const t of allTx) {
            const dueDate = t.dueDate || t.date;
            const date = new Date(dueDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            byDueMonth[key] = (byDueMonth[key] || 0) + t.amount;
        }

        console.log('\n📅 TOTAL POR MÊS DE VENCIMENTO (dueDate):');
        for (const [month, total] of Object.entries(byDueMonth).sort()) {
            console.log(`${month}: R$ ${total.toFixed(2)}`);
        }

        // Verificar parcelas específicas de dezembro
        const dezParcelas = decTransactions.filter(t => t.installmentTotal > 1);
        console.log(`\n📦 PARCELAS EM DEZEMBRO: ${dezParcelas.length}`);

        // Ver um exemplo de cálculo de data
        console.log('\n🔍 EXEMPLO DE ANÁLISE DE PARCELA:');
        const exemplo = dezParcelas[0];
        if (exemplo) {
            console.log(`  Descrição: ${exemplo.description}`);
            console.log(`  Parcela: ${exemplo.installmentNumber}/${exemplo.installmentTotal}`);
            console.log(`  Data: ${new Date(exemplo.date).toLocaleDateString('pt-BR')}`);
            console.log(`  DueDate: ${exemplo.dueDate ? new Date(exemplo.dueDate).toLocaleDateString('pt-BR') : 'N/A'}`);
        }

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeDecember();
