import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../../services/api';

export function useGoals() {
    return useQuery({
        queryKey: ['goals'],
        queryFn: goalService.getAll,
    });
}

export function useCreateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: goalService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });
}

export function useUpdateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => goalService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });
}

export function useDeleteGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: goalService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });
}
