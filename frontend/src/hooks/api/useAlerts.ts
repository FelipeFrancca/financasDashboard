import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '../../services/api';

export function useAlerts(dashboardId: string) {
    return useQuery({
        queryKey: ['alerts', dashboardId],
        queryFn: () => alertService.getAll(dashboardId),
        enabled: !!dashboardId,
    });
}

export function useMarkAlertAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dashboardId }: { id: string; dashboardId: string }) =>
            alertService.markAsRead(id, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });
}

export function useDeleteAlert() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dashboardId }: { id: string; dashboardId: string }) =>
            alertService.delete(id, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });
}
