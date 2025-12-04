import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../../services/api';

export function useGoals(dashboardId: string) {
    return useQuery({
        queryKey: ['goals', dashboardId],
        queryFn: () => goalService.getAll(dashboardId),
        enabled: !!dashboardId,
    });
}

export function useCreateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ data, dashboardId }: { data: any; dashboardId: string }) =>
            goalService.create(data, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });
}

export function useUpdateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data, dashboardId }: { id: string; data: any; dashboardId: string }) =>
            goalService.update(id, data, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });
}

export function useDeleteGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dashboardId }: { id: string; dashboardId: string }) =>
            goalService.delete(id, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });
}
