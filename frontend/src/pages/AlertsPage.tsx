import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Chip,
} from '@mui/material';
import { Delete, CheckCircle, NotificationsActive } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { showSuccess, showError } from '../utils/notifications';
import {
    useAlerts,
    useMarkAlertAsRead,
    useDeleteAlert
} from '../hooks/api/useAlerts';

import { useParams } from 'react-router-dom';

// ... imports

export default function AlertsPage() {
    const { dashboardId } = useParams<{ dashboardId: string }>();
    // Hooks
    const { data: alerts = [] } = useAlerts(dashboardId || '');
    const markAsRead = useMarkAlertAsRead();
    const deleteAlert = useDeleteAlert();

    const handleMarkAsRead = async (id: string) => {
        try {
            await markAsRead.mutateAsync({ id, dashboardId: dashboardId || '' });
        } catch (error) {
            showError(error, { title: 'Erro', text: 'Erro ao marcar alerta como lido' });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteAlert.mutateAsync({ id, dashboardId: dashboardId || '' });
            showSuccess('Alerta excluído', { title: 'Sucesso', timer: 1500 });
        } catch (error) {
            showError(error, { title: 'Erro', text: 'Erro ao excluir alerta' });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR');
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title="Alertas e Notificações"
                breadcrumbs={[
                    { label: 'Dashboards', to: '/dashboards' },
                    { label: 'Alertas' }
                ]}
                actionIcon={<NotificationsActive />}
            />

            <Card>
                <CardContent>
                    <List>
                        {alerts.map((alert: any) => (
                            <ListItem
                                key={alert.id}
                                secondaryAction={
                                    <Box>
                                        {!alert.isRead && (
                                            <IconButton onClick={() => handleMarkAsRead(alert.id)} color="primary" title="Marcar como lida">
                                                <CheckCircle />
                                            </IconButton>
                                        )}
                                        <IconButton onClick={() => handleDelete(alert.id)} color="error" title="Excluir">
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                }
                                sx={{
                                    bgcolor: alert.isRead ? 'transparent' : 'action.hover',
                                    borderRadius: 1,
                                    mb: 1,
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1" fontWeight={alert.isRead ? 400 : 700}>
                                                {alert.message}
                                            </Typography>
                                            {!alert.isRead && <Chip label="Novo" size="small" color="primary" />}
                                        </Box>
                                    }
                                    secondary={formatDate(alert.createdAt)}
                                />
                            </ListItem>
                        ))}
                        {alerts.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body1" color="text.secondary">
                                    Nenhum alerta no momento.
                                </Typography>
                            </Box>
                        )}
                    </List>
                </CardContent>
            </Card>
        </Container>
    );
}
