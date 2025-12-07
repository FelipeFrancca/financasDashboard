import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Card,
    CardContent,
    CardHeader,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Avatar,
    Chip,
    Box,
    Typography,
    Tooltip,
    Stack,
} from '@mui/material';
import {
    PersonAdd,
    Delete,
    ContentCopy,
    Group,
    Share,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { showSuccess, showErrorWithRetry, showConfirm } from '../utils/notifications';
import { useForm, Controller } from 'react-hook-form';
import {
    useDashboardMembers,
    useAddDashboardMember,
    useRemoveDashboardMember,
    type DashboardMember,
} from '../hooks/api/useDashboardMembers';
import { dashboardService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { fadeIn, hoverLift } from '../utils/animations';

interface AddMemberFormData {
    email: string;
    role: 'VIEWER' | 'EDITOR';
}

const defaultValues: AddMemberFormData = {
    email: '',
    role: 'VIEWER',
};

const translateRole = (role: string): string => {
    const roles: Record<string, string> = {
        'OWNER': 'Proprietário',
        'EDITOR': 'Editor',
        'VIEWER': 'Visualizador',
    };
    return roles[role] || role;
};

const getRoleColor = (role: string): 'error' | 'warning' | 'info' => {
    switch (role) {
        case 'OWNER': return 'error';
        case 'EDITOR': return 'warning';
        default: return 'info';
    }
};

export default function MembersPage() {
    const { dashboardId } = useParams<{ dashboardId: string }>();
    const { user: currentUser } = useAuth();
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);

    // Hooks
    const { data: members = [], isLoading } = useDashboardMembers(dashboardId || '');
    const addMember = useAddDashboardMember();
    const removeMember = useRemoveDashboardMember();

    const { control, handleSubmit, reset } = useForm<AddMemberFormData>({
        defaultValues
    });

    // Check if current user is owner
    const isOwner = members.some(
        (m: DashboardMember) => m.user.id === currentUser?.id && m.role === 'OWNER'
    ) || members.length === 0;

    const handleAddMember = async (data: AddMemberFormData) => {
        try {
            await addMember.mutateAsync({
                dashboardId: dashboardId || '',
                email: data.email,
                role: data.role,
            });
            setAddMemberOpen(false);
            reset(defaultValues);
            showSuccess('Membro adicionado com sucesso!', { title: 'Sucesso' });
        } catch (error: any) {
            showErrorWithRetry(error, () => handleAddMember(data));
        }
    };

    const handleRemoveMember = async (userId: string, userName: string) => {
        const result = await showConfirm(
            `Tem certeza que deseja remover ${userName} do dashboard?`,
            {
                title: 'Remover membro?',
                icon: 'warning',
                confirmButtonText: 'Sim, remover',
                cancelButtonText: 'Cancelar',
            }
        );

        if (result.isConfirmed) {
            try {
                await removeMember.mutateAsync({
                    dashboardId: dashboardId || '',
                    userId,
                });
                showSuccess('Membro removido com sucesso!', { title: 'Removido!' });
            } catch (error) {
                showErrorWithRetry(error, () => handleRemoveMember(userId, userName));
            }
        }
    };

    const handleCreateInvite = async () => {
        setInviteLoading(true);
        try {
            const invite = await dashboardService.createInvite(dashboardId || '', {
                role: 'VIEWER',
                isOneTime: false,
            });
            const link = `${window.location.origin}/shared/${invite.code}`;
            setInviteLink(link);
            setInviteDialogOpen(true);
        } catch (error) {
            showErrorWithRetry(error, () => handleCreateInvite());
        } finally {
            setInviteLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        showSuccess('Link copiado para a área de transferência!', { title: 'Copiado!' });
    };

    if (isLoading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <PageHeader
                    title="Membros"
                    breadcrumbs={[
                        { label: 'Dashboards', to: '/dashboards' },
                        { label: 'Membros' }
                    ]}
                />
                <LoadingSkeleton variant="table" count={3} />
            </Container>
        );
    }

    if (members.length === 0) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <PageHeader
                    title="Membros"
                    breadcrumbs={[
                        { label: 'Dashboards', to: '/dashboards' },
                        { label: 'Membros' }
                    ]}
                />
                <EmptyState
                    icon={<Group sx={{ fontSize: '80px' }} />}
                    title="Nenhum membro encontrado"
                    description="Você é o único membro deste dashboard. Convide outras pessoas para colaborar!"
                    actions={[
                        {
                            label: 'Convidar Membro',
                            onClick: () => setAddMemberOpen(true),
                            variant: 'contained',
                            startIcon: <PersonAdd />,
                        },
                        {
                            label: 'Gerar Link de Convite',
                            onClick: handleCreateInvite,
                            variant: 'outlined',
                            startIcon: <Share />,
                        },
                    ]}
                />

                {/* Add Member Dialog */}
                <Dialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)}>
                    <form onSubmit={handleSubmit(handleAddMember)}>
                        <DialogTitle>Adicionar Membro</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 350 }}>
                                <Controller
                                    name="email"
                                    control={control}
                                    rules={{
                                        required: 'Email é obrigatório',
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Email inválido'
                                        }
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="Email do usuário"
                                            type="email"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message}
                                            placeholder="email@exemplo.com"
                                        />
                                    )}
                                />
                                <Controller
                                    name="role"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            label="Permissão"
                                            fullWidth
                                        >
                                            <MenuItem value="VIEWER">Visualizador - Apenas visualiza</MenuItem>
                                            <MenuItem value="EDITOR">Editor - Pode editar dados</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setAddMemberOpen(false)}>Cancelar</Button>
                            <Button type="submit" variant="contained" disabled={addMember.isPending}>
                                Adicionar
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <PageHeader
                title="Membros"
                breadcrumbs={[
                    { label: 'Dashboards', to: '/dashboards' },
                    { label: 'Membros' }
                ]}
            />

            <Card sx={{ ...fadeIn }}>
                <CardHeader
                    avatar={<Group color="primary" />}
                    title="Membros do Dashboard"
                    titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                    action={
                        isOwner && (
                            <Stack direction="row" spacing={1}>
                                <Button
                                    startIcon={<Share />}
                                    onClick={handleCreateInvite}
                                    variant="outlined"
                                    size="small"
                                    disabled={inviteLoading}
                                >
                                    Gerar Link
                                </Button>
                                <Button
                                    startIcon={<PersonAdd />}
                                    onClick={() => setAddMemberOpen(true)}
                                    variant="contained"
                                    size="small"
                                >
                                    Adicionar
                                </Button>
                            </Stack>
                        )
                    }
                />
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Usuário</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Permissão</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {members.map((member: DashboardMember) => (
                                    <TableRow
                                        key={member.id}
                                        sx={{
                                            ...hoverLift,
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                            },
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar
                                                    src={member.user.avatar}
                                                    alt={member.user.name}
                                                    sx={{ width: 40, height: 40 }}
                                                >
                                                    {member.user.name?.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={600}>
                                                        {member.user.name}
                                                    </Typography>
                                                    {member.user.id === currentUser?.id && (
                                                        <Typography variant="caption" color="primary">
                                                            Você
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{member.user.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={translateRole(member.role)}
                                                size="small"
                                                color={getRoleColor(member.role)}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            {isOwner && member.role !== 'OWNER' && member.user.id !== currentUser?.id && (
                                                <Tooltip title="Remover membro">
                                                    <IconButton
                                                        onClick={() => handleRemoveMember(member.user.id, member.user.name)}
                                                        color="error"
                                                        size="small"
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {member.role === 'OWNER' && (
                                                <Typography variant="caption" color="text.secondary">
                                                    —
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Add Member Dialog */}
            <Dialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)}>
                <form onSubmit={handleSubmit(handleAddMember)}>
                    <DialogTitle>Adicionar Membro</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 350 }}>
                            <Controller
                                name="email"
                                control={control}
                                rules={{
                                    required: 'Email é obrigatório',
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: 'Email inválido'
                                    }
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Email do usuário"
                                        type="email"
                                        fullWidth
                                        error={!!error}
                                        helperText={error?.message}
                                        placeholder="email@exemplo.com"
                                    />
                                )}
                            />
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Permissão"
                                        fullWidth
                                    >
                                        <MenuItem value="VIEWER">Visualizador - Apenas visualiza</MenuItem>
                                        <MenuItem value="EDITOR">Editor - Pode editar dados</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAddMemberOpen(false)}>Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={addMember.isPending}>
                            Adicionar
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Invite Link Dialog */}
            <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Link de Convite</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Compartilhe este link para convidar pessoas para o dashboard. Elas terão permissão de Visualizador.
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 2,
                            bgcolor: 'action.hover',
                            borderRadius: 2,
                        }}
                    >
                        <TextField
                            value={inviteLink}
                            fullWidth
                            size="small"
                            InputProps={{ readOnly: true }}
                        />
                        <Tooltip title="Copiar link">
                            <IconButton onClick={handleCopyLink} color="primary">
                                <ContentCopy />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteDialogOpen(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
