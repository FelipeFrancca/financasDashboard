import { useState } from 'react';
import {
    Box,
    Container,
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
    Chip,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { showSuccess, showError, showConfirm } from '../utils/notifications';
import { useForm, Controller } from 'react-hook-form';
import {
    useRecurrences,
    useCreateRecurrence,
    useUpdateRecurrence,
    useDeleteRecurrence
} from '../hooks/api/useRecurrences';
import { useCategories } from '../hooks/api/useCategories';

interface RecurrenceFormData {
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    categoryId: string;
    frequency: string;
    startDate: string;
}

const defaultValues: RecurrenceFormData = {
    description: '',
    amount: 0,
    type: 'EXPENSE',
    categoryId: '',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
};

export default function RecurrencesPage() {
    const [open, setOpen] = useState(false);
    const [editingRecurrence, setEditingRecurrence] = useState<any>(null);

    // Hooks
    const { data: recurrences = [] } = useRecurrences();
    const { data: categories = [] } = useCategories();
    const createRecurrence = useCreateRecurrence();
    const updateRecurrence = useUpdateRecurrence();
    const deleteRecurrence = useDeleteRecurrence();

    const { control, handleSubmit, reset, watch } = useForm<RecurrenceFormData>({
        defaultValues
    });

    const selectedType = watch('type');

    const handleOpen = (recurrence?: any) => {
        if (recurrence) {
            // MAPPING: Backend (entryType/category) -> Frontend (type/categoryId)
            const type = recurrence.entryType === 'Receita' ? 'INCOME' : 'EXPENSE';

            // Find category ID by name
            const categoryObj = categories.find((c: any) => c.name === recurrence.category);
            const categoryId = categoryObj ? categoryObj.id : '';

            setEditingRecurrence(recurrence);
            reset({
                description: recurrence.description,
                amount: recurrence.amount,
                type: type,
                categoryId: categoryId,
                frequency: recurrence.frequency,
                startDate: recurrence.startDate ? new Date(recurrence.startDate).toISOString().split('T')[0] : '',
            });
        } else {
            setEditingRecurrence(null);
            reset(defaultValues);
        }
        setOpen(true);
    };

    const onSubmit = async (data: RecurrenceFormData) => {
        try {
            // MAPPING: Frontend (type/categoryId) -> Backend (entryType/category)
            const entryType = data.type === 'INCOME' ? 'Receita' : 'Despesa';

            const categoryObj = categories.find((c: any) => c.id === data.categoryId);
            const categoryName = categoryObj ? categoryObj.name : 'Outros';

            const payload = {
                description: data.description,
                amount: data.amount,
                entryType: entryType,
                flowType: 'Fixa', // Default value required by schema
                category: categoryName,
                frequency: data.frequency,
                startDate: new Date(data.startDate).toISOString(),
            };

            if (editingRecurrence) {
                await updateRecurrence.mutateAsync({ id: editingRecurrence.id, data: payload });
            } else {
                await createRecurrence.mutateAsync(payload);
            }
            setOpen(false);
            showSuccess(`Recorrência ${editingRecurrence ? 'atualizada' : 'criada'} com sucesso!`, { title: 'Sucesso', timer: 1500 });
        } catch (error) {
            console.error('Error saving recurrence:', error);
            showError(error, { title: 'Erro', text: 'Não foi possível salvar a recorrência.' });
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
                await deleteRecurrence.mutateAsync(id);
                showSuccess('A recorrência foi excluída.', { title: 'Excluído!' });
            } catch (error) {
                showError(error, { title: 'Erro', text: 'Não foi possível excluir a recorrência.' });
            }
        }
    };

    // Helper to display category name in table (recurrence has category name directly)
    const getCategoryDisplay = (recurrence: any) => {
        return recurrence.category || 'Sem categoria';
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title="Recorrências"
                breadcrumbs={[
                    { label: 'Dashboards', to: '/dashboards' },
                    { label: 'Recorrências' }
                ]}
                actionLabel="Nova Recorrência"
                onAction={() => handleOpen()}
            />

            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Descrição</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Categoria</TableCell>
                                    <TableCell>Frequência</TableCell>
                                    <TableCell align="right">Valor</TableCell>
                                    <TableCell>Próxima Data</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {recurrences.map((recurrence: any) => (
                                    <TableRow key={recurrence.id}>
                                        <TableCell>{recurrence.description}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={recurrence.entryType || (recurrence.type === 'INCOME' ? 'Receita' : 'Despesa')}
                                                color={(recurrence.entryType === 'Receita' || recurrence.type === 'INCOME') ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{getCategoryDisplay(recurrence)}</TableCell>
                                        <TableCell>
                                            {recurrence.frequency === 'MONTHLY' ? 'Mensal' :
                                                recurrence.frequency === 'WEEKLY' ? 'Semanal' :
                                                    recurrence.frequency === 'YEARLY' ? 'Anual' : recurrence.frequency}
                                        </TableCell>
                                        <TableCell align="right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(recurrence.amount)}
                                        </TableCell>
                                        <TableCell>
                                            {recurrence.nextDate ? new Date(recurrence.nextDate).toLocaleDateString('pt-BR') : '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton onClick={() => handleOpen(recurrence)} color="primary">
                                                <Edit />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(recurrence.id)} color="error">
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {recurrences.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            Nenhuma recorrência cadastrada.
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
                    <DialogTitle>{editingRecurrence ? 'Editar Recorrência' : 'Nova Recorrência'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
                            <Controller
                                name="description"
                                control={control}
                                rules={{ required: 'Descrição é obrigatória' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Descrição"
                                        fullWidth
                                        error={!!error}
                                        helperText={error?.message}
                                    />
                                )}
                            />
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Tipo"
                                        fullWidth
                                    >
                                        <MenuItem value="INCOME">Receita</MenuItem>
                                        <MenuItem value="EXPENSE">Despesa</MenuItem>
                                    </TextField>
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
                                        {categories
                                            .filter((c: any) => {
                                                // Filter categories by type
                                                const catType = c.type === 'Receita' ? 'INCOME' : (c.type === 'Despesa' ? 'EXPENSE' : c.type);
                                                return catType === selectedType;
                                            })
                                            .map((category: any) => (
                                                <MenuItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </MenuItem>
                                            ))}
                                    </TextField>
                                )}
                            />
                            <Controller
                                name="frequency"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Frequência"
                                        fullWidth
                                    >
                                        <MenuItem value="WEEKLY">Semanal</MenuItem>
                                        <MenuItem value="MONTHLY">Mensal</MenuItem>
                                        <MenuItem value="YEARLY">Anual</MenuItem>
                                    </TextField>
                                )}
                            />
                            <Controller
                                name="amount"
                                control={control}
                                rules={{ required: 'Valor é obrigatório', min: { value: 0.01, message: 'Valor deve ser maior que zero' } }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Valor"
                                        type="number"
                                        fullWidth
                                        error={!!error}
                                        helperText={error?.message}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                )}
                            />
                            <Controller
                                name="startDate"
                                control={control}
                                rules={{ required: 'Data de início é obrigatória' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Data de Início"
                                        type="date"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!error}
                                        helperText={error?.message}
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
