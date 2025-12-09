import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Card,
    CardContent,
    CardHeader,
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
    Autocomplete,
    CircularProgress,
    Switch,
    FormControlLabel,
    Divider,
    alpha,
    Paper,
    Fade,
    useTheme,
} from '@mui/material';
import {
    PersonAdd,
    ContentCopy,
    Group,
    Share,
    Visibility,
    Edit,
    AdminPanelSettings,
    Close,
    Check,
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
    useUpdateDashboardMember,
    useApproveDashboardMember,
    type DashboardMember,
} from '../hooks/api/useDashboardMembers';
import { authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { fadeIn } from '../utils/animations';

interface AddMemberFormData {
    email: string;
    role: 'VIEWER' | 'EDITOR';
}

interface UserOption {
    id: string;
    email: string;
    name: string;
    avatar?: string;
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

const getRoleIcon = (role: string) => {
    switch (role) {
        case 'OWNER': return <AdminPanelSettings fontSize="small" />;
        case 'EDITOR': return <Edit fontSize="small" />;
        default: return <Visibility fontSize="small" />;
    }
};

const getRoleColor = (role: string): 'error' | 'warning' | 'info' => {
    switch (role) {
        case 'OWNER': return 'error';
        case 'EDITOR': return 'warning';
        default: return 'info';
    }
};

// Member Card Component Update
interface MemberCardProps {
    member: DashboardMember;
    isOwner: boolean;
    isCurrentUser: boolean;
    onRoleChange: (userId: string, newRole: 'VIEWER' | 'EDITOR') => void;
    onRemove: (userId: string, userName: string) => void;
    onApprove?: (userId: string) => void; // Add onApprove
    isUpdating: boolean;
    isPending?: boolean; // Add isPending
}

function MemberCard({ member, isOwner, isCurrentUser, onRoleChange, onRemove, onApprove, isUpdating, isPending }: MemberCardProps) {
    const theme = useTheme();
    const canEdit = isOwner && member.role !== 'OWNER' && !isCurrentUser;
    const isEditor = member.role === 'EDITOR';

    return (
        <Fade in timeout={300}>
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    border: `1px solid ${isPending ? theme.palette.warning.main : theme.palette.divider}`,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        borderColor: isPending ? theme.palette.warning.dark : theme.palette.primary.main,
                        boxShadow: `0 4px 12px ${alpha(isPending ? theme.palette.warning.main : theme.palette.primary.main, 0.15)}`,
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: isPending ? alpha(theme.palette.warning.main, 0.02) : 'inherit',
                }}
            >
                {/* Role indicator bar */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        bgcolor: isPending ? 'warning.main' : `${getRoleColor(member.role)}.main`,
                    }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Avatar */}
                    <Avatar
                        src={member.user.avatar}
                        alt={member.user.name}
                        sx={{
                            width: 48,
                            height: 48,
                            bgcolor: isPending ? 'warning.main' : `${getRoleColor(member.role)}.main`,
                        }}
                    >
                        {member.user.name?.charAt(0).toUpperCase()}
                    </Avatar>

                    {/* User Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600} noWrap>
                                {member.user.name}
                            </Typography>
                            {isCurrentUser && (
                                <Chip
                                    label="Você"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                            )}
                            {isPending && (
                                <Chip
                                    label="Pendente"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                            )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {member.user.email}
                        </Typography>
                    </Box>

                    {/* Actions */}
                    {isPending && isOwner ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {isUpdating ? (
                                <CircularProgress size={20} />
                            ) : (
                                <>
                                    <Tooltip title="Aprovar membro">
                                        <IconButton
                                            onClick={() => onApprove && onApprove(member.user.id)}
                                            color="success"
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                                '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) }
                                            }}
                                        >
                                            <Check fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Rejeitar solicitação">
                                        <IconButton
                                            onClick={() => onRemove(member.user.id, member.user.name)}
                                            color="error"
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                            }}
                                        >
                                            <Close fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )}
                        </Box>
                    ) : (
                        /* Standard Actions */
                        <>
                            {/* Role Chip / Toggle */}
                            {canEdit ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isUpdating ? (
                                        <CircularProgress size={20} />
                                    ) : (
                                        <Tooltip title={isEditor ? 'Alterar para Visualizador' : 'Alterar para Editor'}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={isEditor}
                                                        onChange={() => onRoleChange(
                                                            member.user.id,
                                                            isEditor ? 'VIEWER' : 'EDITOR'
                                                        )}
                                                        size="small"
                                                        color="warning"
                                                    />
                                                }
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {getRoleIcon(member.role)}
                                                        <Typography variant="caption" fontWeight={500}>
                                                            {translateRole(member.role)}
                                                        </Typography>
                                                    </Box>
                                                }
                                                labelPlacement="start"
                                                sx={{ mr: 0 }}
                                            />
                                        </Tooltip>
                                    )}
                                </Box>
                            ) : (
                                <Chip
                                    icon={getRoleIcon(member.role)}
                                    label={translateRole(member.role)}
                                    size="small"
                                    color={getRoleColor(member.role)}
                                    variant="outlined"
                                    sx={{ fontWeight: 500 }}
                                />
                            )}

                            {/* Remove Button */}
                            {canEdit && (
                                <Tooltip title="Remover membro">
                                    <IconButton
                                        onClick={() => onRemove(member.user.id, member.user.name)}
                                        color="error"
                                        size="small"
                                        sx={{
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                            },
                                        }}
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </>
                    )}
                </Box>
            </Paper>
        </Fade>
    );
}

