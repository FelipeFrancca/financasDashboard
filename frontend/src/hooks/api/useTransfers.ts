import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transferService } from '../../services/api';

export function useTransfers() {
    return useQuery({
        queryKey: ['transfers'],
        queryFn: transferService.getAll,
    });
}

export function useCreateTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: transferService.create,
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
        mutationFn: transferService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}
