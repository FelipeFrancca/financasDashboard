import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurrenceService } from '../../services/api';

export function useRecurrences(dashboardId: string) {
    return useQuery({
        queryKey: ['recurrences', dashboardId],
        queryFn: () => recurrenceService.getAll(dashboardId),
        enabled: !!dashboardId,
    });
}

export function useCreateRecurrence() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ data, dashboardId }: { data: any; dashboardId: string }) =>
            recurrenceService.create(data, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurrences'] });
        },
    });
}

export function useUpdateRecurrence() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data, dashboardId }: { id: string; data: any; dashboardId: string }) =>
            recurrenceService.update(id, data, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurrences'] });
        },
    });
}

export function useDeleteRecurrence() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dashboardId }: { id: string; dashboardId: string }) =>
            recurrenceService.delete(id, dashboardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurrences'] });
        },
    });
}
