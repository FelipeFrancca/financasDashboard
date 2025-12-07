import { useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

interface CategoryFormData {
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color: string;
    icon: string;
}

interface CategoryFormProps {
    open: boolean;
    category: any;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

const defaultValues: CategoryFormData = {
    name: '',
    type: 'EXPENSE',
    color: '#000000',
    icon: '',
};

export default function CategoryForm({ open, category, onClose, onSave }: CategoryFormProps) {
    const { control, handleSubmit, reset } = useForm<CategoryFormData>({
        defaultValues
    });

    useEffect(() => {
        if (open) {
            if (category) {
                reset({
                    name: category.name,
                    type: category.type === 'Receita' ? 'INCOME' : (category.type === 'Despesa' ? 'EXPENSE' : category.type),
                    color: category.color || '#000000',
                    icon: category.icon || '',
                });
            } else {
                reset(defaultValues);
            }
        }
    }, [open, category, reset]);

    const onSubmit = async (data: CategoryFormData) => {
        await onSave({
            ...data,
            type: data.type === 'INCOME' ? 'Receita' : 'Despesa',
        });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogTitle>{category ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Controller
                                name="name"
                                control={control}
                                rules={{ required: 'Nome é obrigatório' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Nome"
                                        error={!!error}
                                        helperText={error?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select fullWidth label="Tipo">
                                        <MenuItem value="INCOME">Receita</MenuItem>
                                        <MenuItem value="EXPENSE">Despesa</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="color"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="color"
                                        label="Cor"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="contained">Salvar</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
