import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../../services/api';

export function useAccounts(dashboardId: string) {
    return useQuery({
        queryKey: ['accounts', dashboardId],
        queryFn: () => accountService.getAll(dashboardId),
        enabled: !!dashboardId,
    });
}

export function useCreateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ data, dashboardId }: { data: any; dashboardId: string }) =>
            accountService.create(data, dashboardId),
        onSuccess: (newAccount, variables) => {
            queryClient.setQueryData(['accounts', variables.dashboardId], (oldData: any[] | undefined) => {
                if (!oldData) return [newAccount];
                return [...oldData, newAccount];
            });
        },
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data, dashboardId }: { id: string; data: any; dashboardId: string }) =>
            accountService.update(id, data, dashboardId),
        onSuccess: (updatedAccount, variables) => {
            queryClient.setQueryData(['accounts', variables.dashboardId], (oldData: any[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.map((account) =>
                    account.id === updatedAccount.id ? updatedAccount : account
                );
            });
        },
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dashboardId }: { id: string; dashboardId: string }) =>
            accountService.delete(id, dashboardId),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(['accounts', variables.dashboardId], (oldData: any[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.filter((account) => account.id !== variables.id);
            });
        },
    });
}
