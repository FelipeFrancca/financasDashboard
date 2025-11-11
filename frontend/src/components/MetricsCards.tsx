import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Shield,
} from '@mui/icons-material';
import type { StatsSummary, Transaction } from '../types';

interface MetricsCardsProps {
  stats?: StatsSummary;
  transactions: Transaction[];
}

export default function MetricsCards({ stats }: MetricsCardsProps) {
  if (!stats) return null;

  const metrics = [
    {
      title: 'Receitas Totais',
      value: stats.totalIncome,
      icon: TrendingUp,
      color: 'income.main',
      bg: 'rgba(52, 211, 153, 0.12)',
    },
    {
      title: 'Despesas Totais',
      value: stats.totalExpense,
      icon: TrendingDown,
      color: 'expense.main',
      bg: 'rgba(248, 113, 113, 0.12)',
    },
    {
      title: 'Resultado Líquido',
      value: stats.netResult,
      icon: AccountBalance,
      color: stats.netResult >= 0 ? 'net.main' : 'expense.main',
      bg: stats.netResult >= 0 ? 'rgba(96, 165, 250, 0.12)' : 'rgba(248, 113, 113, 0.12)',
    },
    {
      title: 'Margem Saudável',
      value: `${stats.savingsRate.toFixed(0)}%`,
      icon: Shield,
      color: stats.savingsRate >= 20 ? 'success.main' : 'warning.main',
      bg: stats.savingsRate >= 20 ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)',
    },
  ];

  const formatCurrency = (value: number | string) => {
    if (typeof value === 'string') return value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {metrics.map((metric, index) => (
        <Grid item xs={12} sm={6} lg={3} key={index}>
          <Card sx={{ height: '100%', bgcolor: metric.bg, borderLeft: 3, borderColor: metric.color }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>
                  {metric.title}
                </Typography>
                <metric.icon sx={{ color: metric.color, fontSize: 28 }} />
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: metric.color }}>
                {typeof metric.value === 'number' ? formatCurrency(metric.value) : metric.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Últimos 30 dias
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
