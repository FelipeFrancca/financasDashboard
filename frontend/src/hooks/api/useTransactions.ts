import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../../services/api';
import type { Transaction, TransactionFilters } from '../../types';

export const useTransactions = (filters: TransactionFilters, dashboardId?: string) => {
    return useQuery({
        queryKey: ['transactions', filters, dashboardId],
        queryFn: () => transactionService.getAll({ ...filters, dashboardId }),
        enabled: !!dashboardId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useTransactionStats = (filters: TransactionFilters, dashboardId?: string) => {
    return useQuery({
        queryKey: ['stats', filters, dashboardId],
        queryFn: () => transactionService.getStats({ ...filters, dashboardId }),
        enabled: !!dashboardId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useCreateTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: transactionService.create,
        onSuccess: (newTransaction) => {
            queryClient.setQueriesData({ queryKey: ['transactions'] }, (oldData: Transaction[] | undefined) => {
                if (!oldData) return [newTransaction];
                return [newTransaction, ...oldData];
            });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
};

export const useUpdateTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) =>
            transactionService.update(id, data),
        onSuccess: (updatedTransaction) => {
            queryClient.setQueriesData({ queryKey: ['transactions'] }, (oldData: Transaction[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t));
            });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dashboardId }: { id: string; dashboardId: string }) =>
            transactionService.delete(id, dashboardId),
        onSuccess: (_, variables) => {
            queryClient.setQueriesData({ queryKey: ['transactions'] }, (oldData: Transaction[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.filter((t) => t.id !== variables.id);
            });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
};

export const useCreateManyTransactions = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: transactionService.createMany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
};

export const useUpdateInstallmentGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            groupId,
            data,
            dashboardId,
            scope
        }: {
            groupId: string;
            data: Partial<Transaction>;
            dashboardId: string;
            scope: 'single' | 'remaining' | 'all'
        }) => transactionService.updateInstallmentGroup(groupId, data, dashboardId, scope),
        onSuccess: () => {
            // Invalidate all transaction queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
};

export const useDeleteManyTransactions = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            ids,
            dashboardId,
            includeInstallments = true
        }: {
            ids: string[];
            dashboardId: string;
            includeInstallments?: boolean
        }) => transactionService.deleteMany(ids, dashboardId, includeInstallments),
        onSuccess: (_, variables) => {
            queryClient.setQueriesData({ queryKey: ['transactions'] }, (oldData: Transaction[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.filter((t) => !variables.ids.includes(t.id));
            });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
};
