import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../../services/api';

export interface DashboardMember {
    id: string;
    userId: string;
    dashboardId: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
}

export const useDashboardMembers = (dashboardId: string) => {
    return useQuery({
        queryKey: ['dashboard-members', dashboardId],
        queryFn: () => dashboardService.getMembers(dashboardId),
        enabled: !!dashboardId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useAddDashboardMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ dashboardId, email, role }: { dashboardId: string; email: string; role: 'VIEWER' | 'EDITOR' }) =>
            dashboardService.addMember(dashboardId, email, role),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['dashboard-members', variables.dashboardId] });
        },
    });
};

export const useRemoveDashboardMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ dashboardId, userId }: { dashboardId: string; userId: string }) =>
            dashboardService.removeMember(dashboardId, userId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['dashboard-members', variables.dashboardId] });
        },
    });
};

export const useUpdateDashboard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: { title?: string; description?: string } }) =>
            dashboardService.update(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboards'] });
        },
    });
};

export const useDeleteDashboard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => dashboardService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboards'] });
        },
    });
};
