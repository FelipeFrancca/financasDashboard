/**
 * Budget Allocation Hooks
 * Hooks React Query para gerenciar alocações de orçamento
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import budgetAllocationService, {
    AllocationCategory,
    AllocationProfile,
    AllocationAnalysis,
    AllocationSimulation,
    AllocationAlert,
} from '../../services/budgetAllocationService';

// ============================================
// QUERY KEYS
// ============================================

export const allocationKeys = {
    all: ['allocations'] as const,
    defaults: () => [...allocationKeys.all, 'defaults'] as const,
    profiles: (dashboardId?: string) => [...allocationKeys.all, 'profiles', dashboardId] as const,
    profile: (profileId: string) => [...allocationKeys.all, 'profile', profileId] as const,
    defaultProfile: (dashboardId?: string) => [...allocationKeys.all, 'defaultProfile', dashboardId] as const,
    analysis: (dashboardId: string, options?: object) => [...allocationKeys.all, 'analysis', dashboardId, options] as const,
    alerts: (dashboardId: string) => [...allocationKeys.all, 'alerts', dashboardId] as const,
    aiRecommendations: (dashboardId: string) => [...allocationKeys.all, 'aiRecommendations', dashboardId] as const,
    aiAnalysis: (dashboardId: string) => [...allocationKeys.all, 'aiAnalysis', dashboardId] as const,
};

// ============================================
// HOOKS DE CONSULTA
// ============================================

/**
 * Hook para obter alocações padrão do sistema
 */
export function useAllocationDefaults() {
    return useQuery({
        queryKey: allocationKeys.defaults(),
        queryFn: () => budgetAllocationService.getDefaults(),
        staleTime: 1000 * 60 * 60, // 1 hora - raramente muda
    });
}

/**
 * Hook para listar perfis de alocação do usuário
 */
export function useAllocationProfiles(dashboardId?: string) {
    return useQuery({
        queryKey: allocationKeys.profiles(dashboardId),
        queryFn: () => budgetAllocationService.listProfiles(dashboardId),
        enabled: !!dashboardId,
    });
}

/**
 * Hook para obter perfil específico
 */
export function useAllocationProfile(profileId: string) {
    return useQuery({
        queryKey: allocationKeys.profile(profileId),
        queryFn: () => budgetAllocationService.getProfile(profileId),
        enabled: !!profileId,
    });
}

/**
 * Hook para obter perfil padrão (cria se não existir)
 */
export function useDefaultAllocationProfile(dashboardId?: string) {
    return useQuery({
        queryKey: allocationKeys.defaultProfile(dashboardId),
        queryFn: () => budgetAllocationService.getDefaultProfile(dashboardId),
        enabled: !!dashboardId,
        retry: 1,
    });
}

/**
 * Hook para analisar alocações vs gastos reais
 */
export function useAllocationAnalysis(
    dashboardId: string,
    options?: { profileId?: string; startDate?: string; endDate?: string }
) {
    return useQuery({
        queryKey: allocationKeys.analysis(dashboardId, options),
        queryFn: () => budgetAllocationService.analyzeAllocations(dashboardId, options),
        enabled: !!dashboardId,
        refetchOnWindowFocus: false,
    });
}

/**
 * Hook para obter alertas de alocação
 */
export function useAllocationAlerts(dashboardId: string) {
    return useQuery({
        queryKey: allocationKeys.alerts(dashboardId),
        queryFn: () => budgetAllocationService.getAlerts(dashboardId),
        enabled: !!dashboardId,
    });
}

/**
 * Hook para obter recomendações de IA
 */
export function useAIRecommendations(dashboardId: string, monthlyIncome: number) {
    return useQuery({
        queryKey: [...allocationKeys.aiRecommendations(dashboardId), monthlyIncome],
        queryFn: () => budgetAllocationService.getAIRecommendations(dashboardId, monthlyIncome),
        enabled: !!dashboardId && monthlyIncome > 0,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
}

/**
 * Hook para obter análise completa com IA
 */
export function useAIAnalysis(dashboardId: string) {
    return useQuery({
        queryKey: allocationKeys.aiAnalysis(dashboardId),
        queryFn: () => budgetAllocationService.getAIAnalysis(dashboardId),
        enabled: !!dashboardId,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
}

// ============================================
// HOOKS DE MUTAÇÃO
// ============================================

/**
 * Hook para criar perfil de alocação
 */
export function useCreateAllocationProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (profile: AllocationProfile) => budgetAllocationService.createProfile(profile),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: allocationKeys.profiles(variables.dashboardId) });
            queryClient.invalidateQueries({ queryKey: allocationKeys.defaultProfile(variables.dashboardId) });
        },
    });
}

/**
 * Hook para criar perfil padrão
 */
export function useCreateDefaultAllocationProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dashboardId?: string) => budgetAllocationService.createDefaultProfile(dashboardId),
        onSuccess: (_, dashboardId) => {
            queryClient.invalidateQueries({ queryKey: allocationKeys.profiles(dashboardId) });
            queryClient.invalidateQueries({ queryKey: allocationKeys.defaultProfile(dashboardId) });
        },
    });
}

/**
 * Hook para atualizar perfil de alocação
 */
export function useUpdateAllocationProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ profileId, updates }: { profileId: string; updates: Partial<AllocationProfile> }) =>
            budgetAllocationService.updateProfile(profileId, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: allocationKeys.profiles(data.dashboardId) });
            queryClient.invalidateQueries({ queryKey: allocationKeys.profile(data.id!) });
            queryClient.invalidateQueries({ queryKey: allocationKeys.defaultProfile(data.dashboardId) });
            queryClient.invalidateQueries({ queryKey: allocationKeys.analysis(data.dashboardId!) });
        },
    });
}

/**
 * Hook para deletar perfil de alocação
 */
export function useDeleteAllocationProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ profileId }: { profileId: string; dashboardId?: string }) =>
            budgetAllocationService.deleteProfile(profileId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: allocationKeys.profiles(variables.dashboardId) });
            queryClient.invalidateQueries({ queryKey: allocationKeys.defaultProfile(variables.dashboardId) });
        },
    });
}

/**
 * Hook para simular alocações
 */
export function useSimulateAllocations() {
    return useMutation({
        mutationFn: ({ monthlyIncome, allocations }: { monthlyIncome: number; allocations?: AllocationCategory[] }) =>
            budgetAllocationService.simulate(monthlyIncome, allocations),
    });
}

// Export types
export type {
    AllocationCategory,
    AllocationProfile,
    AllocationAnalysis,
    AllocationSimulation,
    AllocationAlert,
};
