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
import { Edit, Delete } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { showSuccess, showError, showConfirm } from '../utils/notifications';
import { useForm, Controller } from 'react-hook-form';
import {
    useBudgets,
    useCreateBudget,
    useUpdateBudget,
    useDeleteBudget
} from '../hooks/api/useBudgets';
import { useCategories } from '../hooks/api/useCategories';

interface BudgetFormData {
    name: string;
    categoryId: string;
    amount: number;
    period: string;
}

const defaultValues: BudgetFormData = {
    name: '',
    categoryId: '',
    amount: 0,
    period: 'MONTHLY',
};

export default function BudgetsPage() {
    const [open, setOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<any>(null);

    // Hooks
    const { data: budgets = [] } = useBudgets();
    const { data: categories = [] } = useCategories();
    const createBudget = useCreateBudget();
    const updateBudget = useUpdateBudget();
    const deleteBudget = useDeleteBudget();

    const { control, handleSubmit, reset } = useForm<BudgetFormData>({
        defaultValues
    });

    const handleOpen = (budget?: any) => {
        if (budget) {
            // MAPPING: Backend (category name) -> Frontend (categoryId)
            const categoryObj = categories.find((c: any) => c.name === budget.category);
            const categoryId = categoryObj ? categoryObj.id : '';

            setEditingBudget(budget);
            reset({
                name: budget.name || '',
                categoryId: categoryId,
                amount: budget.amount,
                period: budget.period,
            });
        } else {
            setEditingBudget(null);
            reset(defaultValues);
        }
        setOpen(true);
    };

    const onSubmit = async (data: BudgetFormData) => {
        try {
            // MAPPING: Frontend (categoryId) -> Backend (category name)
            const categoryObj = categories.find((c: any) => c.id === data.categoryId);
            const categoryName = categoryObj ? categoryObj.name : null;

            const payload = {
                name: data.name || (categoryName ? `Orçamento - ${categoryName}` : 'Novo Orçamento'),
                amount: data.amount,
                period: data.period,
                category: categoryName,
                startDate: new Date().toISOString(), // Default start date
            };

            if (editingBudget) {
                await updateBudget.mutateAsync({ id: editingBudget.id, data: payload });
            } else {
                await createBudget.mutateAsync(payload);
            }
            setOpen(false);
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
                await deleteBudget.mutateAsync(id);
                showSuccess('O orçamento foi excluído.', { title: 'Excluído!' });
            } catch (error) {
                showError(error, { title: 'Erro', text: 'Não foi possível excluir o orçamento.' });
            }
        }
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title="Orçamentos"
                breadcrumbs={[
                    { label: 'Dashboards', to: '/dashboards' },
                    { label: 'Orçamentos' }
                ]}
                actionLabel="Novo Orçamento"
                onAction={() => handleOpen()}
            />

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
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogTitle>{editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Nome"
                                        fullWidth
                                        placeholder="Ex: Alimentação Mensal"
                                    />
                                )}
                            />
                            <Controller
                                name="categoryId"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Categoria"
                                        fullWidth
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
                                )}
                            />
                            <Controller
                                name="period"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Período"
                                        fullWidth
                                    >
                                        <MenuItem value="MONTHLY">Mensal</MenuItem>
                                        <MenuItem value="YEARLY">Anual</MenuItem>
                                    </TextField>
                                )}
                            />
                            <Controller
                                name="amount"
                                control={control}
                                rules={{ required: 'Limite é obrigatório', min: { value: 0.01, message: 'Limite deve ser maior que zero' } }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Limite"
                                        type="number"
                                        fullWidth
                                        error={!!error}
                                        helperText={error?.message}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
