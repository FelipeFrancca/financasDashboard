import { prisma } from '../database/conexao';
const levenshtein = require('fast-levenshtein');

interface ItemStats {
    name: string;
    totalQuantity: number;
    totalAmount: number;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    frequency: number;
}

export async function getItemStats(dashboardId: string, filters: any): Promise<ItemStats[]> {
    const where: any = {
        dashboardId,
        deletedAt: null,
    };

    if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
            where.date.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            where.date.lte = new Date(filters.endDate);
        }
    }

    // Fetch all items from transactions in the dashboard
    const items = await prisma.transactionItem.findMany({
        where: {
            transaction: where,
        },
        include: {
            transaction: {
                select: { date: true },
            },
        },
    });

    // Group items using fuzzy matching
    const groupedItems: Record<string, ItemStats> = {};
    const processedNames: string[] = [];

    for (const item of items) {
        const normalizedName = normalizeName(item.description);
        let groupName = normalizedName;

        // Check against existing groups for similarity
        let foundMatch = false;
        for (const existingName of processedNames) {
            // Skip comparison if length difference is too big to match
            if (Math.abs(normalizedName.length - existingName.length) > 3) continue;

            const distance = levenshtein.get(normalizedName, existingName);
            const maxLength = Math.max(normalizedName.length, existingName.length);
            const similarity = 1 - distance / maxLength;

            // Threshold for similarity (e.g., 80%)
            if (similarity > 0.8) {
                groupName = existingName;
                foundMatch = true;
                break;
            }
        }

        if (!foundMatch) {
            processedNames.push(normalizedName);
        }

        if (!groupedItems[groupName]) {
            groupedItems[groupName] = {
                name: capitalizeWords(groupName), // Use a pretty name
                totalQuantity: 0,
                totalAmount: 0,
                averagePrice: 0,
                minPrice: Infinity,
                maxPrice: -Infinity,
                frequency: 0,
            };
        }

        const unitPrice = item.unitPrice || (item.quantity > 0 ? item.totalPrice / item.quantity : 0);

        const stats = groupedItems[groupName];
        stats.totalQuantity += item.quantity;
        stats.totalAmount += item.totalPrice;
        stats.frequency += 1;
        stats.minPrice = Math.min(stats.minPrice, unitPrice);
        stats.maxPrice = Math.max(stats.maxPrice, unitPrice);
    }

    // Calculate averages and format result
    return Object.values(groupedItems).map(stats => ({
        ...stats,
        averagePrice: stats.totalQuantity > 0 ? stats.totalAmount / stats.totalQuantity : 0,
        minPrice: stats.minPrice === Infinity ? 0 : stats.minPrice,
        maxPrice: stats.maxPrice === -Infinity ? 0 : stats.maxPrice,
    })).sort((a, b) => b.totalAmount - a.totalAmount); // Sort by total spent by default
}

function normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, l => l.toUpperCase());
}
