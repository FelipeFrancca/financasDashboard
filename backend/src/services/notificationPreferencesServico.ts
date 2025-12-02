import { prisma } from '../database/conexao';

// Get user's notification preferences
export const getNotificationPreferences = async (userId: string) => {
    let preferences = await prisma.notificationPreferences.findUnique({
        where: { userId },
    });

    // If preferences don't exist, create default ones
    if (!preferences) {
        preferences = await prisma.notificationPreferences.create({
            data: { userId },
        });
    }

    return preferences;
};

// Update notification preferences
export const updateNotificationPreferences = async (
    userId: string,
    data: {
        emailEnabled?: boolean;
        emailBudgetAlerts?: boolean;
        emailGoalMilestones?: boolean;
        emailWeeklySummary?: boolean;
        emailMonthlySummary?: boolean;
        emailLargeTransactions?: boolean;
        emailDashboardInvites?: boolean;
        emailSystemUpdates?: boolean;
        inAppEnabled?: boolean;
        inAppBudgetAlerts?: boolean;
        inAppGoalMilestones?: boolean;
        inAppDashboardActivity?: boolean;
        inAppDashboardInvites?: boolean;
        largeTransactionAmount?: number;
        budgetAlertPercentage?: number;
        summaryDay?: number;
    }
) => {
    // Ensure preferences exist
    await getNotificationPreferences(userId);

    // Update preferences
    const updated = await prisma.notificationPreferences.update({
        where: { userId },
        data,
    });

    return updated;
};
