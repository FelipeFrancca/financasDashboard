import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../../services/api';

export const useCategories = (dashboardId: string) => {
    return useQuery({
        queryKey: ['categories', dashboardId],
        queryFn: () => categoryService.getAll(dashboardId),
        enabled: !!dashboardId,
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, dashboardId }: { data: any; dashboardId: string }) =>
            categoryService.create(data, dashboardId),
        onSuccess: (newCategory, variables) => {
            queryClient.setQueryData(['categories', variables.dashboardId], (oldData: any[] | undefined) => {
                if (!oldData) return [newCategory];
                return [...oldData, newCategory];
            });
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data, dashboardId }: { id: string; data: any; dashboardId: string }) =>
            categoryService.update(id, data, dashboardId),
        onSuccess: (updatedCategory, variables) => {
            queryClient.setQueryData(['categories', variables.dashboardId], (oldData: any[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.map((category) =>
                    category.id === updatedCategory.id ? updatedCategory : category
                );
            });
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dashboardId }: { id: string; dashboardId: string }) =>
            categoryService.delete(id, dashboardId),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(['categories', variables.dashboardId], (oldData: any[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.filter((category) => category.id !== variables.id);
            });
        },
    });
};
