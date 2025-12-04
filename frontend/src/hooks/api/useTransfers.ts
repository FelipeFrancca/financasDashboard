import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transferService } from '../../services/api';

export function useTransfers(dashboardId: string) {
    return useQuery({
        queryKey: ['transfers', dashboardId],
        queryFn: () => transferService.getAll(dashboardId),
        enabled: !!dashboardId,
    });
}

export function useCreateTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ data, dashboardId }: { data: any; dashboardId: string }) =>
            transferService.create(data, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            // Transfers affect account balances, so we should invalidate accounts too
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useDeleteTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dashboardId }: { id: string; dashboardId: string }) =>
            transferService.delete(id, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}
