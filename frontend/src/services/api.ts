import axios from 'axios';
import type { Transaction, TransactionFilters, StatsSummary } from '../types';

// Use URL relativa quando VITE_API_URL não está definida (produção)
const API_BASE_URL = import.meta.env.VITE_API_URL === undefined || import.meta.env.VITE_API_URL === ''
  ? ''
  : import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      // Basic JWT validation: should have 3 parts separated by dots
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Token is malformed, clean it up
        console.warn('Malformed token detected, cleaning up storage');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
      }
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
        const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh the token
        const { data } = await api.post('/auth/refresh', { refreshToken });

        // Save to the storage where it was found, or default to local
        if (sessionStorage.getItem('refreshToken')) {
          sessionStorage.setItem('accessToken', data.accessToken);
          sessionStorage.setItem('refreshToken', data.refreshToken);
        } else {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
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
    return data.data;
  },

  register: async (email: string, password: string, name?: string) => {
    const { data } = await api.post('/auth/register', { email, password, name });
    return data.data;
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
    return data.data;
  },

  refreshToken: async (refreshToken: string) => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data.data;
  },
};

export const transactionService = {
  getAll: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    const { data } = await api.get('/transactions', { params: filters });
    return data.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const { data } = await api.get(`/transactions/${id}`);
    return data.data;
  },

  create: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> => {
    const { data } = await api.post('/transactions', transaction);
    return data.data;
  },

  createMany: async (transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ count: number; transactions: Transaction[] }> => {
    const { data } = await api.post('/transactions/bulk', transactions);
    return data.data;
  },

  update: async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    const { data } = await api.put(`/transactions/${id}`, transaction);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  getStats: async (filters?: TransactionFilters): Promise<StatsSummary> => {
    const { data } = await api.get('/transactions/stats/summary', { params: filters });
    return data.data;
  },
};

export const dashboardService = {
  list: async () => {
    const { data } = await api.get('/dashboards');
    return data.data;
  },

  create: async (title: string, description?: string) => {
    const { data } = await api.post('/dashboards', { title, description });
    return data.data;
  },

  createInvite: async (dashboardId: string, opts?: { role?: 'VIEWER' | 'EDITOR'; expiresAt?: string; isOneTime?: boolean }) => {
    const { data } = await api.post(`/dashboards/${dashboardId}/invites`, opts || {});
    return data.data;
  },

  acceptInvite: async (code: string) => {
    const { data } = await api.post('/dashboards/accept-invite', { code });
    return data.data;
  },

  getSharedPreview: async (code: string) => {
    const { data } = await api.get(`/dashboards/shared/${code}`);
    return data.data;
  }
};

export const categoryService = {
  getAll: async (dashboardId: string) => {
    const { data } = await api.get('/categories', { params: { dashboardId } });
    // Backend may return paginated response { data: { data: [...], total: number } } or direct array
    return data.data?.data || data.data || [];
  },
  create: async (category: any, dashboardId: string) => {
    const { data } = await api.post('/categories', { ...category, dashboardId });
    return data.data;
  },
  update: async (id: string, category: any, dashboardId: string) => {
    const { data } = await api.put(`/categories/${id}`, { ...category, dashboardId });
    return data.data;
  },
  delete: async (id: string, dashboardId: string) => {
    await api.delete(`/categories/${id}?dashboardId=${dashboardId}`);
  }
};

export const accountService = {
  getAll: async (dashboardId: string) => {
    const { data } = await api.get('/accounts', { params: { dashboardId } });
    // Backend returns { success: true, data: { data: [...], total: number } }
    return data.data?.data || data.data || [];
  },
  create: async (account: any, dashboardId: string) => {
    const { data } = await api.post('/accounts', { ...account, dashboardId });
    return data.data;
  },
  update: async (id: string, account: any, dashboardId: string) => {
    const { data } = await api.put(`/accounts/${id}`, { ...account, dashboardId });
    return data.data;
  },
  delete: async (id: string, dashboardId: string) => {
    await api.delete(`/accounts/${id}?dashboardId=${dashboardId}`);
  }
};

export const goalService = {
  getAll: async (dashboardId: string) => {
    const { data } = await api.get('/goals', { params: { dashboardId } });
    return data.data;
  },
  create: async (goal: any, dashboardId: string) => {
    const { data } = await api.post('/goals', { ...goal, dashboardId });
    return data.data;
  },
  update: async (id: string, goal: any, dashboardId: string) => {
    const { data } = await api.put(`/goals/${id}`, { ...goal, dashboardId });
    return data.data;
  },
  delete: async (id: string, dashboardId: string) => {
    await api.delete(`/goals/${id}?dashboardId=${dashboardId}`);
  }
};

export const budgetService = {
  getAll: async (dashboardId: string) => {
    const { data } = await api.get('/budgets', { params: { dashboardId } });
    // Backend returns { success: true, data: { data: Budget[], total: number } }
    return data.data?.data || data.data || [];
  },
  create: async (budget: any, dashboardId: string) => {
    const { data } = await api.post('/budgets', { ...budget, dashboardId });
    return data.data;
  },
  update: async (id: string, budget: any, dashboardId: string) => {
    const { data } = await api.put(`/budgets/${id}`, { ...budget, dashboardId });
    return data.data;
  },
  delete: async (id: string, dashboardId: string) => {
    await api.delete(`/budgets/${id}?dashboardId=${dashboardId}`);
  }
};

export const recurrenceService = {
  getAll: async (dashboardId: string) => {
    const { data } = await api.get('/recurrences', { params: { dashboardId } });
    return data.data;
  },
  create: async (recurrence: any, dashboardId: string) => {
    const { data } = await api.post('/recurrences', { ...recurrence, dashboardId });
    return data.data;
  },
  update: async (id: string, recurrence: any, dashboardId: string) => {
    const { data } = await api.put(`/recurrences/${id}`, { ...recurrence, dashboardId });
    return data.data;
  },
  delete: async (id: string, dashboardId: string) => {
    await api.delete(`/recurrences/${id}?dashboardId=${dashboardId}`);
  }
};

export const transferService = {
  getAll: async (dashboardId: string) => {
    const { data } = await api.get('/transfers', { params: { dashboardId } });
    return data.data?.data || data.data || [];
  },
  create: async (transfer: any, dashboardId: string) => {
    const { data } = await api.post('/transfers', { ...transfer, dashboardId });
    return data.data;
  },
  delete: async (id: string, dashboardId: string) => {
    await api.delete(`/transfers/${id}?dashboardId=${dashboardId}`);
  }
};

export const alertService = {
  getAll: async (dashboardId: string) => {
    const { data } = await api.get('/alerts', { params: { dashboardId } });
    return data.data;
  },
  markAsRead: async (id: string, dashboardId: string) => {
    const { data } = await api.put(`/alerts/${id}/read`, { dashboardId });
    return data.data;
  },
  delete: async (id: string, dashboardId: string) => {
    await api.delete(`/alerts/${id}?dashboardId=${dashboardId}`);
  }
};

export const ingestionService = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/ingestion/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },
};

export default api;
