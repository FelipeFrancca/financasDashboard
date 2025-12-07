/**
 * Hook to check user permissions for the current dashboard
 * Returns permission flags based on the user's role
 */

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDashboards } from './useDashboards';

export type DashboardRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface DashboardPermissions {
    /** User's role in the current dashboard */
    role: DashboardRole | null;
    /** True if user is the owner of the dashboard */
    isOwner: boolean;
    /** True if user can edit (owner or editor) */
    canEdit: boolean;
    /** True if user can only view */
    isViewer: boolean;
    /** True if permissions are still loading */
    isLoading: boolean;
    /** The current dashboard object */
    currentDashboard: any | null;
}

/**
 * Returns permission information for the current dashboard
 * Automatically reads dashboardId from URL params
 */
export function useDashboardPermissions(): DashboardPermissions {
    const { dashboardId } = useParams<{ dashboardId: string }>();
    const { data: dashboards = [], isLoading } = useDashboards();

    return useMemo(() => {
        if (!dashboardId || isLoading) {
            return {
                role: null,
                isOwner: false,
                canEdit: false,
                isViewer: false,
                isLoading,
                currentDashboard: null,
            };
        }

        const currentDashboard = dashboards.find((d: any) => d.id === dashboardId);

        if (!currentDashboard) {
            return {
                role: null,
                isOwner: false,
                canEdit: false,
                isViewer: false,
                isLoading: false,
                currentDashboard: null,
            };
        }

        const role = currentDashboard.role as DashboardRole;
        const isOwner = currentDashboard.isOwner === true || role === 'OWNER';
        const canEdit = isOwner || role === 'EDITOR';
        const isViewer = role === 'VIEWER';

        return {
            role,
            isOwner,
            canEdit,
            isViewer,
            isLoading: false,
            currentDashboard,
        };
    }, [dashboardId, dashboards, isLoading]);
}

/**
 * Hook that returns permission for a specific dashboard ID
 * Use this when dashboardId is not in URL params
 */
export function useDashboardPermissionsById(dashboardId: string | undefined): DashboardPermissions {
    const { data: dashboards = [], isLoading } = useDashboards();

    return useMemo(() => {
        if (!dashboardId || isLoading) {
            return {
                role: null,
                isOwner: false,
                canEdit: false,
                isViewer: false,
                isLoading,
                currentDashboard: null,
            };
        }

        const currentDashboard = dashboards.find((d: any) => d.id === dashboardId);

        if (!currentDashboard) {
            return {
                role: null,
                isOwner: false,
                canEdit: false,
                isViewer: false,
                isLoading: false,
                currentDashboard: null,
            };
        }

        const role = currentDashboard.role as DashboardRole;
        const isOwner = currentDashboard.isOwner === true || role === 'OWNER';
        const canEdit = isOwner || role === 'EDITOR';
        const isViewer = role === 'VIEWER';

        return {
            role,
            isOwner,
            canEdit,
            isViewer,
            isLoading: false,
            currentDashboard,
        };
    }, [dashboardId, dashboards, isLoading]);
}
