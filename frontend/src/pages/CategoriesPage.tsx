import { useState } from 'react';
import {
    Box,
    Container,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    useTheme,
} from '@mui/material';
import { Edit, Delete, Category as CategoryIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import CategoryForm from '../components/CategoryForm';
import { showSuccess, showErrorWithRetry, showConfirm } from '../utils/notifications';
import {
    useCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory
} from '../hooks/api/useCategories';
import { useDashboardPermissions } from '../hooks/api/useDashboardPermissions';

export default function CategoriesPage() {
    const { dashboardId } = useParams<{ dashboardId: string }>();
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);

    // Hooks
    const { data: categories = [], isLoading } = useCategories(dashboardId || '');
    const { canEdit } = useDashboardPermissions();
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();

    // Normalize type values from backend
    const normalizeType = (type: string) => {
        if (type === 'Receita') return 'INCOME';
        if (type === 'Despesa') return 'EXPENSE';
        return type;
    };

    const handleOpen = (category?: any) => {
        setEditingCategory(category || null);
        setOpen(true);
    };

    const handleSave = async (data: any) => {
        try {
            if (editingCategory) {
                await updateCategory.mutateAsync({ id: editingCategory.id, data, dashboardId: dashboardId || '' });
                showSuccess('Categoria atualizada com sucesso!');
            } else {
                await createCategory.mutateAsync({ data, dashboardId: dashboardId || '' });
                showSuccess('Categoria criada com sucesso!');
            }
            setOpen(false);
        } catch (error) {
            showErrorWithRetry(error, () => handleSave(data));
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
                confirmButtonColor: theme.palette.error.main,
            }
        );

        if (result.isConfirmed) {
            try {
                await deleteCategory.mutateAsync({ id, dashboardId: dashboardId || '' });
                showSuccess('Categoria excluída com sucesso!');
            } catch (error) {
                showErrorWithRetry(error, () => handleDelete(id));
            }
        }
    };

    const hasData = categories.length > 0;

    if (!isLoading && !hasData) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <PageHeader
                    title="Categorias"
                    breadcrumbs={[
                        { label: 'Dashboards', to: '/dashboards' },
                        { label: 'Categorias' }
                    ]}
                    actionLabel={canEdit ? "Nova Categoria" : undefined}
                    onAction={canEdit ? () => handleOpen() : undefined}
                />
                <EmptyState
                    icon={<CategoryIcon sx={{ fontSize: '80px' }} />}
                    title="Nenhuma categoria cadastrada"
                    description={canEdit 
                        ? "Crie categorias para organizar suas transações."
                        : "Nenhuma categoria foi criada neste dashboard ainda."
                    }
                    actions={canEdit ? [
                        {
                            label: 'Nova Categoria',
                            onClick: () => handleOpen(),
                            variant: 'contained',
                        },
                    ] : []}
                />
                <CategoryForm
                    open={open}
                    category={editingCategory}
                    onClose={() => setOpen(false)}
                    onSave={handleSave}
                />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <PageHeader
                title="Categorias"
                breadcrumbs={[
                    { label: 'Dashboards', to: '/dashboards' },
                    { label: 'Categorias' }
                ]}
                actionLabel={canEdit ? "Nova Categoria" : undefined}
                onAction={canEdit ? () => handleOpen() : undefined}
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
                                        <TableRow key={category.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box
                                                        sx={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: '50%',
                                                            bgcolor: category.color,
                                                            border: '1px solid',
                                                            borderColor: 'divider'
                                                        }}
                                                    />
                                                    {category.name}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={type === 'INCOME' ? 'Receita' : 'Despesa'}
                                                    color={type === 'INCOME' ? 'success' : 'error'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                {canEdit && (
                                                    <>
                                                        <IconButton onClick={() => handleOpen(category)} color="primary" size="small">
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                        <IconButton onClick={() => handleDelete(category.id)} color="error" size="small">
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <CategoryForm
                open={open}
                category={editingCategory}
                onClose={() => setOpen(false)}
                onSave={handleSave}
            />
        </Container>
    );
}
