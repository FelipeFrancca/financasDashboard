import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  IconButton,
  Button,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '../hooks/api/useNotifications';

const typeIcons = {
  INFO: <InfoIcon color="info" />,
  WARNING: <WarningIcon color="warning" />,
  ERROR: <ErrorIcon color="error" />,
  SUCCESS: <CheckCircleIcon color="success" />,
};

const typeColors = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export default function NotificationsPage() {
  const { dashboardId } = useParams<{ dashboardId?: string }>();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // API hooks
  const { data: allNotifications = [], isLoading } = useNotifications(dashboardId, false);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const filteredNotifications = filter === 'unread'
    ? allNotifications.filter((n) => !n.isRead)
    : allNotifications;

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    if (!dashboardId) return;
    markAsRead.mutate({ id, dashboardId });
  };

  const handleMarkAllAsRead = () => {
    if (!dashboardId) return;
    markAllAsRead.mutate(dashboardId);
  };

  const handleDelete = (id: string) => {
    if (!dashboardId) return;
    deleteNotification.mutate({ id, dashboardId });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Notificações"
        breadcrumbs={[
          { label: 'Dashboards', to: '/dashboards' },
          { label: 'Notificações' },
        ]}
      />
      {!isLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
        </Typography>
      )}

      <Paper sx={{ mt: 3 }}>
        {/* Header with filters */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, newFilter) => newFilter && setFilter(newFilter)}
            size="small"
          >
            <ToggleButton value="all">
              Todas ({allNotifications.length})
            </ToggleButton>
            <ToggleButton value="unread">
              Não lidas ({unreadCount})
            </ToggleButton>
          </ToggleButtonGroup>

          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Carregando notificações...
            </Typography>
          </Box>
        )}

        {/* Notifications List */}
        {!isLoading && filteredNotifications.length === 0 && (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            </Typography>
          </Box>
        )}

        {!isLoading && filteredNotifications.length > 0 && (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                    borderLeft: 4,
                    borderColor: notification.isRead ? 'transparent' : 'primary.main',
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(notification.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    onClick={() => handleMarkAsRead(notification.id)}
                    sx={{ pr: 6 }}
                  >
                    <ListItemIcon sx={{ minWidth: 48 }}>
                      {typeIcons[notification.type]}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="body1"
                            fontWeight={notification.isRead ? 400 : 600}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.type}
                            size="small"
                            color={typeColors[notification.type]}
                            sx={{ height: 20, fontSize: 10 }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatTime(notification.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
}
