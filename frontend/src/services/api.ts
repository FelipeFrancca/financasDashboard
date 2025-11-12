import axios from 'axios';
import type { Transaction, TransactionFilters, StatsSummary } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh the token
        const { data } = await api.post('/auth/refresh', { refreshToken });
        
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  register: async (email: string, password: string, name?: string) => {
    const { data } = await api.post('/auth/register', { email, password, name });
    return data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  forgotPassword: async (email: string) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, password: string) => {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  refreshToken: async (refreshToken: string) => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },
};

export const transactionService = {
  getAll: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    const { data } = await api.get('/transactions', { params: filters });
    return data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const { data } = await api.get(`/transactions/${id}`);
    return data;
  },

  create: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> => {
    const { data } = await api.post('/transactions', transaction);
    return data;
  },

  createMany: async (transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ count: number; transactions: Transaction[] }> => {
    const { data } = await api.post('/transactions/bulk', transactions);
    return data;
  },

  update: async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    const { data } = await api.put(`/transactions/${id}`, transaction);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  getStats: async (filters?: TransactionFilters): Promise<StatsSummary> => {
    const { data } = await api.get('/transactions/stats/summary', { params: filters });
    return data;
  },
};

export const dashboardService = {
  list: async () => {
    const { data } = await api.get('/dashboards');
    return data;
  },

  create: async (title: string, description?: string) => {
    const { data } = await api.post('/dashboards', { title, description });
    return data;
  },

  createInvite: async (dashboardId: string, opts?: { role?: 'VIEWER' | 'EDITOR'; expiresAt?: string; isOneTime?: boolean }) => {
    const { data } = await api.post(`/dashboards/${dashboardId}/invites`, opts || {});
    return data;
  },

  acceptInvite: async (code: string) => {
    const { data } = await api.post('/dashboards/accept-invite', { code });
    return data;
  },

  getSharedPreview: async (code: string) => {
    const { data } = await api.get(`/dashboards/shared/${code}`);
    return data;
  }
};
