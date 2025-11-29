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
import { Add, Edit, Delete } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { goalService } from '../services/api';
import { showSuccess, showError, showConfirm } from '../utils/notifications';

export default function GoalsPage() {
    const [open, setOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        deadline: '',
        color: '#000000',
    });

    const { data: goals = [], refetch } = useQuery({
        queryKey: ['goals'],
        queryFn: goalService.getAll,
    });

    const handleOpen = (goal?: any) => {
        if (goal) {
            setEditingGoal(goal);
            setFormData({
                name: goal.name,
                targetAmount: goal.targetAmount,
                currentAmount: goal.currentAmount,
                deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
                color: goal.color || '#000000',
            });
        } else {
            setEditingGoal(null);
            setFormData({
                name: '',
                targetAmount: 0,
                currentAmount: 0,
                deadline: '',
                color: '#000000',
            });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            const data = {
                ...formData,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
            };

            if (editingGoal) {
                await goalService.update(editingGoal.id, data);
            } else {
                await goalService.create(data);
            }
            setOpen(false);
            refetch();
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
                await goalService.delete(id);
                refetch();
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700}>
                    Metas Financeiras
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
                    Nova Meta
                </Button>
            </Box>

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
                <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
                        <TextField
                            label="Nome"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            label="Valor Alvo"
                            type="number"
                            fullWidth
                            value={formData.targetAmount}
                            onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })}
                        />
                        <TextField
                            label="Valor Atual"
                            type="number"
                            fullWidth
                            value={formData.currentAmount}
                            onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) })}
                        />
                        <TextField
                            label="Prazo"
                            type="date"
                            fullWidth
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
