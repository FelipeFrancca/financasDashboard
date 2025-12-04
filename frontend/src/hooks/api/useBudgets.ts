import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '../../services/api';

export function useBudgets(dashboardId: string) {
    return useQuery({
        queryKey: ['budgets', dashboardId],
        queryFn: () => budgetService.getAll(dashboardId),
        enabled: !!dashboardId,
    });
}

export function useCreateBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ data, dashboardId }: { data: any; dashboardId: string }) =>
            budgetService.create(data, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
}

export function useUpdateBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data, dashboardId }: { id: string; data: any; dashboardId: string }) =>
            budgetService.update(id, data, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
}

export function useDeleteBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dashboardId }: { id: string; dashboardId: string }) =>
            budgetService.delete(id, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
}
