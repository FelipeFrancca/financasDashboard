import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Shield
} from '@mui/icons-material';
import type { StatsSummary, Transaction } from '../types';
import { MetricCardSkeleton } from './LoadingSkeleton';
import { hoverLift, createStaggerDelay } from '../utils/animations';

interface MetricsCardsProps {
  stats?: StatsSummary;
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function MetricsCards({ stats, isLoading = false }: MetricsCardsProps) {
  // Se estiver carregando ou não tiver stats, mostra skeleton
  if (isLoading || !stats) {
    return <MetricCardSkeleton count={4} />;
  }

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
          <Card
            sx={{
              height: '100%',
              bgcolor: metric.bg,
              borderLeft: 3,
              borderColor: metric.color,
              ...hoverLift,
              animation: `slideInUp 400ms cubic-bezier(0.4, 0, 0.2, 1) ${createStaggerDelay(index, 100)}ms both`,
              '@keyframes slideInUp': {
                from: {
                  opacity: 0,
                  transform: 'translateY(20px)'
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)'
                },
              },
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 2
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  textTransform="uppercase"
                  fontWeight={600}
                  sx={{ letterSpacing: 0.5 }}
                >
                  {metric.title}
                </Typography>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'rotate(360deg)',
                    },
                  }}
                >
                  <metric.icon sx={{ color: metric.color, fontSize: 24 }} />
                </Box>
              </Box>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  color: metric.color,
                  mb: 0.5,
                  fontSize: { xs: '1.75rem', sm: '2rem' },
                }}
              >
                {typeof metric.value === 'number' ? formatCurrency(metric.value) : metric.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Últimos 30 dias
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
