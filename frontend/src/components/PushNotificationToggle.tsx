/**
 * Push Notification Toggle Component
 * Allows users to enable/disable push notifications from their profile
 */

import { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Chip,
    Paper,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    NotificationsActive,
    NotificationsOff,
    Refresh,
    Send,
} from '@mui/icons-material';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function PushNotificationToggle() {
    const {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe,
        sendTestNotification,
        refresh,
    } = usePushNotifications();

    const [testLoading, setTestLoading] = useState(false);
    const [testSuccess, setTestSuccess] = useState(false);

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            await subscribe();
        }
    };

    const handleTest = async () => {
        setTestLoading(true);
        setTestSuccess(false);
        try {
            await sendTestNotification();
            setTestSuccess(true);
            setTimeout(() => setTestSuccess(false), 3000);
        } catch (err) {
            console.error('Erro ao enviar teste:', err);
        } finally {
            setTestLoading(false);
        }
    };

    // Not supported
    if (!isSupported) {
        return (
            <Paper sx={{ p: 3, bgcolor: 'action.hover' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <NotificationsOff color="disabled" />
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Notificações Push
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Seu navegador não suporta notificações push.
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        );
    }

    // Permission denied
    if (permission === 'denied') {
        return (
            <Paper sx={{ p: 3, bgcolor: 'error.main', color: 'error.contrastText' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <NotificationsOff />
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Notificações Bloqueadas
                        </Typography>
                        <Typography variant="body2">
                            Você bloqueou as notificações. Para reativar, acesse as configurações do navegador.
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isSubscribed ? (
                        <NotificationsActive color="success" sx={{ fontSize: 32 }} />
                    ) : (
                        <NotificationsOff color="disabled" sx={{ fontSize: 32 }} />
                    )}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                                Notificações Push
                            </Typography>
                            <Chip
                                size="small"
                                label={isSubscribed ? 'Ativado' : 'Desativado'}
                                color={isSubscribed ? 'success' : 'default'}
                                variant="outlined"
                            />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {isSubscribed
                                ? 'Você receberá alertas mesmo quando o app estiver fechado.'
                                : 'Ative para receber alertas em tempo real no seu dispositivo.'
                            }
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Tooltip title="Atualizar status">
                        <IconButton size="small" onClick={refresh} disabled={isLoading}>
                            <Refresh fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    {isSubscribed && (
                        <Tooltip title="Enviar notificação de teste">
                            <IconButton
                                size="small"
                                onClick={handleTest}
                                disabled={testLoading}
                                color={testSuccess ? 'success' : 'default'}
                            >
                                {testLoading ? (
                                    <CircularProgress size={18} />
                                ) : (
                                    <Send fontSize="small" />
                                )}
                            </IconButton>
                        </Tooltip>
                    )}

                    <Button
                        variant={isSubscribed ? 'outlined' : 'contained'}
                        color={isSubscribed ? 'error' : 'primary'}
                        onClick={handleToggle}
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={18} /> : null}
                        sx={{ minWidth: 120 }}
                    >
                        {isLoading ? 'Aguarde...' : isSubscribed ? 'Desativar' : 'Ativar'}
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {testSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    Notificação de teste enviada! Verifique seu dispositivo.
                </Alert>
            )}
        </Paper>
    );
}
