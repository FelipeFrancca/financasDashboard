import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export interface Notification {
    id: string;
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedType?: string;
    relatedId?: string;
}

// Get all notifications for a dashboard
export const useNotifications = (dashboardId: string | undefined, unreadOnly = false) => {
    return useQuery({
        queryKey: ['notifications', dashboardId, unreadOnly],
        queryFn: async () => {
            if (!dashboardId) return [];
            const params = new URLSearchParams({ dashboardId });
            if (unreadOnly) params.append('unreadOnly', 'true');
            const response = await api.get(`/api/alerts?${params.toString()}`);
            return response.data.data as Notification[];
        },
        enabled: !!dashboardId,
    });
};

// Mark notification as read
export const useMarkAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dashboardId }: { id: string; dashboardId: string }) => {
            const response = await api.put(`/api/alerts/${id}/read`, { dashboardId });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

// Mark all notifications as read
export const useMarkAllAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dashboardId: string) => {
            const response = await api.put('/api/alerts/read-all', { dashboardId });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

// Delete notification
export const useDeleteNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dashboardId }: { id: string; dashboardId: string }) => {
            const response = await api.delete(`/api/alerts/${id}?dashboardId=${dashboardId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};
