
import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    Grid,
    Typography,
    Box,
    LinearProgress,
    useTheme,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip
} from '@mui/material';
import {
    TrendingDown,
    TrendingUp,
    TrendingFlat,
    Warning
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import type { FinancialSummary } from '../services/analysisService';

interface SpendingAnalysisProps {
    data: FinancialSummary;
}

export const SpendingAnalysis: React.FC<SpendingAnalysisProps> = ({ data }) => {
    const theme = useTheme();

    return (
        <Grid container spacing={3}>
            {/* Resumo de Gastos */}
            <Grid item xs={12} md={8}>
                <Card sx={{ height: '100%' }}>
                    <CardHeader
                        title="Detalhamento de Gastos"
                        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                    />
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.categoryBreakdown.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'Valor']}
                                    contentStyle={{ borderRadius: 8 }}
                                />
                                <Bar dataKey="amount" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                                {/* Linha média se possível, ou budget */}
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>

            {/* Tendências dos Top Gastos */}
            <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                    <CardHeader
                        title="Tendências Recentes"
                        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                    />
                    <CardContent>
                        {data.trends.map((trend) => (
                            <Box key={trend.category} mb={2}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                    <Typography variant="body2" fontWeight={500}>{trend.category}</Typography>
                                    <Box display="flex" alignItems="center">
                                        {trend.trend === 'up' && <TrendingUp fontSize="small" color="error" />}
                                        {trend.trend === 'down' && <TrendingDown fontSize="small" color="success" />}
                                        {trend.trend === 'stable' && <TrendingFlat fontSize="small" color="action" />}
                                        <Typography
                                            variant="caption"
                                            ml={0.5}
                                            color={trend.trend === 'up' ? 'error.main' : trend.trend === 'down' ? 'success.main' : 'text.secondary'}
                                        >
                                            {Math.abs(trend.changePercent).toFixed(1)}%
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                    R$ {trend.currentAmount.toFixed(2)} vs R$ {trend.previousAmount.toFixed(2)} (Mês anterior)
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(100, (trend.currentAmount / (trend.previousAmount || 1)) * 50)}
                                    color={trend.trend === 'up' ? 'error' : 'success'}
                                    sx={{ borderRadius: 1, height: 6 }}
                                />
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            </Grid>

            {/* Transações Incomuns (Outliers) */}
            <Grid item xs={12}>
                <Card>
                    <CardHeader
                        title="Transações Incomuns (Outliers)"
                        subheader="Gastos que fogem do seu padrão habitual"
                    />
                    <CardContent>
                        {data.unusualTransactions.length === 0 ? (
                            <Typography color="text.secondary" align="center" py={3}>
                                Nenhuma transação atípica detectada neste período. Parabéns pela consistência!
                            </Typography>
                        ) : (
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Data</TableCell>
                                        <TableCell>Descrição</TableCell>
                                        <TableCell>Categoria</TableCell>
                                        <TableCell align="right">Valor</TableCell>
                                        <TableCell>Motivo</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.unusualTransactions.map((t) => (
                                        <TableRow key={t.transactionId}>
                                            <TableCell>{new Date(t.date).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell>{t.description}</TableCell>
                                            <TableCell>
                                                <Chip label={t.category} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                                R$ {t.amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Warning fontSize="small" color="warning" />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t.reason}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};
