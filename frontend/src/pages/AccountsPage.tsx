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
import { Edit, Delete } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { showSuccess, showError, showConfirm } from '../utils/notifications';
import { useForm, Controller } from 'react-hook-form';
import {
    useAccounts,
    useCreateAccount,
    useUpdateAccount,
    useDeleteAccount
} from '../hooks/api/useAccounts';

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

interface AccountFormData {
    name: string;
    type: string;
    initialBalance: number;
    institution: string;
    color: string;
}

const defaultValues: AccountFormData = {
    name: '',
    type: 'CHECKING',
    initialBalance: 0,
    institution: '',
    color: '#000000',
};

export default function AccountsPage() {
    const [open, setOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);

    // Hooks
    const { data: accounts = [] } = useAccounts();
    const createAccount = useCreateAccount();
    const updateAccount = useUpdateAccount();
    const deleteAccount = useDeleteAccount();

    const { control, handleSubmit, reset } = useForm<AccountFormData>({
        defaultValues
    });

    const handleOpen = (account?: any) => {
        if (account) {
            setEditingAccount(account);
            reset({
                name: account.name,
                type: account.type,
                initialBalance: account.currentBalance || account.initialBalance || 0,
                institution: account.institution || '',
                color: account.color || '#000000',
            });
        } else {
            setEditingAccount(null);
            reset(defaultValues);
        }
        setOpen(true);
    };

    const onSubmit = async (data: AccountFormData) => {
        try {
            const dataToSend = {
                ...data,
                currentBalance: data.initialBalance,
            };

            if (editingAccount) {
                await updateAccount.mutateAsync({ id: editingAccount.id, data: dataToSend });
            } else {
                await createAccount.mutateAsync(dataToSend);
            }
            setOpen(false);
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
                await deleteAccount.mutateAsync(id);
                showSuccess('A conta foi excluída.', { title: 'Excluído!' });
            } catch (error) {
                showError(error, { title: 'Erro', text: 'Não foi possível excluir a conta.' });
            }
        }
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title="Contas Bancárias"
                breadcrumbs={[
                    { label: 'Dashboards', to: '/dashboards' },
                    { label: 'Contas' }
                ]}
                actionLabel="Nova Conta"
                onAction={() => handleOpen()}
            />

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
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
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
