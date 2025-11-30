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
import {
    useCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory
} from '../hooks/api/useCategories';

export default function CategoriesPage() {
    const [open, setOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'EXPENSE',
        color: '#000000',
        icon: '',
    });

    // Hooks
    const { data: categories = [] } = useCategories();
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();

    // Normalize type values from backend (can be "Receita"/"Despesa" or "INCOME"/"EXPENSE")
    const normalizeType = (type: string) => {
        if (type === 'Receita') return 'INCOME';
        if (type === 'Despesa') return 'EXPENSE';
        return type;
    };

    const handleOpen = (category?: any) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                type: normalizeType(category.type),
                color: category.color || '#000000',
                icon: category.icon || '',
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                type: 'EXPENSE',
                color: '#000000',
                icon: '',
            });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            // Converter tipo de volta para português antes de enviar ao backend
            const dataToSend = {
                ...formData,
                type: formData.type === 'INCOME' ? 'Receita' : 'Despesa',
            };

            if (editingCategory) {
                await updateCategory.mutateAsync({ id: editingCategory.id, data: dataToSend });
            } else {
                await createCategory.mutateAsync(dataToSend);
            }
            setOpen(false);
            showSuccess(`Categoria ${editingCategory ? 'atualizada' : 'criada'} com sucesso!`, { title: 'Sucesso', timer: 1500 });
        } catch (error) {
            showError(error, { title: 'Erro', text: 'Não foi possível salvar a categoria.' });
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
                await deleteCategory.mutateAsync(id);
                showSuccess('A categoria foi excluída.', { title: 'Excluído!' });
            } catch (error) {
                showError(error, { title: 'Erro', text: 'Não foi possível excluir a categoria.' });
            }
        }
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title="Categorias"
                breadcrumbs={[
                    { label: 'Dashboards', to: '/dashboards' },
                    { label: 'Categorias' }
                ]}
                actionLabel="Nova Categoria"
                onAction={() => handleOpen()}
            />

            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nome</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {categories.map((category: any) => {
                                    const type = normalizeType(category.type);
                                    return (
                                        <TableRow key={category.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: category.color }} />
                                                    {category.name}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={type === 'INCOME' ? 'Receita' : 'Despesa'}
                                                    color={type === 'INCOME' ? 'success' : 'error'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton onClick={() => handleOpen(category)} color="primary">
                                                    <Edit />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(category.id)} color="error">
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {categories.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">
                                            Nenhuma categoria cadastrada.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Dialog open={open} onClose={() => setOpen(false)} disableEnforceFocus>
                <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
                        <TextField
                            label="Nome"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                            label="Cor (Hex)"
                            fullWidth
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
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
