/**
 * Budget Allocation Manager Component
 * Componente para gerenciar e visualizar alocações de orçamento
 */

import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    LinearProgress,
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Slider,
    Alert,
    AlertTitle,
    Collapse,
    Tooltip,
    Skeleton,
    useTheme,
    alpha,
    Divider,
} from '@mui/material';
import {
    Settings,
    Add,
    Delete,
    ExpandMore,
    ExpandLess,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    PieChart,
    Save,
    RestartAlt,
} from '@mui/icons-material';
import {
    useDefaultAllocationProfile,
    useAllocationAnalysis,
    useUpdateAllocationProfile,
    useCreateDefaultAllocationProfile,
    AllocationCategory,
} from '../hooks/api/useBudgetAllocation';

interface BudgetAllocationManagerProps {
    dashboardId: string;
    totalIncome: number;
}

// Cores padrão para categorias
const DEFAULT_COLORS = [
    '#EF4444', // red
    '#8B5CF6', // purple
    '#10B981', // green
    '#3B82F6', // blue
    '#F59E0B', // amber
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
];

export default function BudgetAllocationManager({ dashboardId, totalIncome }: BudgetAllocationManagerProps) {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(true);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingAllocations, setEditingAllocations] = useState<AllocationCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Queries
    const { 
        data: profile, 
        isLoading: loadingProfile,
        refetch: refetchProfile 
    } = useDefaultAllocationProfile(dashboardId);
    
    const { 
        data: analysis, 
        refetch: refetchAnalysis 
    } = useAllocationAnalysis(dashboardId);

    // Mutations
    const updateProfile = useUpdateAllocationProfile();
    const createDefaultProfile = useCreateDefaultAllocationProfile();

    // Inicializa alocações para edição
    useEffect(() => {
        if (profile?.allocations) {
            setEditingAllocations(profile.allocations);
        }
    }, [profile]);

    // Handler para criar perfil padrão se não existir
    const handleCreateDefaultProfile = async () => {
        try {
            await createDefaultProfile.mutateAsync(dashboardId);
            refetchProfile();
        } catch (error) {
            console.error('Erro ao criar perfil:', error);
        }
    };

    // Handler para salvar alterações
    const handleSaveAllocations = async () => {
        if (!profile?.id) return;

        // Validar soma = 100%
        const total = editingAllocations.reduce((sum, a) => sum + a.percentage, 0);
        if (Math.abs(total - 100) > 0.01) {
            alert(`A soma das porcentagens deve ser 100%. Atual: ${total.toFixed(1)}%`);
            return;
        }

        try {
            await updateProfile.mutateAsync({
                profileId: profile.id,
                updates: { allocations: editingAllocations },
            });
            setEditDialogOpen(false);
            refetchAnalysis();
        } catch (error) {
            console.error('Erro ao salvar alocações:', error);
        }
    };

    // Handler para alterar porcentagem
    const handlePercentageChange = (index: number, value: number) => {
        const updated = [...editingAllocations];
        updated[index] = { ...updated[index], percentage: value };
        setEditingAllocations(updated);
    };

    // Handler para adicionar categoria
    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;

        const newCategory: AllocationCategory = {
            name: newCategoryName.trim(),
            percentage: 0,
            color: DEFAULT_COLORS[editingAllocations.length % DEFAULT_COLORS.length],
            order: editingAllocations.length,
            linkedCategories: [],
        };

        setEditingAllocations([...editingAllocations, newCategory]);
        setNewCategoryName('');
    };

    // Handler para remover categoria
    const handleRemoveCategory = (index: number) => {
        setEditingAllocations(editingAllocations.filter((_, i) => i !== index));
    };

    // Handler para resetar para padrão
    const handleResetToDefault = () => {
        if (profile?.allocations) {
            setEditingAllocations(profile.allocations);
        }
    };

    // Calcula total das porcentagens em edição
    const totalPercentage = editingAllocations.reduce((sum, a) => sum + a.percentage, 0);
    const isValidTotal = Math.abs(totalPercentage - 100) <= 0.01;

    // Usa a receita da prop se a análise retornar 0 ou não existir
    const effectiveIncome = (analysis?.totalIncome && analysis.totalIncome > 0) 
        ? analysis.totalIncome 
        : totalIncome;

    // Combina dados da análise com cálculos baseados na receita da prop
    const displayAllocations = useMemo(() => {
        // Se temos análise com dados reais, usar ela
        if (analysis?.allocations && analysis.allocations.length > 0 && effectiveIncome > 0) {
            return analysis.allocations.map((a, index) => ({
                ...a,
                // Recalcular targetAmount usando a receita efetiva
                targetAmount: effectiveIncome * (a.targetPercentage / 100),
                color: profile?.allocations?.[index]?.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
            }));
        }
        
        // Se não há análise, mas temos perfil, calcular baseado no perfil
        if (profile?.allocations && effectiveIncome > 0) {
            return profile.allocations.map((a, index) => ({
                name: a.name,
                targetPercentage: a.percentage,
                targetAmount: effectiveIncome * (a.percentage / 100),
                actualAmount: 0,
                actualPercentage: 0,
                difference: effectiveIncome * (a.percentage / 100),
                differencePercentage: 100,
                status: 'under' as const,
                linkedCategories: a.linkedCategories || [],
                matchedTransactions: 0,
                color: a.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
            }));
        }
        
        return [];
    }, [analysis, profile, effectiveIncome]);

    // Helper para status da alocação
    const getStatusColor = (status: 'under' | 'on_track' | 'over') => {
        switch (status) {
            case 'under': return theme.palette.success.main;
            case 'on_track': return theme.palette.info.main;
            case 'over': return theme.palette.error.main;
        }
    };

    const getStatusIcon = (status: 'under' | 'on_track' | 'over') => {
        switch (status) {
            case 'under': return <TrendingDown fontSize="small" />;
            case 'on_track': return <CheckCircle fontSize="small" />;
            case 'over': return <TrendingUp fontSize="small" />;
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    // Loading state
    if (loadingProfile) {
        return (
            <Card>
                <CardContent>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
                </CardContent>
            </Card>
        );
    }

    // Sem perfil - mostrar opção de criar
    if (!profile && !loadingProfile) {
        return (
            <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <PieChart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Alocação de Orçamento
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Configure como você quer distribuir sua renda mensal entre diferentes categorias
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreateDefaultProfile}
                        disabled={createDefaultProfile.isPending}
                    >
                        {createDefaultProfile.isPending ? 'Criando...' : 'Criar Perfil de Alocação'}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardContent>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PieChart color="primary" />
                            <Typography variant="h6" fontWeight={600}>
                                Alocação de Orçamento
                            </Typography>
                            {analysis?.summary?.overallStatus && (
                                <Chip
                                    size="small"
                                    label={
                                        analysis.summary.overallStatus === 'healthy' ? 'Saudável' :
                                        analysis.summary.overallStatus === 'warning' ? 'Atenção' : 'Crítico'
                                    }
                                    color={
                                        analysis.summary.overallStatus === 'healthy' ? 'success' :
                                        analysis.summary.overallStatus === 'warning' ? 'warning' : 'error'
                                    }
                                />
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Editar alocações">
                                <IconButton onClick={() => setEditDialogOpen(true)}>
                                    <Settings />
                                </IconButton>
                            </Tooltip>
                            <IconButton onClick={() => setExpanded(!expanded)}>
                                {expanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        </Box>
                    </Box>

                    <Collapse in={expanded}>
                        {/* Alertas de alocação */}
                        {displayAllocations.some(a => a.status === 'over') && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                <AlertTitle>Atenção aos gastos</AlertTitle>
                                Algumas categorias estão acima do planejado este mês.
                            </Alert>
                        )}

                        {/* Visão das alocações */}
                        <Grid container spacing={2}>
                            {displayAllocations.map((allocation, index) => (
                                <Grid item xs={12} sm={6} key={index}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: alpha(allocation.status === 'over' ? theme.palette.error.main : theme.palette.primary.main, 0.05),
                                            border: `1px solid ${alpha(
                                                allocation.status === 'over' ? theme.palette.error.main : theme.palette.divider,
                                                allocation.status === 'over' ? 0.3 : 1
                                            )}`,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box
                                                    sx={{
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: '50%',
                                                        bgcolor: allocation.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                                                    }}
                                                />
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {allocation.name}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                size="small"
                                                icon={getStatusIcon(allocation.status)}
                                                label={`${allocation.targetPercentage}%`}
                                                sx={{
                                                    bgcolor: alpha(getStatusColor(allocation.status), 0.1),
                                                    color: getStatusColor(allocation.status),
                                                    '& .MuiChip-icon': { color: 'inherit' },
                                                }}
                                            />
                                        </Box>

                                        <Box sx={{ mb: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatCurrency(allocation.actualAmount)} / {formatCurrency(allocation.targetAmount)}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    fontWeight={600}
                                                    color={getStatusColor(allocation.status)}
                                                >
                                                    {allocation.actualPercentage.toFixed(0)}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={allocation.targetAmount > 0 ? Math.min((allocation.actualAmount / allocation.targetAmount) * 100, 100) : 0}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: alpha(theme.palette.divider, 0.3),
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: 4,
                                                        bgcolor: getStatusColor(allocation.status),
                                                    },
                                                }}
                                            />
                                        </Box>

                                        {allocation.difference !== 0 && allocation.targetAmount > 0 && (
                                            <Typography
                                                variant="caption"
                                                color={allocation.status === 'over' ? 'error.main' : 'success.main'}
                                            >
                                                {allocation.status === 'over' ? 'Excedido em ' : 'Disponível: '}
                                                {formatCurrency(Math.abs(allocation.difference))}
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                            
                            {displayAllocations.length === 0 && effectiveIncome === 0 && (
                                <Grid item xs={12}>
                                    <Alert severity="info">
                                        <AlertTitle>Adicione uma receita</AlertTitle>
                                        Para ver a distribuição do orçamento, adicione uma receita neste mês.
                                    </Alert>
                                </Grid>
                            )}
                        </Grid>

                        {/* Gastos não alocados */}
                        {analysis?.unallocatedExpenses && analysis.unallocatedExpenses.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Gastos não classificados
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {analysis.unallocatedExpenses.slice(0, 5).map((expense, index) => (
                                        <Chip
                                            key={index}
                                            size="small"
                                            label={`${expense.category}: ${formatCurrency(expense.amount)}`}
                                            variant="outlined"
                                        />
                                    ))}
                                    {analysis.unallocatedExpenses.length > 5 && (
                                        <Chip
                                            size="small"
                                            label={`+${analysis.unallocatedExpenses.length - 5} mais`}
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Collapse>
                </CardContent>
            </Card>

            {/* Dialog de edição */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PieChart />
                        Configurar Alocação de Orçamento
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <AlertTitle>Como funciona</AlertTitle>
                        Defina quanto (%) da sua renda mensal deve ser destinado para cada categoria.
                        A soma deve ser exatamente 100%.
                    </Alert>

                    {/* Barra de total */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2">
                                Total alocado
                            </Typography>
                            <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color={isValidTotal ? 'success.main' : 'error.main'}
                            >
                                {totalPercentage.toFixed(1)}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(totalPercentage, 100)}
                            color={isValidTotal ? 'success' : totalPercentage > 100 ? 'error' : 'warning'}
                            sx={{ height: 10, borderRadius: 5 }}
                        />
                        {!isValidTotal && (
                            <Typography variant="caption" color="error">
                                {totalPercentage < 100
                                    ? `Faltam ${(100 - totalPercentage).toFixed(1)}% para completar`
                                    : `Excedido em ${(totalPercentage - 100).toFixed(1)}%`}
                            </Typography>
                        )}
                    </Box>

                    {/* Lista de alocações para edição */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {editingAllocations.map((allocation, index) => (
                            <Box
                                key={index}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: `1px solid ${theme.palette.divider}`,
                                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            bgcolor: allocation.color || DEFAULT_COLORS[index],
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => {
                                            // Ciclar pelas cores disponíveis
                                            const currentColorIndex = DEFAULT_COLORS.indexOf(allocation.color || DEFAULT_COLORS[index]);
                                            const nextColorIndex = (currentColorIndex + 1) % DEFAULT_COLORS.length;
                                            const updated = [...editingAllocations];
                                            updated[index] = { ...updated[index], color: DEFAULT_COLORS[nextColorIndex] };
                                            setEditingAllocations(updated);
                                        }}
                                    />
                                    <TextField
                                        size="small"
                                        value={allocation.name}
                                        onChange={(e) => {
                                            const updated = [...editingAllocations];
                                            updated[index] = { ...updated[index], name: e.target.value };
                                            setEditingAllocations(updated);
                                        }}
                                        variant="standard"
                                        sx={{ 
                                            flex: 1,
                                            '& .MuiInput-input': { 
                                                fontWeight: 600,
                                                fontSize: '1rem',
                                            },
                                        }}
                                        placeholder="Nome da categoria"
                                    />
                                    <Typography variant="h6" fontWeight={700} color="primary">
                                        {allocation.percentage}%
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveCategory(index)}
                                        disabled={editingAllocations.length <= 1}
                                    >
                                        <Delete />
                                    </IconButton>
                                </Box>
                                <Slider
                                    value={allocation.percentage}
                                    onChange={(_, value) => handlePercentageChange(index, value as number)}
                                    min={0}
                                    max={100}
                                    step={1}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(value) => `${value}%`}
                                    sx={{
                                        color: allocation.color || DEFAULT_COLORS[index],
                                        '& .MuiSlider-thumb': {
                                            bgcolor: allocation.color || DEFAULT_COLORS[index],
                                        },
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {totalIncome > 0
                                        ? `≈ ${formatCurrency(totalIncome * allocation.percentage / 100)} por mês`
                                        : 'Adicione receitas para ver o valor'}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Adicionar nova categoria */}
                    <Divider sx={{ my: 3 }} />
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                            size="small"
                            placeholder="Nova categoria..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                            sx={{ flex: 1 }}
                        />
                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={handleAddCategory}
                            disabled={!newCategoryName.trim()}
                        >
                            Adicionar
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        startIcon={<RestartAlt />}
                        onClick={handleResetToDefault}
                        color="inherit"
                    >
                        Resetar
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    <Button onClick={() => setEditDialogOpen(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSaveAllocations}
                        disabled={!isValidTotal || updateProfile.isPending}
                    >
                        {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