export default function MembersPage() {
    const theme = useTheme();
    const { dashboardId } = useParams<{ dashboardId: string }>();
    const { user: currentUser } = useAuth();
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

    // User search state
    const [userOptions, setUserOptions] = useState<UserOption[]>([]);
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [userInputValue, setUserInputValue] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

    // Hooks
    const { data, isLoading } = useDashboardMembers(dashboardId || '');
    const addMember = useAddDashboardMember();
    const removeMember = useRemoveDashboardMember();
    const updateMember = useUpdateDashboardMember();
    const approveMember = useApproveDashboardMember(); // Use hook

    const { control, handleSubmit, reset, setValue } = useForm<AddMemberFormData>({
        defaultValues
    });

    // Search users effect
    useEffect(() => {
        // ... (implementation remains same)
        const searchUsers = async () => {
            if (!userInputValue) {
                setUserOptions([]);
                return;
            }

            setUserSearchLoading(true);
            try {
                // Determine if input is email or name
                // Search users by name or email
                const results = await authService.searchUsers(userInputValue);
                setUserOptions(results);
            } catch (error) {
                console.error('Error searching users:', error);
                setUserOptions([]);
            } finally {
                setUserSearchLoading(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 500);
        return () => clearTimeout(timeoutId);
    }, [userInputValue]);

    // Extract members and ownerId from API response
    const membersData = data?.members || [];
    const ownerId = data?.ownerId;

    // Check if current user is owner (via ownerId from dashboard)
    const isOwner = ownerId === currentUser?.id;

    // Filter members
    const ownerMember = membersData.find((m: DashboardMember) => m.role === 'OWNER');
    const activeMembers = membersData.filter((m: DashboardMember) => m.role !== 'OWNER' && (m.status === 'APPROVED' || !m.status));
    const pendingMembers = membersData.filter((m: DashboardMember) => m.status === 'PENDING');

    const handleAddMember = async (data: AddMemberFormData) => {
        try {
            await addMember.mutateAsync({
                dashboardId: dashboardId || '',
                email: data.email,
                role: data.role,
            });
            setAddMemberOpen(false);
            reset(defaultValues);
            setSelectedUser(null);
            setUserInputValue('');
            showSuccess('Membro adicionado com sucesso!', { title: 'Sucesso' });
        } catch (error: any) {
            showErrorWithRetry(error, () => handleAddMember(data));
        }
    };

    const handleApproveMember = async (userId: string) => {
        setUpdatingMemberId(userId);
        try {
            await approveMember.mutateAsync({
                dashboardId: dashboardId || '',
                userId
            });
            showSuccess('Membro aprovado com sucesso!', { title: 'Aprovado' });
        } catch (error) {
            showErrorWithRetry(error, () => handleApproveMember(userId));
        } finally {
            setUpdatingMemberId(null);
        }
    };

    const handleRemoveMember = async (userId: string, userName: string) => {
        // Updated text to handle reject vs remove
        const isPending = pendingMembers.some(m => m.user.id === userId);
        const actionText = isPending ? 'rejeitar solicitação de' : 'remover';
        const titleText = isPending ? 'Rejeitar solicitação?' : 'Remover membro?';
        const confirmText = isPending ? 'Sim, rejeitar' : 'Sim, remover';

        const result = await showConfirm(
            `Tem certeza que deseja ${actionText} ${userName}?`,
            {
                title: titleText,
                icon: 'warning',
                confirmButtonText: confirmText,
                cancelButtonText: 'Cancelar',
            }
        );

        if (result.isConfirmed) {
            try {
                await removeMember.mutateAsync({
                    dashboardId: dashboardId || '',
                    userId,
                });
                showSuccess(isPending ? 'Solicitação rejeitada!' : 'Membro removido!', { title: 'Sucesso' });
            } catch (error) {
                showErrorWithRetry(error, () => handleRemoveMember(userId, userName));
            }
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'VIEWER' | 'EDITOR') => {
        const member = membersData.find((m: DashboardMember) => m.user.id === userId);
        if (!member) return;

        setUpdatingMemberId(userId);
        try {
            await updateMember.mutateAsync({
                dashboardId: dashboardId || '',
                userId,
                role: newRole,
            });
            showSuccess(`Permissão de ${member.user.name} alterada para ${translateRole(newRole)}`, { title: 'Atualizado' });
        } catch (error) {
            showErrorWithRetry(error, () => handleRoleChange(userId, newRole));
        } finally {
            setUpdatingMemberId(null);
        }
    };

    const handleCreateInvite = () => {
        setInviteLoading(true);
        // Simulate API call or real generation
        setTimeout(() => {
            const baseUrl = window.location.origin;
            const link = `${baseUrl}/invite/${dashboardId}`; // Simple link for now
            setInviteLink(link);
            setInviteLoading(false);
            setInviteDialogOpen(true);
        }, 500);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        showSuccess('Link copiado para a área de transferência!', { title: 'Copiado' });
    };

    if (isLoading) {
        // ... (loading skeleton remains the same)
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

    if (membersData.length === 0) {
        // ... (empty state remains the same)
        return (
            // ... EmptyState content
            // Keeping brevity
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* ... same as before ... */}
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
                <AddMemberDialog
                    open={addMemberOpen}
                    onClose={() => setAddMemberOpen(false)}
                    onSubmit={handleSubmit(handleAddMember)}
                    control={control}
                    userOptions={userOptions}
                    userSearchLoading={userSearchLoading}
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    setUserInputValue={setUserInputValue}
                    setValue={setValue}
                    isPending={addMember.isPending}
                />

                <InviteDialog
                    open={inviteDialogOpen}
                    onClose={() => setInviteDialogOpen(false)}
                    inviteLink={inviteLink}
                    onCopy={handleCopyLink}
                />
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
                    // ... (header remains the same)
                    avatar={<Group color="primary" />}
                    title="Gerenciar Membros"
                    titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                    subheader={`${membersData.length} membro${membersData.length !== 1 ? 's' : ''} neste dashboard (incluindo pendentes)`}
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
                    <Stack spacing={2}>
                        {/* Pending Members Section (Only for Owner) */}
                        {isOwner && pendingMembers.length > 0 && (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="overline" color="warning.main" fontWeight="bold">
                                        Solicitações Pendentes ({pendingMembers.length})
                                    </Typography>
                                    <Chip label="Aguardando Aprovação" size="small" color="warning" variant="outlined" />
                                </Box>
                                {pendingMembers.map((member: DashboardMember) => (
                                    <MemberCard
                                        key={member.id}
                                        member={member}
                                        isOwner={isOwner}
                                        isCurrentUser={false}
                                        onRoleChange={handleRoleChange}
                                        onRemove={handleRemoveMember}
                                        onApprove={handleApproveMember}
                                        isUpdating={updatingMemberId === member.user.id}
                                        isPending={true}
                                    />
                                ))}
                                <Divider sx={{ my: 2 }} />
                            </>
                        )}

                        {/* Owner Section */}
                        {ownerMember && (
                            <>
                                <Typography variant="overline" color="text.secondary" sx={{ px: 1 }}>
                                    Proprietário
                                </Typography>
                                <MemberCard
                                    member={ownerMember}
                                    isOwner={isOwner}
                                    isCurrentUser={ownerMember.user.id === currentUser?.id}
                                    onRoleChange={handleRoleChange}
                                    onRemove={handleRemoveMember}
                                    isUpdating={updatingMemberId === ownerMember.user.id}
                                />
                            </>
                        )}

                        {/* Active Members Section */}
                        {activeMembers.length > 0 && (
                            <>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="overline" color="text.secondary" sx={{ px: 1 }}>
                                    Colaboradores ({activeMembers.length})
                                </Typography>
                                {activeMembers.map((member: DashboardMember) => (
                                    <MemberCard
                                        key={member.id}
                                        member={member}
                                        isOwner={isOwner}
                                        isCurrentUser={member.user.id === currentUser?.id}
                                        onRoleChange={handleRoleChange}
                                        onRemove={handleRemoveMember}
                                        isUpdating={updatingMemberId === member.user.id}
                                    />
                                ))}
                            </>
                        )}

                        {/* Legend */}
                        <Box
                            sx={{
                                mt: 2,
                                p: 2,
                                bgcolor: alpha(theme.palette.info.main, 0.05),
                                borderRadius: 2,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                            }}
                        >
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                <strong>Legenda de Permissões:</strong>
                            </Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                                {pendingMembers.length > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="caption" color="warning.main" fontWeight="bold">● Pendente</Typography>
                                        <Typography variant="caption">- Aguardando sua aprovação</Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AdminPanelSettings fontSize="small" color="error" />
                                    <Typography variant="caption">Proprietário - Controle total</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Edit fontSize="small" color="warning" />
                                    <Typography variant="caption">Editor - Pode criar e editar</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Visibility fontSize="small" color="info" />
                                    <Typography variant="caption">Visualizador - Apenas visualiza</Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            {/* Dialogs */}
            <AddMemberDialog
                open={addMemberOpen}
                onClose={() => setAddMemberOpen(false)}
                onSubmit={handleSubmit(handleAddMember)}
                control={control}
                userOptions={userOptions}
                userSearchLoading={userSearchLoading}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                setUserInputValue={setUserInputValue}
                setValue={setValue}
                isPending={addMember.isPending}
            />

            <InviteDialog
                open={inviteDialogOpen}
                onClose={() => setInviteDialogOpen(false)}
                inviteLink={inviteLink}
                onCopy={handleCopyLink}
            />
        </Container>
    );
}

interface InviteDialogProps {
    open: boolean;
    onClose: () => void;
    inviteLink: string;
    onCopy: () => void;
}

function InviteDialog({ open, onClose, inviteLink, onCopy }: InviteDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Convite por Link</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Compartilhe este link com quem você deseja convidar para acessar este dashboard.
                </Typography>
                <TextField
                    fullWidth
                    value={inviteLink}
                    InputProps={{
                        readOnly: true,
                        endAdornment: (
                            <IconButton onClick={onCopy} edge="end">
                                <ContentCopy />
                            </IconButton>
                        ),
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
            </DialogActions>
        </Dialog>
    );
}

// Add Member Dialog Component
interface AddMemberDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    control: any;
    userOptions: UserOption[];
    userSearchLoading: boolean;
    selectedUser: UserOption | null;
    setSelectedUser: (user: UserOption | null) => void;
    setUserInputValue: (value: string) => void;
    setValue: any;
    isPending: boolean;
}

function AddMemberDialog({
    open,
    onClose,
    onSubmit,
    control,
    userOptions,
    userSearchLoading,
    selectedUser,
    setSelectedUser,
    setUserInputValue,
    setValue,
    isPending,
}: AddMemberDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={onSubmit}>
                <DialogTitle>Adicionar Membro</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
                                <Autocomplete
                                    freeSolo
                                    options={userOptions}
                                    getOptionLabel={(option) =>
                                        typeof option === 'string' ? option : option.email
                                    }
                                    value={selectedUser || field.value}
                                    onChange={(_event, newValue) => {
                                        if (typeof newValue === 'string') {
                                            setValue('email', newValue);
                                            setSelectedUser(null);
                                        } else if (newValue) {
                                            setValue('email', newValue.email);
                                            setSelectedUser(newValue);
                                        } else {
                                            setValue('email', '');
                                            setSelectedUser(null);
                                        }
                                    }}
                                    onInputChange={(_event, newInputValue) => {
                                        setUserInputValue(newInputValue);
                                        field.onChange(newInputValue);
                                    }}
                                    loading={userSearchLoading}
                                    renderOption={(props, option) => {
                                        const { key, ...otherProps } = props;
                                        if (typeof option === 'string') return null;
                                        return (
                                            <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                <Avatar src={option.avatar} sx={{ width: 32, height: 32 }}>
                                                    {option.name?.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {option.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {option.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        );
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Email do usuário"
                                            placeholder="Digite para buscar usuários..."
                                            error={!!error}
                                            helperText={error?.message || 'Comece a digitar para buscar usuários cadastrados'}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {userSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
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
                                    helperText="Escolha o nível de acesso do novo membro"
                                >
                                    <MenuItem value="VIEWER">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Visibility fontSize="small" color="info" />
                                            <Box>
                                                <Typography variant="body2">Visualizador</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Apenas visualiza dados
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="EDITOR">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Edit fontSize="small" color="warning" />
                                            <Box>
                                                <Typography variant="body2">Editor</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Pode criar e editar transações
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={isPending}>
                        {isPending ? <CircularProgress size={20} /> : 'Adicionar'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
