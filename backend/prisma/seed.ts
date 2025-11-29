import { PrismaClient, AccountType, BudgetPeriod, RecurrenceFrequency, AlertType, AlertSeverity } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting full seed...');

    // 1. User
    const email = 'demo@example.com';
    const passwordHash = await bcrypt.hash('password123', 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Usuário Demo',
            password: passwordHash,
            emailVerified: true,
            avatar: 'https://ui-avatars.com/api/?name=Usuario+Demo&background=0D8ABC&color=fff',
        },
    });
    console.log(`User: ${user.id}`);

    // 2. Categories (nomes em português, type em inglês)
    const categoriesData = [
        { name: 'Salário', type: 'INCOME', icon: '💰', color: '#10B981' },
        { name: 'Freelance', type: 'INCOME', icon: '💻', color: '#3B82F6' },
        { name: 'Investimentos', type: 'INCOME', icon: '📈', color: '#8B5CF6' },
        { name: 'Alimentação', type: 'EXPENSE', icon: '🍔', color: '#EF4444' },
        { name: 'Transporte', type: 'EXPENSE', icon: '🚗', color: '#F59E0B' },
        { name: 'Moradia', type: 'EXPENSE', icon: '🏠', color: '#6366F1' },
        { name: 'Lazer', type: 'EXPENSE', icon: '🎮', color: '#EC4899' },
        { name: 'Saúde', type: 'EXPENSE', icon: '🏥', color: '#14B8A6' },
    ];

    for (const cat of categoriesData) {
        await prisma.category.upsert({
            where: {
                name_userId_type: {
                    name: cat.name,
                    userId: user.id,
                    type: cat.type,
                },
            },
            update: {},
            create: {
                ...cat,
                userId: user.id,
                isSystem: false,
            },
        });
    }
    console.log('Categories created');

    // 3. Accounts
    const accountsData = [
        {
            name: 'Conta Principal',
            type: AccountType.CHECKING,
            institution: 'Nubank',
            initialBalance: 5000,
            currentBalance: 5000,
            color: '#820AD1',
            isPrimary: true,
        },
        {
            name: 'Reserva de Emergência',
            type: AccountType.SAVINGS,
            institution: 'Inter',
            initialBalance: 15000,
            currentBalance: 15000,
            color: '#FF7A00',
        },
        {
            name: 'Cartão Black',
            type: AccountType.CREDIT_CARD,
            institution: 'XP',
            initialBalance: 0,
            currentBalance: -1250.50,
            availableBalance: 18749.50,
            creditLimit: 20000,
            color: '#000000',
        },
    ];

    const accounts = [];
    for (const acc of accountsData) {
        const existing = await prisma.account.findFirst({
            where: { userId: user.id, name: acc.name },
        });

        if (!existing) {
            const created = await prisma.account.create({
                data: { ...acc, userId: user.id },
            });
            accounts.push(created);
        } else {
            accounts.push(existing);
        }
    }
    console.log(`Accounts created: ${accounts.length}`);

    // 4. Transactions
    const today = new Date();
    const transactions = [];

    const getCategory = async (type: string) => {
        const cats = await prisma.category.findMany({ where: { userId: user.id, type } });
        return cats[Math.floor(Math.random() * cats.length)];
    };

    console.log('Generating transactions...');
    for (let i = 0; i < 50; i++) {
        const isExpense = Math.random() > 0.3;
        const type = isExpense ? 'EXPENSE' : 'INCOME';
        const category = await getCategory(type);

        if (!category) continue;

        const account = accounts[Math.floor(Math.random() * accounts.length)];

        const daysAgo = Math.floor(Math.random() * 90);
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);

        const amount = isExpense
            ? Math.floor(Math.random() * 500) + 10
            : Math.floor(Math.random() * 5000) + 1000;

        transactions.push({
            date,
            entryType: isExpense ? 'Despesa' : 'Receita',
            flowType: isExpense ? 'Variável' : 'Fixa',
            category: category.name,
            description: `${category.name} ${i + 1}`,
            amount,
            accountId: account.id,
            userId: user.id,
            installmentStatus: 'N/A',
        });
    }

    if (transactions.length > 0) {
        await prisma.transaction.createMany({
            data: transactions,
        });
        console.log(`Transactions created: ${transactions.length}`);
    }

    // 5. Budgets
    await prisma.budget.create({
        data: {
            name: 'Orçamento Mensal Alimentação',
            amount: 1500,
            period: BudgetPeriod.MONTHLY,
            category: 'Alimentação',
            startDate: new Date(today.getFullYear(), today.getMonth(), 1),
            userId: user.id,
            alertAt: 80,
        },
    });
    console.log('Budgets created');

    // 6. Goals
    await prisma.financialGoal.create({
        data: {
            name: 'Viagem de Férias',
            targetAmount: 10000,
            currentAmount: 2500,
            deadline: new Date(today.getFullYear() + 1, 0, 1),
            userId: user.id,
            category: 'Lazer',
        },
    });
    console.log('Goals created');

    // 7. Recurring Transactions
    await prisma.recurringTransaction.create({
        data: {
            description: 'Aluguel',
            amount: 2500,
            category: 'Moradia',
            entryType: 'Despesa',
            flowType: 'Fixa',
            frequency: RecurrenceFrequency.MONTHLY,
            startDate: new Date(),
            nextDate: new Date(today.getFullYear(), today.getMonth() + 1, 5),
            userId: user.id,
        },
    });
    console.log('Recurring Transactions created');

    // 8. Alerts
    await prisma.alert.create({
        data: {
            type: AlertType.BUDGET_LIMIT,
            severity: AlertSeverity.WARNING,
            title: 'Alerta de Orçamento',
            message: 'Você atingiu 80% do seu orçamento de Alimentação.',
            userId: user.id,
        },
    });
    console.log('Alerts created');

    // 9. Dashboard
    await prisma.dashboard.create({
        data: {
            title: 'Visão Geral',
            description: 'Meu dashboard principal',
            ownerId: user.id,
        },
    });
    console.log('Dashboard created');

    console.log('✅ Seed finished successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
