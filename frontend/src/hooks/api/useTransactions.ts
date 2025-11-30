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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
};

export const useUpdateTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) =>
            transactionService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: transactionService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
