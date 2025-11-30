import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../../services/api';

export const useDashboards = () => {
    return useQuery({
        queryKey: ['dashboards'],
        queryFn: dashboardService.list,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};

export const useCreateDashboard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ title, description }: { title: string; description?: string }) =>
            dashboardService.create(title, description),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboards'] });
        },
    });
};
