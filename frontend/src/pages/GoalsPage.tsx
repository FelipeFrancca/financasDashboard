import { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    LinearProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { showSuccess, showError, showConfirm } from '../utils/notifications';
import { useForm, Controller } from 'react-hook-form';
import {
    useGoals,
    useCreateGoal,
    useUpdateGoal,
    useDeleteGoal
} from '../hooks/api/useGoals';

interface GoalFormData {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    color: string;
}

const defaultValues: GoalFormData = {
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: '',
    color: '#000000',
};

import { useParams } from 'react-router-dom';

// ... imports

export default function GoalsPage() {
    const { dashboardId } = useParams<{ dashboardId: string }>();
    const [open, setOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<any>(null);

    // Hooks
    const { data: goals = [] } = useGoals(dashboardId || '');
    const createGoal = useCreateGoal();
    const updateGoal = useUpdateGoal();
    const deleteGoal = useDeleteGoal();

    const { control, handleSubmit, reset } = useForm<GoalFormData>({
        defaultValues
    });

    const handleOpen = (goal?: any) => {
        if (goal) {
            setEditingGoal(goal);
            reset({
                name: goal.name,
                targetAmount: goal.targetAmount,
                currentAmount: goal.currentAmount,
                deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
                color: goal.color || '#000000',
            });
        } else {
            setEditingGoal(null);
            reset(defaultValues);
        }
        setOpen(true);
    };

    const onSubmit = async (data: GoalFormData) => {
        try {
            const payload = {
                ...data,
                deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
            };

            if (editingGoal) {
                await updateGoal.mutateAsync({ id: editingGoal.id, data: payload, dashboardId: dashboardId || '' });
            } else {
                await createGoal.mutateAsync({ data: payload, dashboardId: dashboardId || '' });
            }
            setOpen(false);
            showSuccess(`Meta ${editingGoal ? 'atualizada' : 'criada'} com sucesso!`, { title: 'Sucesso', timer: 1500 });
        } catch (error) {
            showError(error, { title: 'Erro', text: 'Não foi possível salvar a meta.' });
        }
    };

    const handleDelete = async (id: string) => {
        const result = await showConfirm(
            'Esta ação não pode ser desfeita.',
            {
                title: 'Tem certeza?',
                icon: 'warning',
                confirmButtonText: 'Sim, excluir',
                cancelButtonText: 'Cancelar',
            }
        );

        if (result.isConfirmed) {
            try {
                await deleteGoal.mutateAsync({ id, dashboardId: dashboardId || '' });
                showSuccess('A meta foi excluída.', { title: 'Excluído!' });
            } catch (error) {
                showError(error, { title: 'Erro', text: 'Não foi possível excluir a meta.' });
            }
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <Container maxWidth="lg">
            <PageHeader
                title="Metas Financeiras"
                breadcrumbs={[
                    { label: 'Dashboards', to: '/dashboards' },
                    { label: 'Metas' }
                ]}
                actionLabel="Nova Meta"
                onAction={() => handleOpen()}
            />

            <Grid container spacing={3}>
                {goals.map((goal: any) => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    return (
                        <Grid item xs={12} md={6} lg={4} key={goal.id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h6" fontWeight={600}>
                                            {goal.name}
                                        </Typography>
                                        <Box>
                                            <IconButton size="small" onClick={() => handleOpen(goal)}>
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(goal.id)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
                                        {formatCurrency(goal.currentAmount)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        de {formatCurrency(goal.targetAmount)}
                                    </Typography>

                                    <Box sx={{ mt: 2, mb: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="caption" fontWeight={600}>
                                                Progresso
                                            </Typography>
                                            <Typography variant="caption" fontWeight={600}>
                                                {progress.toFixed(1)}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                                    </Box>

                                    {goal.deadline && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                                            Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
                {goals.length === 0 && (
                    <Grid item xs={12}>
                        <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                            Nenhuma meta cadastrada. Comece criando uma nova meta!
                        </Typography>
                    </Grid>
                )}
            </Grid>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
                            <Controller
                                name="name"
                                control={control}
                                rules={{ required: 'Nome é obrigatório' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Nome"
                                        fullWidth
                                        error={!!error}
                                        helperText={error?.message}
                                    />
                                )}
                            />
                            <Controller
                                name="targetAmount"
                                control={control}
                                rules={{ required: 'Valor alvo é obrigatório', min: { value: 0.01, message: 'Valor deve ser maior que zero' } }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Valor Alvo"
                                        type="number"
                                        fullWidth
                                        error={!!error}
                                        helperText={error?.message}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                )}
                            />
                            <Controller
                                name="currentAmount"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Valor Atual"
                                        type="number"
                                        fullWidth
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                )}
                            />
                            <Controller
                                name="deadline"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Prazo"
                                        type="date"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" variant="contained">
                            Salvar
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
}
