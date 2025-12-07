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
} from '@mui/material';
import { Delete, ArrowForward } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { showSuccess, showError, showErrorWithRetry, showConfirm } from '../utils/notifications';
import { useForm, Controller } from 'react-hook-form';
import {
    useTransfers,
    useCreateTransfer,
    useDeleteTransfer
} from '../hooks/api/useTransfers';
import { useAccounts } from '../hooks/api/useAccounts';

interface TransferFormData {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    description: string;
}

const defaultValues: TransferFormData = {
    fromAccountId: '',
    toAccountId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
};

import { useParams } from 'react-router-dom';

// ... imports

export default function TransfersPage() {
    const { dashboardId } = useParams<{ dashboardId: string }>();
    const [open, setOpen] = useState(false);

    // Hooks
    const { data: transfers = [] } = useTransfers(dashboardId || '');
    const { data: accounts = [] } = useAccounts(dashboardId || '');
    const createTransfer = useCreateTransfer();
    const deleteTransfer = useDeleteTransfer();

    const { control, handleSubmit, reset } = useForm<TransferFormData>({
        defaultValues
    });

    const handleOpen = () => {
        reset(defaultValues);
        setOpen(true);
    };

    const onSubmit = async (data: TransferFormData) => {
        if (data.fromAccountId === data.toAccountId) {
            showError('A conta de origem e destino devem ser diferentes.', { title: 'Erro' });
            return;
        }

        try {
            const payload = {
                ...data,
                date: new Date(data.date).toISOString(),
            };
            await createTransfer.mutateAsync({ data: payload, dashboardId: dashboardId || '' });
            setOpen(false);
            showSuccess('Transferência realizada com sucesso!', { title: 'Sucesso', timer: 1500 });
        } catch (error) {
            console.error('Error creating transfer:', error);
            showErrorWithRetry(error, () => onSubmit(data));
        }
    };

    const handleDelete = async (id: string) => {
        const result = await showConfirm(
            'Esta ação irá reverter a transferência.',
            {
                title: 'Tem certeza?',
                icon: 'warning',
                confirmButtonText: 'Sim, reverter',
                cancelButtonText: 'Cancelar',
            }
        );

        if (result.isConfirmed) {
            try {
                await deleteTransfer.mutateAsync({ id, dashboardId: dashboardId || '' });
                showSuccess('A transferência foi revertida.', { title: 'Revertido!' });
            } catch (error) {
                showErrorWithRetry(error, () => handleDelete(id));
            }
        }
    };

    const getAccountName = (id: string) => {
        const account = accounts.find((a: any) => a.id === id);
        return account ? account.name : 'Desconhecida';
    };

    // Filter to show only 'Despesa' (Debit) transactions to avoid duplicates
    // and ensure we display the logical transfer from Source to Destination
    const displayTransfers = Array.isArray(transfers)
        ? transfers.filter((t: any) => t.entryType === 'Despesa' && t.category === 'Transferência')
        : [];

    return (
        <Container maxWidth="lg">
            <PageHeader
                title="Transferências"
                breadcrumbs={[
                    { label: 'Dashboards', to: '/dashboards' },
                    { label: 'Transferências' }
                ]}
                actionLabel="Nova Transferência"
                onAction={handleOpen}
            />

            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Data</TableCell>
                                    <TableCell>Origem</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell>Destino</TableCell>
                                    <TableCell>Descrição</TableCell>
                                    <TableCell align="right">Valor</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {displayTransfers.map((transfer: any) => (
                                    <TableRow key={transfer.id}>
                                        <TableCell>{new Date(transfer.date).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>{getAccountName(transfer.accountId)}</TableCell>
                                        <TableCell><ArrowForward color="action" fontSize="small" /></TableCell>
                                        <TableCell>{getAccountName(transfer.transferToAccountId)}</TableCell>
                                        <TableCell>{transfer.description}</TableCell>
                                        <TableCell align="right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transfer.amount)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton onClick={() => handleDelete(transfer.id)} color="error" title="Reverter">
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {displayTransfers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            Nenhuma transferência registrada.
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
                    <DialogTitle>Nova Transferência</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
                            <Controller
                                name="fromAccountId"
                                control={control}
                                rules={{ required: 'Conta de origem é obrigatória' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Conta de Origem"
                                        fullWidth
                                        error={!!error}
                                        helperText={error?.message}
                                    >
                                        {accounts.map((account: any) => (
                                            <MenuItem key={account.id} value={account.id}>
                                                {account.name} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                            <Controller
                                name="toAccountId"
                                control={control}
                                rules={{ required: 'Conta de destino é obrigatória' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Conta de Destino"
                                        fullWidth
                                        error={!!error}
                                        helperText={error?.message}
                                    >
                                        {accounts.map((account: any) => (
                                            <MenuItem key={account.id} value={account.id}>
                                                {account.name}
                                            </MenuItem>
                                        ))}
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
                                name="date"
                                control={control}
                                rules={{ required: 'Data é obrigatória' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Data"
                                        type="date"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!error}
                                        helperText={error?.message}
                                    />
                                )}
                            />
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Descrição"
                                        fullWidth
                                    />
                                )}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" variant="contained">
                            Transferir
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
}
