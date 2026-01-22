import api from './api';

export interface FinancialSummary {
    period: { start: string; end: string };
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    savingsRate: number;
    categoryBreakdown: {
        category: string;
        amount: number;
        percentage: number;
        transactionCount: number;
    }[];
    trends: {
        category: string;
        currentAmount: number;
        previousAmount: number;
        changePercent: number;
        trend: 'up' | 'down' | 'stable';
    }[];
    unusualTransactions: {
        transactionId: string;
        description: string;
        amount: number;
        category: string;
        date: string;
        reason: string;
        zScore: number;
    }[];
    alerts: string[];
}

export interface AIInsightsResponse {
    insights: string;
    generatedAt: string;
    period: { start: string; end: string };
}

export interface MonthlyBalance {
    month: string;
    income: number;
    expenses: number;
    balance: number;
}

export const analysisService = {
    getSummary: async (dashboardId: string, startDate?: Date, endDate?: Date) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate.toISOString());
        if (endDate) params.append('endDate', endDate.toISOString());

        const response = await api.get<{ success: boolean; data: FinancialSummary }>(
            `/analysis/summary/${dashboardId}?${params.toString()}`
        );
        return response.data.data;
    },

    getInsights: async (dashboardId: string, startDate?: Date, endDate?: Date) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate.toISOString());
        if (endDate) params.append('endDate', endDate.toISOString());

        const response = await api.get<{ success: boolean; data: AIInsightsResponse }>(
            `/analysis/insights/${dashboardId}?${params.toString()}`
        );
        return response.data.data;
    },

    getMonthlyBalance: async (dashboardId: string, months: number = 6) => {
        const response = await api.get<{ success: boolean; data: MonthlyBalance[] }>(
            `/analysis/monthly/${dashboardId}?months=${months}`
        );
        return response.data.data;
    },

    getAIStatus: async () => {
        const response = await api.get<{
            success: boolean;
            data: {
                providers: { gemini: boolean; groq: boolean };
                preferredForText: string;
                preferredForImages: string;
            };
        }>('/analysis/ai-status');
        return response.data.data;
    }
};
