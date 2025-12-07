import { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  alpha,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import {
  ShoppingBasket,
  AttachMoney,
  TrendingUp,
  LocalOffer,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { useItemStats, ItemStats } from '../hooks/api/useItemStats';
import { hoverLift } from '../utils/animations';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function ItemAnalysisPage() {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const theme = useTheme();
  
  // Default to current month
  const [dateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  });

  const { data: items, isLoading } = useItemStats(dashboardId!, dateRange);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LoadingSkeleton />
      </Container>
    );
  }

  const totalSpent = items?.reduce((sum: number, item: ItemStats) => sum + item.totalAmount, 0) || 0;
  const totalItems = items?.reduce((sum: number, item: ItemStats) => sum + item.totalQuantity, 0) || 0;
  const topItem = items?.[0];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Análise de Itens"
        subtitle="Veja o que você mais consome e onde gasta seu dinheiro"
        action={
            <Box>
                {/* Date Filter Component could go here */}
            </Box>
        }
      />

      {(!items || items.length === 0) ? (
        <EmptyState
          title="Nenhum item encontrado"
          description="Não há itens registrados neste período. Tente ajustar os filtros ou adicionar transações com itens."
          icon={<ShoppingBasket sx={{ fontSize: 64, color: 'text.secondary' }} />}
        />
      ) : (
        <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12} md={4}>
                <Card sx={{ ...hoverLift, height: '100%' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), mr: 2 }}>
                                <AttachMoney color="primary" />
                            </Box>
                            <Typography variant="h6">Total Gasto</Typography>
                        </Box>
                        <Typography variant="h4" fontWeight={700}>{formatCurrency(totalSpent)}</Typography>
                        <Typography variant="body2" color="text.secondary">em {totalItems} itens</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card sx={{ ...hoverLift, height: '100%' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1), mr: 2 }}>
                                <LocalOffer color="secondary" />
                            </Box>
                            <Typography variant="h6">Item Mais Consumido</Typography>
                        </Box>
                        <Typography variant="h5" fontWeight={700} noWrap title={topItem?.name}>{topItem?.name || '-'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatCurrency(topItem?.totalAmount || 0)} ({topItem?.totalQuantity} un)
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
             <Grid item xs={12} md={4}>
                <Card sx={{ ...hoverLift, height: '100%' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), mr: 2 }}>
                                <TrendingUp color="success" />
                            </Box>
                            <Typography variant="h6">Preço Médio (Top 1)</Typography>
                        </Box>
                        <Typography variant="h4" fontWeight={700}>{formatCurrency(topItem?.averagePrice || 0)}</Typography>
                         <Typography variant="body2" color="text.secondary">
                            Min: {formatCurrency(topItem?.minPrice || 0)} | Max: {formatCurrency(topItem?.maxPrice || 0)}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            {/* Table */}
            <Grid item xs={12}>
                <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Item</TableCell>
                                <TableCell align="right">Qtd Total</TableCell>
                                <TableCell align="right">Valor Total</TableCell>
                                <TableCell align="right">Preço Médio</TableCell>
                                <TableCell align="center">Frequência</TableCell>
                                <TableCell>Participação</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.name} hover>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                                        {item.name}
                                    </TableCell>
                                    <TableCell align="right">{item.totalQuantity}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(item.totalAmount)}</TableCell>
                                    <TableCell align="right">{formatCurrency(item.averagePrice)}</TableCell>
                                    <TableCell align="center">{item.frequency}x</TableCell>
                                    <TableCell sx={{ width: 200 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ width: '100%', mr: 1 }}>
                                                <LinearProgress variant="determinate" value={(item.totalAmount / totalSpent) * 100} sx={{ height: 8, borderRadius: 4 }} />
                                            </Box>
                                            <Box sx={{ minWidth: 35 }}>
                                                <Typography variant="body2" color="text.secondary">{Math.round((item.totalAmount / totalSpent) * 100)}%</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        </Grid>
      )}
    </Container>
  );
}
