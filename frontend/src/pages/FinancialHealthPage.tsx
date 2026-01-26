import { useMemo } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    LinearProgress,
    Alert,
    AlertTitle,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    useTheme,
    alpha,
    Skeleton,
    Avatar,
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    AccountBalanceWallet,
    CreditCard,
    Lightbulb,
    Warning,
    CheckCircle,
    Error as ErrorIcon,
    CalendarMonth,
    Payments,
    Savings,
    TipsAndUpdates,
    HealthAndSafety,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useTransactions } from '../hooks/api/useTransactions';
import { useAccounts } from '../hooks/api/useAccounts';
import BudgetAllocationManager from '../components/BudgetAllocationManager';
import type { Transaction, Account } from '../types';

interface FinancialTip {
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    icon: React.ReactNode;
}

export default function FinancialHealthPage() {
    const theme = useTheme();
    const { dashboardId } = useParams<{ dashboardId: string }>();

    // Get current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const filters = {
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
    };

    const { data: transactions = [], isLoading: loadingTransactions } = useTransactions(filters, dashboardId);
    const { data: accounts = [], isLoading: loadingAccounts } = useAccounts(dashboardId || '');

    // Calculate financial health metrics
    const metrics = useMemo(() => {
        const totalReceitas = transactions
            .filter((t: Transaction) => t.entryType === 'Receita')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        const totalDespesas = transactions
            .filter((t: Transaction) => t.entryType === 'Despesa')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        const saldo = totalReceitas - totalDespesas;
        const percentualComprometido = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0;

        // Calculate credit card debts by due date in current month
        const creditCards = accounts.filter((a: Account) => a.type === 'CREDIT_CARD' && a.status === 'ACTIVE');

        const cardDebts = creditCards.map((card: Account) => {
            const cardTransactions = transactions.filter(
                (t: Transaction) => t.accountId === card.id && t.entryType === 'Despesa'
            );
            const total = cardTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0);

            return {
                card,
                total,
                dueDay: card.dueDay || 10,
                transactionCount: cardTransactions.length,
            };
        }).filter((d: { total: number }) => d.total > 0);

        const totalCardDebt = cardDebts.reduce((sum: number, d: { total: number }) => sum + d.total, 0);

        return {
            totalReceitas,
            totalDespesas,
            saldo,
            percentualComprometido,
            cardDebts,
            totalCardDebt,
            creditCards,
        };
    }, [transactions, accounts]);

    // Generate financial tips based on situation
    const tips = useMemo((): FinancialTip[] => {
        const result: FinancialTip[] = [];

        // Tip based on income vs expenses ratio
        if (metrics.percentualComprometido > 100) {
            result.push({
                type: 'error',
                title: 'Atenção: Gastos excedem receitas!',
                message: `Suas despesas estão ${(metrics.percentualComprometido - 100).toFixed(0)}% acima da sua receita. Revise gastos não essenciais urgentemente.`,
                icon: <ErrorIcon />,
            });
        } else if (metrics.percentualComprometido > 80) {
            result.push({
                type: 'warning',
                title: 'Alerta de comprometimento',
                message: `Você está usando ${metrics.percentualComprometido.toFixed(0)}% da sua renda. Considere reduzir despesas variáveis.`,
                icon: <Warning />,
            });
        } else if (metrics.percentualComprometido > 50) {
            result.push({
                type: 'info',
                title: 'Margem de segurança razoável',
                message: `Você compromete ${metrics.percentualComprometido.toFixed(0)}% da renda. Tente destinar parte da sobra para investimentos.`,
                icon: <TipsAndUpdates />,
            });
        } else if (metrics.totalReceitas > 0) {
            result.push({
                type: 'success',
                title: 'Excelente controle financeiro!',
                message: `Você usa apenas ${metrics.percentualComprometido.toFixed(0)}% da renda. Continue assim e invista a diferença!`,
                icon: <CheckCircle />,
            });
        }

        // Tip based on card debts
        if (metrics.totalCardDebt > metrics.totalReceitas * 0.3) {
            result.push({
                type: 'warning',
                title: 'Dívidas de cartão elevadas',
                message: 'Suas faturas de cartão representam mais de 30% da renda. Evite parcelamentos longos.',
                icon: <CreditCard />,
            });
        }

        // Savings tip
        if (metrics.saldo > 0) {
            const savingsTarget = metrics.saldo * 0.2;
            result.push({
                type: 'info',
                title: 'Dica de poupança',
                message: `Com seu saldo positivo, você poderia poupar R$ ${savingsTarget.toFixed(2)} (20%) para reserva de emergência.`,
                icon: <Savings />,
            });
        }

        // Emergency fund tip
        if (metrics.totalReceitas > 0 && metrics.saldo < metrics.totalDespesas * 0.1) {
            result.push({
                type: 'warning',
                title: 'Construa uma reserva',
                message: 'Sua margem de segurança é baixa. Priorize criar uma reserva de emergência de 3 a 6 meses de gastos.',
                icon: <Warning />,
            });
        }

        return result;
    }, [metrics]);

    // Calculate health score (0-100)
    const healthScore = useMemo(() => {
        let score = 50; // Base score

        // Income vs Expense ratio
        if (metrics.percentualComprometido <= 50) score += 30;
        else if (metrics.percentualComprometido <= 70) score += 20;
        else if (metrics.percentualComprometido <= 90) score += 10;
        else if (metrics.percentualComprometido <= 100) score += 0;
        else score -= 20; // Deficit

        // Positive balance bonus
        if (metrics.saldo > 0) score += 10;
        if (metrics.saldo > metrics.totalReceitas * 0.2) score += 10;

        return Math.max(0, Math.min(100, score));
    }, [metrics]);

    const getHealthColor = (score: number) => {
        if (score >= 70) return theme.palette.success.main;
        if (score >= 40) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    const getHealthLabel = (score: number) => {
        if (score >= 80) return 'Excelente';
        if (score >= 60) return 'Boa';
        if (score >= 40) return 'Regular';
        if (score >= 20) return 'Preocupante';
        return 'Crítica';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const isLoading = loadingTransactions || loadingAccounts;

    if (isLoading) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Skeleton variant="text" width={300} height={50} sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={12} md={6} lg={3} key={i}>
                            <Skeleton variant="rounded" height={150} />
                        </Grid>
                    ))}
                </Grid>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Avatar
                        sx={{
                            bgcolor: alpha(getHealthColor(healthScore), 0.15),
                            color: getHealthColor(healthScore),
                            width: 56,
                            height: 56,
                        }}
                    >
                        <HealthAndSafety sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            Saúde Financeira
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Health Score Card */}
            <Card
                sx={{
                    mb: 4,
                    background: `linear-gradient(135deg, ${alpha(getHealthColor(healthScore), 0.1)} 0%, ${alpha(getHealthColor(healthScore), 0.05)} 100%)`,
                    border: `1px solid ${alpha(getHealthColor(healthScore), 0.3)}`,
                }}
            >
                <CardContent sx={{ py: 4 }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 140,
                                            height: 140,
                                            borderRadius: '50%',
                                            background: `conic-gradient(${getHealthColor(healthScore)} ${healthScore * 3.6}deg, ${alpha(theme.palette.divider, 0.3)} 0deg)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 110,
                                                height: 110,
                                                borderRadius: '50%',
                                                bgcolor: 'background.paper',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Typography variant="h3" fontWeight={700} color={getHealthColor(healthScore)}>
                                                {healthScore}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                de 100
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Typography variant="h6" fontWeight={600} sx={{ mt: 2 }}>
                                    Saúde {getHealthLabel(healthScore)}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                <Grid item xs={6} sm={3}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <TrendingUp sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Receitas
                                        </Typography>
                                        <Typography variant="h6" fontWeight={600} color="success.main">
                                            {formatCurrency(metrics.totalReceitas)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <TrendingDown sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Despesas
                                        </Typography>
                                        <Typography variant="h6" fontWeight={600} color="error.main">
                                            {formatCurrency(metrics.totalDespesas)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <AccountBalanceWallet sx={{ fontSize: 32, color: metrics.saldo >= 0 ? 'success.main' : 'error.main', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Saldo
                                        </Typography>
                                        <Typography variant="h6" fontWeight={600} color={metrics.saldo >= 0 ? 'success.main' : 'error.main'}>
                                            {formatCurrency(metrics.saldo)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <Payments sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Comprometido
                                        </Typography>
                                        <Typography variant="h6" fontWeight={600} color="warning.main">
                                            {metrics.percentualComprometido.toFixed(0)}%
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Grid container spacing={3}>
                {/* Credit Card Debts */}
                <Grid item xs={12} lg={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <CreditCard color="primary" />
                                <Typography variant="h6" fontWeight={600}>
                                    Faturas a Pagar
                                </Typography>
                            </Box>

                            {metrics.cardDebts.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                                    <Typography variant="body1" color="text.secondary">
                                        Nenhuma fatura de cartão pendente este mês
                                    </Typography>
                                </Box>
                            ) : (
                                <List disablePadding>
                                    {metrics.cardDebts.map((debt: any, index: number) => (
                                        <Box key={debt.card.id}>
                                            {index > 0 && <Divider sx={{ my: 1 }} />}
                                            <ListItem
                                                sx={{
                                                    px: 2,
                                                    py: 1.5,
                                                    borderRadius: 2,
                                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                                                }}
                                            >
                                                <ListItemIcon>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                            color: 'primary.main',
                                                        }}
                                                    >
                                                        <CreditCard />
                                                    </Avatar>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography fontWeight={600}>
                                                                {debt.card.name}
                                                            </Typography>
                                                            {debt.card.cardLastDigits && (
                                                                <Chip
                                                                    label={`*${debt.card.cardLastDigits}`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                            <CalendarMonth fontSize="small" color="action" />
                                                            <Typography variant="caption" color="text.secondary">
                                                                Vence dia {debt.dueDay}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                • {debt.transactionCount} transações
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                                <Typography variant="h6" fontWeight={700} color="error.main">
                                                    {formatCurrency(debt.total)}
                                                </Typography>
                                            </ListItem>
                                        </Box>
                                    ))}
                                </List>
                            )}

                            {metrics.totalCardDebt > 0 && (
                                <Box
                                    sx={{
                                        mt: 2,
                                        pt: 2,
                                        borderTop: `1px solid ${theme.palette.divider}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Total de Faturas
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="error.main">
                                        {formatCurrency(metrics.totalCardDebt)}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Financial Tips */}
                <Grid item xs={12} lg={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <Lightbulb color="warning" />
                                <Typography variant="h6" fontWeight={600}>
                                    Dicas Financeiras
                                </Typography>
                            </Box>

                            {tips.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        Adicione receitas e despesas para receber dicas personalizadas
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {tips.map((tip, index) => (
                                        <Alert
                                            key={index}
                                            severity={tip.type}
                                            icon={tip.icon}
                                            sx={{
                                                '& .MuiAlert-message': { width: '100%' },
                                            }}
                                        >
                                            <AlertTitle sx={{ fontWeight: 600 }}>{tip.title}</AlertTitle>
                                            {tip.message}
                                        </Alert>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Income vs Expenses Progress */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Comprometimento da Renda
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatCurrency(metrics.totalDespesas)} de {formatCurrency(metrics.totalReceitas)}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        color={
                                            metrics.percentualComprometido > 90
                                                ? 'error.main'
                                                : metrics.percentualComprometido > 70
                                                    ? 'warning.main'
                                                    : 'success.main'
                                        }
                                    >
                                        {metrics.percentualComprometido.toFixed(1)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(metrics.percentualComprometido, 100)}
                                    sx={{
                                        height: 12,
                                        borderRadius: 6,
                                        bgcolor: alpha(theme.palette.divider, 0.3),
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 6,
                                            bgcolor:
                                                metrics.percentualComprometido > 90
                                                    ? 'error.main'
                                                    : metrics.percentualComprometido > 70
                                                        ? 'warning.main'
                                                        : 'success.main',
                                        },
                                    }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Chip label="0%" size="small" variant="outlined" />
                                    <Chip label="50%" size="small" variant="outlined" />
                                    <Chip label="70%" size="small" variant="outlined" color="warning" />
                                    <Chip label="90%" size="small" variant="outlined" color="error" />
                                    <Chip label="100%" size="small" variant="outlined" color="error" />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Budget Allocation Manager */}
                {dashboardId && (
                    <Grid item xs={12}>
                        <BudgetAllocationManager
                            dashboardId={dashboardId}
                            totalIncome={metrics.totalReceitas}
                        />
                    </Grid>
                )}
            </Grid>
        </Container>
    );
}
