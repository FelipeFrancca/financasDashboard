import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '../../services/api';

export function useAlerts() {
    return useQuery({
        queryKey: ['alerts'],
        queryFn: alertService.getAll,
    });
}

export function useMarkAlertAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: alertService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });
}

export function useDeleteAlert() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: alertService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });
}
