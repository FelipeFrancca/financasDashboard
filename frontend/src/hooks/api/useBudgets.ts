import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '../../services/api';

export function useBudgets() {
    return useQuery({
        queryKey: ['budgets'],
        queryFn: budgetService.getAll,
    });
}

export function useCreateBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: budgetService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
}

export function useUpdateBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => budgetService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
}

export function useDeleteBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: budgetService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
}
