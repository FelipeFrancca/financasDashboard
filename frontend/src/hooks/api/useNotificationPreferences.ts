import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export interface NotificationPreferences {
    id: string;
    userId: string;
    // Email notifications
    emailEnabled: boolean;
    emailBudgetAlerts: boolean;
    emailGoalMilestones: boolean;
    emailWeeklySummary: boolean;
    emailMonthlySummary: boolean;
    emailLargeTransactions: boolean;
    emailDashboardInvites: boolean;
    emailSystemUpdates: boolean;
    // In-app notifications
    inAppEnabled: boolean;
    inAppBudgetAlerts: boolean;
    inAppGoalMilestones: boolean;
    inAppDashboardActivity: boolean;
    inAppDashboardInvites: boolean;
    // Thresholds
    largeTransactionAmount: number;
    budgetAlertPercentage: number;
    // Frequency
    summaryDay: number;
    createdAt: string;
    updatedAt: string;
}

// Get user's notification preferences
export const useNotificationPreferences = () => {
    return useQuery({
        queryKey: ['notificationPreferences'],
        queryFn: async () => {
            const response = await api.get('/notification-preferences');
            return response.data.data as NotificationPreferences;
        },
    });
};

// Update notification preferences
export const useUpdateNotificationPreferences = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<NotificationPreferences>) => {
            const response = await api.put('/notification-preferences', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
        },
    });
};
