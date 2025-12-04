import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../../services/api';

export function useAccounts(dashboardId: string) {
    return useQuery({
        queryKey: ['accounts', dashboardId],
        queryFn: () => accountService.getAll(dashboardId),
        enabled: !!dashboardId,
    });
}

export function useCreateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ data, dashboardId }: { data: any; dashboardId: string }) =>
            accountService.create(data, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data, dashboardId }: { id: string; data: any; dashboardId: string }) =>
            accountService.update(id, data, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dashboardId }: { id: string; dashboardId: string }) =>
            accountService.delete(id, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}
