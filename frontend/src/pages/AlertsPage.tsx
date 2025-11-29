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
import { useQuery } from '@tanstack/react-query';
import { alertService } from '../services/api';
import { showSuccess, showError } from '../utils/notifications';

export default function AlertsPage() {
    const { data: alerts = [], refetch } = useQuery({
        queryKey: ['alerts'],
        queryFn: alertService.getAll,
    });

    const handleMarkAsRead = async (id: string) => {
        try {
            await alertService.markAsRead(id);
            refetch();
        } catch (error) {
            showError(error, { title: 'Erro', text: 'Erro ao marcar alerta como lido' });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await alertService.delete(id);
            refetch();
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                <NotificationsActive fontSize="large" color="primary" />
                <Typography variant="h4" fontWeight={700}>
                    Alertas e Notificações
                </Typography>
            </Box>

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
