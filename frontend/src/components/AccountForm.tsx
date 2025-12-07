import { useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    InputAdornment,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

interface AccountFormData {
    name: string;
    type: string;
    initialBalance: number;
    institution: string;
    color: string;
}

interface AccountFormProps {
    open: boolean;
    account: any;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

const defaultValues: AccountFormData = {
    name: '',
    type: 'CHECKING',
    initialBalance: 0,
    institution: '',
    color: '#000000',
};

export default function AccountForm({ open, account, onClose, onSave }: AccountFormProps) {
    const { control, handleSubmit, reset } = useForm<AccountFormData>({
        defaultValues
    });

    useEffect(() => {
        if (open) {
            if (account) {
                reset({
                    name: account.name,
                    type: account.type,
                    initialBalance: account.currentBalance || account.initialBalance || 0,
                    institution: account.institution || '',
                    color: account.color || '#000000',
                });
            } else {
                reset(defaultValues);
            }
        }
    }, [open, account, reset]);

    const onSubmit = async (data: AccountFormData) => {
        await onSave({
            ...data,
            currentBalance: data.initialBalance,
        });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogTitle>{account ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
                            name="institution"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Banco/Instituição"
                                    fullWidth
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
                                    <MenuItem value="CHECKING">Conta Corrente</MenuItem>
                                    <MenuItem value="SAVINGS">Poupança</MenuItem>
                                    <MenuItem value="CREDIT_CARD">Cartão de Crédito</MenuItem>
                                    <MenuItem value="INVESTMENT">Investimento</MenuItem>
                                    <MenuItem value="CASH">Dinheiro</MenuItem>
                                    <MenuItem value="OTHER">Outro</MenuItem>
                                </TextField>
                            )}
                        />
                        <Controller
                            name="initialBalance"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Saldo Atual"
                                    type="number"
                                    fullWidth
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                    }}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                            )}
                        />
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
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="contained">
                        Salvar
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
