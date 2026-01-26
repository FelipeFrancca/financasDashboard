/**
 * Budget Allocation Service
 * Serviço para gerenciar alocações de orçamento no frontend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL === undefined || import.meta.env.VITE_API_URL === ''
  ? ''
  : import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================
// TIPOS
// ============================================

export interface AllocationCategory {
  id?: string;
  name: string;
  percentage: number;
  color?: string;
  icon?: string;
  order?: number;
  linkedCategories?: string[];
}

export interface AllocationProfile {
  id?: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  dashboardId?: string;
  allocations: AllocationCategory[];
}

export interface AllocationAnalysis {
  profileId: string;
  profileName: string;
  period: {
    start: string;
    end: string;
  };
  totalIncome: number;
  allocations: {
    name: string;
    targetPercentage: number;
    targetAmount: number;
    actualAmount: number;
    actualPercentage: number;
    difference: number;
    differencePercentage: number;
    status: 'under' | 'on_track' | 'over';
    linkedCategories: string[];
    matchedTransactions: number;
  }[];
  unallocatedExpenses: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  summary: {
    totalAllocated: number;
    totalUnallocated: number;
    overallStatus: 'healthy' | 'warning' | 'critical';
  };
}

export interface AllocationSimulation {
  monthlyIncome: number;
  allocations: {
    name: string;
    percentage: number;
    amount: number;
    color?: string;
  }[];
  totalAllocated: number;
  remaining: number;
}

export interface AllocationAlert {
  type: 'warning' | 'critical';
  message: string;
  allocation?: string;
}

// ============================================
// SERVIÇO
// ============================================

export const budgetAllocationService = {
  /**
   * Obtém alocações padrão do sistema
   */
  getDefaults: async (): Promise<AllocationCategory[]> => {
    const { data } = await api.get('/allocations/defaults');
    return data.data;
  },

  /**
   * Lista perfis do usuário
   */
  listProfiles: async (dashboardId?: string): Promise<AllocationProfile[]> => {
    const params = dashboardId ? { dashboardId } : {};
    const { data } = await api.get('/allocations/profiles', { params });
    return data.data;
  },

  /**
   * Obtém perfil específico
   */
  getProfile: async (profileId: string): Promise<AllocationProfile> => {
    const { data } = await api.get(`/allocations/profiles/${profileId}`);
    return data.data;
  },

  /**
   * Obtém perfil padrão do usuário (cria se não existir)
   */
  getDefaultProfile: async (dashboardId?: string): Promise<AllocationProfile> => {
    const params = dashboardId ? { dashboardId } : {};
    const { data } = await api.get('/allocations/profiles/default', { params });
    return data.data;
  },

  /**
   * Cria novo perfil
   */
  createProfile: async (profile: AllocationProfile): Promise<AllocationProfile> => {
    const { data } = await api.post('/allocations/profiles', profile);
    return data.data;
  },

  /**
   * Cria perfil com alocações padrão
   */
  createDefaultProfile: async (dashboardId?: string): Promise<AllocationProfile> => {
    const { data } = await api.post('/allocations/profiles/default', { dashboardId });
    return data.data;
  },

  /**
   * Atualiza perfil
   */
  updateProfile: async (profileId: string, updates: Partial<AllocationProfile>): Promise<AllocationProfile> => {
    const { data } = await api.put(`/allocations/profiles/${profileId}`, updates);
    return data.data;
  },

  /**
   * Deleta perfil
   */
  deleteProfile: async (profileId: string): Promise<void> => {
    await api.delete(`/allocations/profiles/${profileId}`);
  },

  /**
   * Analisa gastos vs alocações
   */
  analyzeAllocations: async (
    dashboardId: string,
    options?: { profileId?: string; startDate?: string; endDate?: string }
  ): Promise<AllocationAnalysis> => {
    const { data } = await api.get(`/allocations/analysis/${dashboardId}`, { params: options });
    return data.data;
  },

  /**
   * Obtém alertas de alocação
   */
  getAlerts: async (dashboardId: string): Promise<AllocationAlert[]> => {
    const { data } = await api.get(`/allocations/alerts/${dashboardId}`);
    return data.data;
  },

  /**
   * Simula alocações
   */
  simulate: async (monthlyIncome: number, allocations?: AllocationCategory[]): Promise<AllocationSimulation> => {
    const { data } = await api.post('/allocations/simulate', { monthlyIncome, allocations });
    return data.data;
  },

  /**
   * Obtém recomendações de IA
   */
  getAIRecommendations: async (dashboardId: string, monthlyIncome: number): Promise<string> => {
    const { data } = await api.get(`/allocations/ai/recommendations/${dashboardId}`, {
      params: { monthlyIncome },
    });
    return data.data.recommendations;
  },

  /**
   * Obtém análise completa com IA
   */
  getAIAnalysis: async (dashboardId: string): Promise<{ analysis: AllocationAnalysis; aiInsights: string }> => {
    const { data } = await api.get(`/allocations/ai/analysis/${dashboardId}`);
    return data.data;
  },
};

export default budgetAllocationService;
