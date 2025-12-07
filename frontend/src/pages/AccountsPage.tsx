import { useState } from 'react';
import { useParams } from 'react-router-dom';
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
    Typography,
    useTheme,
} from '@mui/material';
import { Edit, Delete, AccountBalance } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import AccountForm from '../components/AccountForm';
import { showSuccess, showErrorWithRetry, showConfirm } from '../utils/notifications';
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

export default function AccountsPage() {
    const { dashboardId } = useParams<{ dashboardId: string }>();
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);

    // Hooks
    const { data: accounts = [], isLoading } = useAccounts(dashboardId || '');
    const createAccount = useCreateAccount();
    const updateAccount = useUpdateAccount();
    const deleteAccount = useDeleteAccount();

    const handleOpen = (account?: any) => {
        setEditingAccount(account || null);
        setOpen(true);
    };

    const handleSave = async (data: any) => {
        try {
            if (editingAccount) {
                await updateAccount.mutateAsync({ id: editingAccount.id, data, dashboardId: dashboardId || '' });
                showSuccess('Conta atualizada com sucesso!');
            } else {
                await createAccount.mutateAsync({ data, dashboardId: dashboardId || '' });
                showSuccess('Conta criada com sucesso!');
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
                await deleteAccount.mutateAsync({ id, dashboardId: dashboardId || '' });
                showSuccess('Conta excluída com sucesso!');
            } catch (error) {
                showErrorWithRetry(error, () => handleDelete(id));
            }
        }
    };

    const hasData = accounts.length > 0;

    if (!isLoading && !hasData) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <PageHeader
                    title="Contas Bancárias"
                    breadcrumbs={[
                        { label: 'Dashboards', to: '/dashboards' },
                        { label: 'Contas' }
                    ]}
                    actionLabel="Nova Conta"
                    onAction={() => handleOpen()}
                />
                <EmptyState
                    icon={<AccountBalance sx={{ fontSize: '80px' }} />}
                    title="Nenhuma conta cadastrada"
                    description="Cadastre suas contas bancárias para gerenciar seu saldo."
                    actions={[
                        {
                            label: 'Nova Conta',
                            onClick: () => handleOpen(),
                            variant: 'contained',
                        },
                    ]}
                />
                <AccountForm
                    open={open}
                    account={editingAccount}
                    onClose={() => setOpen(false)}
                    onSave={handleSave}
                />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
                                    <TableRow key={account.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '50%',
                                                        bgcolor: account.color || theme.palette.primary.main,
                                                        border: '1px solid',
                                                        borderColor: 'divider'
                                                    }}
                                                />
                                                {account.name}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{account.institution || '-'}</TableCell>
                                        <TableCell>{translateAccountType(account.type)}</TableCell>
                                        <TableCell align="right">
                                            <Typography
                                                fontWeight={600}
                                                color={account.currentBalance >= 0 ? 'success.main' : 'error.main'}
                                            >
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.currentBalance || 0)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton onClick={() => handleOpen(account)} color="primary" size="small">
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(account.id)} color="error" size="small">
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <AccountForm
                open={open}
                account={editingAccount}
                onClose={() => setOpen(false)}
                onSave={handleSave}
            />
        </Container>
    );
}
