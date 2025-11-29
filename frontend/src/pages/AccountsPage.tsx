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
import { Add, Edit, Delete } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { accountService } from '../services/api';
import { showSuccess, showError, showConfirm } from '../utils/notifications';

// Função para traduzir tipos de conta
const translateAccountType = (type: string): string => {
    const types: Record<string, string> = {
        'CHECKING': 'Conta Corrente',
        'SAVINGS': 'Poupança',
        'CREDIT_CARD': 'Cartão de Crédito',
        'INVESTMENT': 'Investimento',
        'CASH': 'Dinheiro',
        'OTHER': 'Outro',
    };
    return types[type] || type;
};

export default function AccountsPage() {
    const [open, setOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'CHECKING',
        initialBalance: 0,
        institution: '',
        color: '#000000',
    });

    const { data: accounts = [], refetch } = useQuery({
        queryKey: ['accounts'],
        queryFn: accountService.getAll,
    });

    const handleOpen = (account?: any) => {
        if (account) {
            setEditingAccount(account);
            setFormData({
                name: account.name,
                type: account.type,
                initialBalance: account.currentBalance || account.initialBalance || 0,
                institution: account.institution || '',
                color: account.color || '#000000',
            });
        } else {
            setEditingAccount(null);
            setFormData({
                name: '',
                type: 'CHECKING',
                initialBalance: 0,
                institution: '',
                color: '#000000',
            });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            const dataToSend = {
                ...formData,
                currentBalance: formData.initialBalance,
            };

            if (editingAccount) {
                await accountService.update(editingAccount.id, dataToSend);
            } else {
                await accountService.create(dataToSend);
            }
            setOpen(false);
            refetch();
            showSuccess(`Conta ${editingAccount ? 'atualizada' : 'criada'} com sucesso!`, { title: 'Sucesso', timer: 1500 });
        } catch (error) {
            showError(error, { title: 'Erro', text: 'Não foi possível salvar a conta.' });
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
                await accountService.delete(id);
                refetch();
                showSuccess('A conta foi excluída.', { title: 'Excluído!' });
            } catch (error) {
                showError(error, { title: 'Erro', text: 'Não foi possível excluir a conta.' });
            }
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700}>
                    Contas Bancárias
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
                    Nova Conta
                </Button>
            </Box>

            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nome</TableCell>
                                    <TableCell>Banco</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell align="right">Saldo</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {accounts.map((account: any) => (
                                    <TableRow key={account.id}>
                                        <TableCell>{account.name}</TableCell>
                                        <TableCell>{account.institution || '-'}</TableCell>
                                        <TableCell>{translateAccountType(account.type)}</TableCell>
                                        <TableCell align="right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.currentBalance || 0)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton onClick={() => handleOpen(account)} color="primary">
                                                <Edit />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(account.id)} color="error">
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {accounts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            Nenhuma conta cadastrada.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Dialog open={open} onClose={() => setOpen(false)} disableEnforceFocus>
                <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
                        <TextField
                            label="Nome"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            label="Banco/Instituição"
                            fullWidth
                            value={formData.institution}
                            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                        />
                        <TextField
                            select
                            label="Tipo"
                            fullWidth
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <MenuItem value="CHECKING">Conta Corrente</MenuItem>
                            <MenuItem value="SAVINGS">Poupança</MenuItem>
                            <MenuItem value="CREDIT_CARD">Cartão de Crédito</MenuItem>
                            <MenuItem value="INVESTMENT">Investimento</MenuItem>
                            <MenuItem value="CASH">Dinheiro</MenuItem>
                            <MenuItem value="OTHER">Outro</MenuItem>
                        </TextField>
                        <TextField
                            label="Saldo Atual"
                            type="number"
                            fullWidth
                            value={formData.initialBalance}
                            onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
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
