import { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    LinearProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { budgetService, categoryService } from '../services/api';
import { showSuccess, showError, showConfirm } from '../utils/notifications';

export default function BudgetsPage() {
    const [open, setOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        amount: 0,
        period: 'MONTHLY',
    });

    const { data: budgets = [], refetch } = useQuery({
        queryKey: ['budgets'],
        queryFn: budgetService.getAll,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: categoryService.getAll,
    });



    const handleOpen = (budget?: any) => {

        if (budget) {
            // MAPPING: Backend (category name) -> Frontend (categoryId)
            const categoryObj = categories.find((c: any) => c.name === budget.category);
            const categoryId = categoryObj ? categoryObj.id : '';

            setEditingBudget(budget);
            setFormData({
                name: budget.name || '',
                categoryId: categoryId,
                amount: budget.amount,
                period: budget.period,
            });
        } else {
            setEditingBudget(null);
            setFormData({
                name: '',
                categoryId: '',
                amount: 0,
                period: 'MONTHLY',
            });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            // MAPPING: Frontend (categoryId) -> Backend (category name)
            const categoryObj = categories.find((c: any) => c.id === formData.categoryId);
            const categoryName = categoryObj ? categoryObj.name : null;

            const payload = {
                name: formData.name || (categoryName ? `Orçamento - ${categoryName}` : 'Novo Orçamento'),
                amount: formData.amount,
                period: formData.period,
                category: categoryName,
                startDate: new Date().toISOString(), // Default start date
            };

            if (editingBudget) {
                await budgetService.update(editingBudget.id, payload);
            } else {
                await budgetService.create(payload);
            }
            setOpen(false);
            refetch();
            showSuccess(`Orçamento ${editingBudget ? 'atualizado' : 'criado'} com sucesso!`, { title: 'Sucesso', timer: 1500 });
        } catch (error) {
            console.error('Error saving budget:', error);
            showError(error, { title: 'Erro', text: 'Não foi possível salvar o orçamento.' });
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
                await budgetService.delete(id);
                refetch();
                showSuccess('O orçamento foi excluído.', { title: 'Excluído!' });
            } catch (error) {
                showError(error, { title: 'Erro', text: 'Não foi possível excluir o orçamento.' });
            }
        }
    };



    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700}>
                    Orçamentos
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
                    Novo Orçamento
                </Button>
            </Box>

            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nome</TableCell>
                                    <TableCell>Categoria</TableCell>
                                    <TableCell>Período</TableCell>
                                    <TableCell align="right">Limite</TableCell>
                                    <TableCell align="right">Gasto</TableCell>
                                    <TableCell>Progresso</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {budgets.map((budget: any) => {
                                    const spent = budget.spent || 0; // Assuming backend returns spent amount
                                    const progress = Math.min((spent / budget.amount) * 100, 100);

                                    return (
                                        <TableRow key={budget.id}>
                                            <TableCell>{budget.name}</TableCell>
                                            <TableCell>{budget.category || 'Geral'}</TableCell>
                                            <TableCell>{budget.period === 'MONTHLY' ? 'Mensal' : 'Anual'}</TableCell>
                                            <TableCell align="right">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.amount)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spent)}
                                            </TableCell>
                                            <TableCell sx={{ width: '30%' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box sx={{ width: '100%', mr: 1 }}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={progress}
                                                            color={progress > 90 ? 'error' : progress > 70 ? 'warning' : 'primary'}
                                                        />
                                                    </Box>
                                                    <Box sx={{ minWidth: 35 }}>
                                                        <Typography variant="body2" color="text.secondary">{`${Math.round(progress)}%`}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton onClick={() => handleOpen(budget)} color="primary">
                                                    <Edit />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(budget.id)} color="error">
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {budgets.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            Nenhum orçamento cadastrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>{editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
                        <TextField
                            label="Nome"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Alimentação Mensal"
                        />
                        <TextField
                            select
                            label="Categoria"
                            fullWidth
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        >
                            <MenuItem value="">
                                <em>Geral (Todas as categorias)</em>
                            </MenuItem>
                            {categories.map((category: any) => (
                                <MenuItem key={category.id} value={category.id}>
                                    {category.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            label="Período"
                            fullWidth
                            value={formData.period}
                            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                        >
                            <MenuItem value="MONTHLY">Mensal</MenuItem>
                            <MenuItem value="YEARLY">Anual</MenuItem>
                        </TextField>
                        <TextField
                            label="Limite"
                            type="number"
                            fullWidth
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
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
