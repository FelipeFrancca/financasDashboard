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
} from '@mui/material';
import { Add, Delete, ArrowForward } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { transferService, accountService } from '../services/api';
import { showSuccess, showError, showConfirm } from '../utils/notifications';

export default function TransfersPage() {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        fromAccountId: '',
        toAccountId: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
    });

    const { data: transfers = [], refetch } = useQuery({
        queryKey: ['transfers'],
        queryFn: transferService.getAll,
    });

    const { data: accounts = [] } = useQuery({
        queryKey: ['accounts'],
        queryFn: accountService.getAll,
    });

    console.log('🔍 [TransfersPage] Loaded transfers:', transfers);

    const handleOpen = () => {
        setFormData({
            fromAccountId: '',
            toAccountId: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            description: '',
        });
        setOpen(true);
    };

    const handleSave = async () => {
        if (formData.fromAccountId === formData.toAccountId) {
            showError('A conta de origem e destino devem ser diferentes.', { title: 'Erro' });
            return;
        }

        try {
            const data = {
                ...formData,
                date: new Date(formData.date).toISOString(),
            };
            console.log('🔍 [TransfersPage] Saving transfer:', data);
            await transferService.create(data);
            setOpen(false);
            refetch();
            showSuccess('Transferência realizada com sucesso!', { title: 'Sucesso', timer: 1500 });
        } catch (error) {
            console.error('Error creating transfer:', error);
            showError(error, { title: 'Erro', text: 'Não foi possível realizar a transferência.' });
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
                await transferService.delete(id);
                refetch();
                showSuccess('A transferência foi revertida.', { title: 'Revertido!' });
            } catch (error) {
                showError(error, { title: 'Erro', text: 'Não foi possível reverter a transferência.' });
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700}>
                    Transferências
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
                    Nova Transferência
                </Button>
            </Box>

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
                <DialogTitle>Nova Transferência</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
                        <TextField
                            select
                            label="Conta de Origem"
                            fullWidth
                            value={formData.fromAccountId}
                            onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                        >
                            {accounts.map((account: any) => (
                                <MenuItem key={account.id} value={account.id}>
                                    {account.name} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)})
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            label="Conta de Destino"
                            fullWidth
                            value={formData.toAccountId}
                            onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                        >
                            {accounts.map((account: any) => (
                                <MenuItem key={account.id} value={account.id}>
                                    {account.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Valor"
                            type="number"
                            fullWidth
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        />
                        <TextField
                            label="Data"
                            type="date"
                            fullWidth
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Descrição"
                            fullWidth
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave}>
                        Transferir
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
