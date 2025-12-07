import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export interface ItemStats {
    name: string;
    totalQuantity: number;
    totalAmount: number;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    frequency: number;
}

interface ItemStatsFilters {
    startDate?: string;
    endDate?: string;
}

export function useItemStats(dashboardId: string, filters: ItemStatsFilters) {
    return useQuery({
        queryKey: ['item-stats', dashboardId, filters],
        queryFn: async () => {
            const { data } = await api.get<ItemStats[]>(`/dashboards/${dashboardId}/items/stats`, {
                params: filters,
            });
            return data;
        },
        enabled: !!dashboardId,
    });
}
