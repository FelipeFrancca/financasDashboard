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
    Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { recurrenceService, categoryService } from '../services/api';
import { showSuccess, showError, showConfirm } from '../utils/notifications';

export default function RecurrencesPage() {
    const [open, setOpen] = useState(false);
    const [editingRecurrence, setEditingRecurrence] = useState<any>(null);
    const [formData, setFormData] = useState({
        description: '',
        amount: 0,
        type: 'EXPENSE',
        categoryId: '',
        frequency: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
    });

    const { data: recurrences = [], refetch } = useQuery({
        queryKey: ['recurrences'],
        queryFn: recurrenceService.getAll,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: categoryService.getAll,
    });



    const handleOpen = (recurrence?: any) => {

        if (recurrence) {
            // MAPPING: Backend (entryType/category) -> Frontend (type/categoryId)
            const type = recurrence.entryType === 'Receita' ? 'INCOME' : 'EXPENSE';

            // Find category ID by name
            const categoryObj = categories.find((c: any) => c.name === recurrence.category);
            const categoryId = categoryObj ? categoryObj.id : '';

            setEditingRecurrence(recurrence);
            setFormData({
                description: recurrence.description,
                amount: recurrence.amount,
                type: type,
                categoryId: categoryId,
                frequency: recurrence.frequency,
                startDate: recurrence.startDate ? new Date(recurrence.startDate).toISOString().split('T')[0] : '',
            });
        } else {
            setEditingRecurrence(null);
            setFormData({
                description: '',
                amount: 0,
                type: 'EXPENSE',
                categoryId: '',
                frequency: 'MONTHLY',
                startDate: new Date().toISOString().split('T')[0],
            });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            // MAPPING: Frontend (type/categoryId) -> Backend (entryType/category)
            const entryType = formData.type === 'INCOME' ? 'Receita' : 'Despesa';

            const categoryObj = categories.find((c: any) => c.id === formData.categoryId);
            const categoryName = categoryObj ? categoryObj.name : 'Outros';

            const payload = {
                description: formData.description,
                amount: formData.amount,
                entryType: entryType,
                flowType: 'Fixa', // Default value required by schema
                category: categoryName,
                frequency: formData.frequency,
                startDate: new Date(formData.startDate).toISOString(),
            };

            if (editingRecurrence) {
                await recurrenceService.update(editingRecurrence.id, payload);
            } else {
                await recurrenceService.create(payload);
            }
            setOpen(false);
            refetch();
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
                await recurrenceService.delete(id);
                refetch();
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700}>
                    Recorrências
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
                    Nova Recorrência
                </Button>
            </Box>

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
                <DialogTitle>{editingRecurrence ? 'Editar Recorrência' : 'Nova Recorrência'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
                        <TextField
                            label="Descrição"
                            fullWidth
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <TextField
                            select
                            label="Tipo"
                            fullWidth
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <MenuItem value="INCOME">Receita</MenuItem>
                            <MenuItem value="EXPENSE">Despesa</MenuItem>
                        </TextField>
                        <TextField
                            select
                            label="Categoria"
                            fullWidth
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        >
                            {categories
                                .filter((c: any) => {
                                    // Filter categories by type
                                    const catType = c.type === 'Receita' ? 'INCOME' : (c.type === 'Despesa' ? 'EXPENSE' : c.type);
                                    return catType === formData.type;
                                })
                                .map((category: any) => (
                                    <MenuItem key={category.id} value={category.id}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                        </TextField>
                        <TextField
                            select
                            label="Frequência"
                            fullWidth
                            value={formData.frequency}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        >
                            <MenuItem value="WEEKLY">Semanal</MenuItem>
                            <MenuItem value="MONTHLY">Mensal</MenuItem>
                            <MenuItem value="YEARLY">Anual</MenuItem>
                        </TextField>
                        <TextField
                            label="Valor"
                            type="number"
                            fullWidth
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        />
                        <TextField
                            label="Data de Início"
                            type="date"
                            fullWidth
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
