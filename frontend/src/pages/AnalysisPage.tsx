
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    CircularProgress,
    Button,
    Alert,
    Card,
    CardContent,
    useTheme
} from '@mui/material';
import { Refresh, AutoAwesome } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { SpendingAnalysis } from '../components/SpendingAnalysis';
import { analysisService, FinancialSummary } from '../services/analysisService';
import LoadingSkeleton from '../components/LoadingSkeleton';

export const AnalysisPage: React.FC = () => {
    const { id: dashboardId } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<FinancialSummary | null>(null);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const theme = useTheme();

    const fetchData = async () => {
        if (!dashboardId) return;
        try {
            setLoading(true);
            const summary = await analysisService.getSummary(dashboardId);
            setData(summary);

            // Tentar carregar insight inicial se não existir
            if (!aiInsight) {
                generateInsight();
            }
        } catch (error) {
            console.error('Failed to load analysis', error);
        } finally {
            setLoading(false);
        }
    };

    const generateInsight = async () => {
        if (!dashboardId) return;
        try {
            setAiLoading(true);
            const res = await analysisService.getInsights(dashboardId);
            setAiInsight(res.insights);
        } catch (error) {
            console.error('Failed to generate insight', error);
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dashboardId]);

    if (!dashboardId) return <Alert severity="error">Dashboard não encontrado</Alert>;
    if (loading) return <LoadingSkeleton />;

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <PageHeader
                title="Análise Financeira Inteligente"
                subtitle="Insights detalhados sobre seus hábitos de consumo"
                action={
                    <Button
                        startIcon={<Refresh />}
                        onClick={fetchData}
                        variant="outlined"
                    >
                        Atualizar
                    </Button>
                }
            />

            <Grid container spacing={3}>
                {/* Seção AI Insight - Destaque */}
                <Grid item xs={12}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            background: theme.palette.mode === 'dark'
                                ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)'
                                : 'linear-gradient(135deg, #f3e8ff 0%, #ffffff 100%)',
                            border: `1px solid ${theme.palette.primary.light}`,
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <AutoAwesome color="primary" />
                            <Typography variant="h6" color="primary.main" fontWeight="bold">
                                Análise da IA
                            </Typography>
                        </Box>

                        {aiLoading ? (
                            <Box display="flex" alignItems="center" gap={2} py={2}>
                                <CircularProgress size={24} />
                                <Typography color="text.secondary">A Inteligência Artificial está analisando seus dados...</Typography>
                            </Box>
                        ) : aiInsight ? (
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: 1.6 }}>
                                {aiInsight}
                            </Typography>
                        ) : (
                            <Box textAlign="center" py={2}>
                                <Typography color="text.secondary" mb={2}>
                                    Gere uma análise baseada em IA para obter insights personalizados.
                                </Typography>
                                <Button variant="contained" startIcon={<AutoAwesome />} onClick={generateInsight}>
                                    Gerar Análise Agora
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Resumo Numérico Rápido */}
                {data && (
                    <Grid item xs={12}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="text.secondary" variant="caption">Saldo do Período</Typography>
                                        <Typography variant="h4" fontWeight="bold" color={data.balance >= 0 ? 'success.main' : 'error.main'}>
                                            R$ {data.balance.toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="text.secondary" variant="caption">Taxa de Poupança</Typography>
                                        <Typography variant="h4" fontWeight="bold" color={data.savingsRate > 20 ? 'success.main' : data.savingsRate > 0 ? 'warning.main' : 'error.main'}>
                                            {data.savingsRate.toFixed(1)}%
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="text.secondary" variant="caption">Total Gasto</Typography>
                                        <Typography variant="h4" fontWeight="bold" color="error.main">
                                            R$ {data.totalExpenses.toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                )}

                {/* Componente Detalhado */}
                {data && (
                    <Grid item xs={12}>
                        <SpendingAnalysis data={data} />
                    </Grid>
                )}
            </Grid>
        </Container>
    );
};

export default AnalysisPage;
