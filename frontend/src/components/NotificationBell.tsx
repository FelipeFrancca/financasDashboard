import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/api/useNotifications';

const typeIcons = {
  INFO: <InfoIcon color="info" />,
  WARNING: <WarningIcon color="warning" />,
  ERROR: <ErrorIcon color="error" />,
  SUCCESS: <CheckCircleIcon color="success" />,
};

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardId } = useParams<{ dashboardId?: string }>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // API hooks
  const { data: notifications = [], isLoading } = useNotifications(dashboardId, false);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (id: string) => {
    if (!dashboardId) return;
    markAsRead.mutate({ id, dashboardId });
  };

  const handleMarkAllAsRead = () => {
    if (!dashboardId) return;
    markAllAsRead.mutate(dashboardId);
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
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600}>
            Notificações
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </Box>
        <Divider />

        {/* Loading state */}
        {isLoading && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {/* Notifications List */}
        {!isLoading && notifications.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">Nenhuma notificação</Typography>
          </Box>
        )}

        {!isLoading && notifications.length > 0 && (
          <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
            {notifications.slice(0, 5).map((notification) => (
              <ListItem
                key={notification.id}
                onClick={() => handleMarkAsRead(notification.id)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                  borderLeft: 4,
                  borderColor: notification.isRead ? 'transparent' : 'primary.main',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {typeIcons[notification.type]}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={notification.isRead ? 400 : 600}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                        {formatTime(notification.createdAt)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button fullWidth onClick={() => { handleClose(); navigate('/notifications'); }}>
            Ver todas
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell;
