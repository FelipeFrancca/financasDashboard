import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurrenceService } from '../../services/api';

export function useRecurrences() {
    return useQuery({
        queryKey: ['recurrences'],
        queryFn: recurrenceService.getAll,
    });
}

export function useCreateRecurrence() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recurrenceService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurrences'] });
        },
    });
}

export function useUpdateRecurrence() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => recurrenceService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurrences'] });
        },
    });
}

export function useDeleteRecurrence() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recurrenceService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurrences'] });
        },
    });
}
