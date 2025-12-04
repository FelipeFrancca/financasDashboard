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
export function useNotifications(dashboardId: string | undefined, unreadOnly = false) {
    return useQuery({
        queryKey: ['notifications', dashboardId, unreadOnly],
        queryFn: async () => {
            if (!dashboardId) return [];
            const params = new URLSearchParams({ dashboardId });
            if (unreadOnly) params.append('unreadOnly', 'true');
            const response = await api.get(`/alerts?${params.toString()}`);
            return response.data.data as Notification[];
        },
        enabled: !!dashboardId,
    });
}

// Mark notification as read
export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dashboardId }: { id: string; dashboardId: string }) => {
            const response = await api.put(`/alerts/${id}/read`, { dashboardId });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

// Mark all notifications as read
export function useMarkAllAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dashboardId: string) => {
            const response = await api.put('/alerts/read-all', { dashboardId });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

// Delete notification
export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dashboardId }: { id: string; dashboardId: string }) => {
            const response = await api.delete(`/alerts/${id}?dashboardId=${dashboardId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

