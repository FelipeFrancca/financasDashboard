/**
 * Budget Allocation Service
 * Serviço para gerenciar alocações de orçamento por porcentagem
 * 
 * Permite que usuários definam regras personalizadas de distribuição
 * da receita mensal em categorias (ex: 50% fixas, 20% lazer, etc.)
 * 
 * NOTA: Os modelos BudgetAllocationProfile e BudgetAllocation precisam ser gerados
 * pelo Prisma após aplicar a migration. Execute: npx prisma migrate dev
 */

import { prisma } from '../database/conexao';
import { logger } from '../utils/logger';
import { aiRouter } from './aiRouterServico';

// Cast do prisma para suportar os novos modelos antes da regeneração do client
const db = prisma as any;

// ============================================
// TIPOS E INTERFACES
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
        start: Date;
        end: Date;
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

// ============================================
// ALOCAÇÕES PADRÃO
// ============================================

export const DEFAULT_ALLOCATIONS: AllocationCategory[] = [
    {
        name: 'Despesas Fixas',
        percentage: 50,
        color: '#EF4444', // red-500
        icon: 'home',
        order: 1,
        linkedCategories: ['Moradia', 'Contas', 'Transporte', 'Saúde', 'Seguros', 'Educação Básica'],
    },
    {
        name: 'Lazer',
        percentage: 20,
        color: '#8B5CF6', // violet-500
        icon: 'gamepad-2',
        order: 2,
        linkedCategories: ['Entretenimento', 'Lazer', 'Restaurantes', 'Delivery', 'Viagens', 'Hobbies'],
    },
    {
        name: 'Investimentos',
        percentage: 10,
        color: '#10B981', // emerald-500
        icon: 'trending-up',
        order: 3,
        linkedCategories: ['Investimentos', 'Poupança', 'Reserva de Emergência', 'Previdência'],
    },
    {
        name: 'Estudos',
        percentage: 10,
        color: '#3B82F6', // blue-500
        icon: 'book-open',
        order: 4,
        linkedCategories: ['Educação', 'Cursos', 'Livros', 'Certificações', 'Treinamentos'],
    },
    {
        name: 'Cuidados Pessoais',
        percentage: 10,
        color: '#F59E0B', // amber-500
        icon: 'heart',
        order: 5,
        linkedCategories: ['Saúde', 'Beleza', 'Academia', 'Bem-estar', 'Vestuário'],
    },
];

// ============================================
// SERVIÇO PRINCIPAL
// ============================================

class BudgetAllocationService {
    /**
     * Cria um novo perfil de alocação para o usuário
     */
    async createProfile(
        userId: string,
        profile: AllocationProfile
    ): Promise<AllocationProfile> {
        if (!userId) {
            throw new Error('userId é obrigatório para criar um perfil de alocação');
        }

        logger.info(`Criando perfil de alocação '${profile.name}' para usuário ${userId}`, 'BudgetAllocation');

        // Validar que as porcentagens somam 100
        const totalPercentage = profile.allocations.reduce((sum, a) => sum + a.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
            throw new Error(`A soma das porcentagens deve ser 100%. Atual: ${totalPercentage}%`);
        }

        // Se for perfil padrão, desmarcar outros perfis padrão do usuário
        if (profile.isDefault) {
            await db.budgetAllocationProfile.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        const created = await db.budgetAllocationProfile.create({
            data: {
                name: profile.name,
                description: profile.description,
                isDefault: profile.isDefault ?? false,
                isActive: profile.isActive ?? true,
                userId,
                dashboardId: profile.dashboardId,
                allocations: {
                    create: profile.allocations.map((a, index) => ({
                        name: a.name,
                        percentage: a.percentage,
                        color: a.color,
                        icon: a.icon,
                        order: a.order ?? index,
                        linkedCategories: a.linkedCategories ?? [],
                    })),
                },
            },
            include: {
                allocations: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        logger.info(`Perfil '${created.name}' criado com ID ${created.id}`, 'BudgetAllocation');

        return this.mapProfileToDto(created);
    }

    /**
     * Cria perfil com alocações padrão
     */
    async createDefaultProfile(
        userId: string,
        dashboardId?: string
    ): Promise<AllocationProfile> {
        return this.createProfile(userId, {
            name: 'Padrão',
            description: 'Perfil de alocação padrão baseado na regra 50/30/20 adaptada',
            isDefault: true,
            dashboardId,
            allocations: DEFAULT_ALLOCATIONS,
        });
    }

    /**
     * Obtém perfil de alocação por ID
     */
    async getProfile(profileId: string, userId: string): Promise<AllocationProfile | null> {
        const profile = await db.budgetAllocationProfile.findFirst({
            where: { id: profileId, userId },
            include: {
                allocations: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        return profile ? this.mapProfileToDto(profile) : null;
    }

    /**
     * Obtém o perfil padrão do usuário
     */
    async getDefaultProfile(userId: string, dashboardId?: string): Promise<AllocationProfile | null> {
        const profile = await db.budgetAllocationProfile.findFirst({
            where: {
                userId,
                isDefault: true,
                isActive: true,
                ...(dashboardId && { dashboardId }),
            },
            include: {
                allocations: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        return profile ? this.mapProfileToDto(profile) : null;
    }

    /**
     * Lista todos os perfis do usuário
     */
    async listProfiles(userId: string, dashboardId?: string): Promise<AllocationProfile[]> {
        const profiles = await db.budgetAllocationProfile.findMany({
            where: {
                userId,
                ...(dashboardId && { dashboardId }),
            },
            include: {
                allocations: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        return profiles.map((p: any) => this.mapProfileToDto(p));
    }

    /**
     * Atualiza um perfil de alocação
     */
    async updateProfile(
        profileId: string,
        userId: string,
        updates: Partial<AllocationProfile>
    ): Promise<AllocationProfile> {
        logger.info(`Atualizando perfil ${profileId}`, 'BudgetAllocation');

        // Verificar propriedade
        const existing = await db.budgetAllocationProfile.findFirst({
            where: { id: profileId, userId },
        });

        if (!existing) {
            throw new Error('Perfil não encontrado');
        }

        // Se estiver atualizando alocações, validar soma
        if (updates.allocations) {
            const totalPercentage = updates.allocations.reduce((sum, a) => sum + a.percentage, 0);
            if (Math.abs(totalPercentage - 100) > 0.01) {
                throw new Error(`A soma das porcentagens deve ser 100%. Atual: ${totalPercentage}%`);
            }
        }

        // Se for definir como padrão, desmarcar outros
        if (updates.isDefault) {
            await db.budgetAllocationProfile.updateMany({
                where: { userId, isDefault: true, id: { not: profileId } },
                data: { isDefault: false },
            });
        }

        // Atualizar perfil
        const updated = await db.budgetAllocationProfile.update({
            where: { id: profileId },
            data: {
                ...(updates.name && { name: updates.name }),
                ...(updates.description !== undefined && { description: updates.description }),
                ...(updates.isDefault !== undefined && { isDefault: updates.isDefault }),
                ...(updates.isActive !== undefined && { isActive: updates.isActive }),
            },
            include: {
                allocations: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        // Se atualizando alocações, deletar antigas e criar novas
        if (updates.allocations) {
            await db.budgetAllocation.deleteMany({
                where: { profileId },
            });

            await db.budgetAllocation.createMany({
                data: updates.allocations.map((a, index) => ({
                    profileId,
                    name: a.name,
                    percentage: a.percentage,
                    color: a.color,
                    icon: a.icon,
                    order: a.order ?? index,
                    linkedCategories: a.linkedCategories ?? [],
                })),
            });
        }

        // Buscar novamente para retornar atualizado
        const final = await db.budgetAllocationProfile.findUnique({
            where: { id: profileId },
            include: {
                allocations: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        return this.mapProfileToDto(final!);
    }

    /**
     * Deleta um perfil de alocação
     */
    async deleteProfile(profileId: string, userId: string): Promise<void> {
        const existing = await db.budgetAllocationProfile.findFirst({
            where: { id: profileId, userId },
        });

        if (!existing) {
            throw new Error('Perfil não encontrado');
        }

        await db.budgetAllocationProfile.delete({
            where: { id: profileId },
        });

        logger.info(`Perfil ${profileId} deletado`, 'BudgetAllocation');
    }

    /**
     * Analisa gastos reais vs alocações planejadas
     */
    async analyzeAllocations(
        userId: string,
        dashboardId: string,
        profileId?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<AllocationAnalysis> {
        // Obter período (padrão: mês atual)
        const now = new Date();
        const periodStart = startDate ?? new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Obter perfil (padrão ou específico)
        let profile;
        if (profileId) {
            profile = await this.getProfile(profileId, userId);
        } else {
            profile = await this.getDefaultProfile(userId, dashboardId);
        }

        if (!profile) {
            // Criar perfil padrão se não existir
            profile = await this.createDefaultProfile(userId, dashboardId);
        }

        // Buscar transações do período
        const transactions = await prisma.transaction.findMany({
            where: {
                dashboardId,
                date: { gte: periodStart, lte: periodEnd },
                deletedAt: null,
            },
        });

        // Calcular receita total
        const totalIncome = transactions
            .filter(t => t.entryType === 'Receita')
            .reduce((sum, t) => sum + t.amount, 0);

        // Calcular despesas por categoria
        const expenses = transactions.filter(t => t.entryType === 'Despesa');
        const expensesByCategory = new Map<string, number>();
        
        expenses.forEach(t => {
            const current = expensesByCategory.get(t.category) || 0;
            expensesByCategory.set(t.category, current + t.amount);
        });

        // Criar Set para rastrear transações já contabilizadas (evitar duplicação)
        const countedTransactions = new Set<string>();

        // Mapear despesas para alocações
        const allocationsAnalysis = profile.allocations!.map(allocation => {
            const matchedCategories = allocation.linkedCategories || [];
            let actualAmount = 0;
            let matchedTransactions = 0;

            // PRIORIDADE 1: Transações com flowType igual ao nome da alocação (seleção direta no formulário)
            expenses.forEach(t => {
                if (countedTransactions.has(t.id)) return; // Já contabilizada
                
                if (t.flowType === allocation.name) {
                    actualAmount += t.amount;
                    matchedTransactions++;
                    countedTransactions.add(t.id);
                }
            });

            // PRIORIDADE 2: Buscar por categorias vinculadas (para transações antigas ou sem alocação direta)
            matchedCategories.forEach(cat => {
                expenses.forEach(t => {
                    if (countedTransactions.has(t.id)) return; // Já contabilizada
                    
                    if (t.category.toLowerCase().includes(cat.toLowerCase()) ||
                        cat.toLowerCase().includes(t.category.toLowerCase())) {
                        actualAmount += t.amount;
                        matchedTransactions++;
                        countedTransactions.add(t.id);
                    }
                });
            });

            // PRIORIDADE 3: Se não há categorias vinculadas, tentar match por nome da categoria
            if (matchedCategories.length === 0) {
                expenses.forEach(t => {
                    if (countedTransactions.has(t.id)) return; // Já contabilizada
                    
                    if (t.category.toLowerCase().includes(allocation.name.toLowerCase())) {
                        actualAmount += t.amount;
                        matchedTransactions++;
                        countedTransactions.add(t.id);
                    }
                });
            }

            const targetAmount = totalIncome * (allocation.percentage / 100);
            const actualPercentage = totalIncome > 0 ? (actualAmount / totalIncome) * 100 : 0;
            const difference = targetAmount - actualAmount;
            const differencePercentage = allocation.percentage - actualPercentage;

            let status: 'under' | 'on_track' | 'over' = 'on_track';
            if (differencePercentage > 5) status = 'under';
            else if (differencePercentage < -5) status = 'over';

            return {
                name: allocation.name,
                targetPercentage: allocation.percentage,
                targetAmount,
                actualAmount,
                actualPercentage,
                difference,
                differencePercentage,
                status,
                linkedCategories: matchedCategories,
                matchedTransactions,
            };
        });

        // Calcular despesas não alocadas (transações que não foram contabilizadas em nenhuma alocação)
        const allocatedCategories = new Set<string>();
        profile.allocations!.forEach(a => {
            allocatedCategories.add(a.name.toLowerCase()); // Adiciona o nome da alocação
            (a.linkedCategories || []).forEach(cat => allocatedCategories.add(cat.toLowerCase()));
        });

        const totalAllocated = allocationsAnalysis.reduce((sum, a) => sum + a.actualAmount, 0);
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
        const totalUnallocated = totalExpenses - totalAllocated;

        // Agrupar despesas não contabilizadas por categoria
        const unallocatedByCategory = new Map<string, number>();
        expenses.forEach(t => {
            if (!countedTransactions.has(t.id)) {
                const current = unallocatedByCategory.get(t.category) || 0;
                unallocatedByCategory.set(t.category, current + t.amount);
            }
        });

        const unallocatedExpenses: { category: string; amount: number; percentage: number }[] = [];
        unallocatedByCategory.forEach((amount, category) => {
            unallocatedExpenses.push({
                category,
                amount,
                percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
            });
        });

        // Determinar status geral
        let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
        const overAllocations = allocationsAnalysis.filter(a => a.status === 'over').length;
        if (overAllocations >= 3 || totalUnallocated > totalIncome * 0.2) {
            overallStatus = 'critical';
        } else if (overAllocations >= 1 || totalUnallocated > totalIncome * 0.1) {
            overallStatus = 'warning';
        }

        return {
            profileId: profile.id!,
            profileName: profile.name,
            period: {
                start: periodStart,
                end: periodEnd,
            },
            totalIncome,
            allocations: allocationsAnalysis,
            unallocatedExpenses: unallocatedExpenses.sort((a, b) => b.amount - a.amount),
            summary: {
                totalAllocated,
                totalUnallocated,
                overallStatus,
            },
        };
    }

    /**
     * Simula alocações com base em uma receita
     */
    simulateAllocations(
        monthlyIncome: number,
        allocations: AllocationCategory[]
    ): AllocationSimulation {
        const simulatedAllocations = allocations.map(a => ({
            name: a.name,
            percentage: a.percentage,
            amount: monthlyIncome * (a.percentage / 100),
            color: a.color,
        }));

        const totalAllocated = simulatedAllocations.reduce((sum, a) => sum + a.amount, 0);

        return {
            monthlyIncome,
            allocations: simulatedAllocations,
            totalAllocated,
            remaining: monthlyIncome - totalAllocated,
        };
    }

    /**
     * Gera recomendações de alocação com IA
     */
    async getAIRecommendations(
        userId: string,
        dashboardId: string,
        monthlyIncome: number
    ): Promise<string> {
        // Buscar histórico de gastos
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

        const transactions = await prisma.transaction.findMany({
            where: {
                dashboardId,
                date: { gte: threeMonthsAgo },
                deletedAt: null,
            },
        });

        // Calcular médias por categoria
        const expensesByCategory = new Map<string, number[]>();
        
        transactions
            .filter(t => t.entryType === 'Despesa')
            .forEach(t => {
                const current = expensesByCategory.get(t.category) || [];
                current.push(t.amount);
                expensesByCategory.set(t.category, current);
            });

        const categoryAverages: { category: string; average: number }[] = [];
        expensesByCategory.forEach((amounts, category) => {
            categoryAverages.push({
                category,
                average: amounts.reduce((a, b) => a + b, 0) / 3, // Média mensal
            });
        });

        // Gerar prompt para IA
        const systemPrompt = `Você é um consultor financeiro especializado em orçamento pessoal.
Analise o histórico de gastos do usuário e sugira uma distribuição ideal de orçamento.
Use a regra 50/30/20 como base, mas adapte conforme o perfil de gastos observado.
Seja específico e prático nas recomendações.
Responda em português brasileiro.`;

        const userPrompt = `Com base nos dados abaixo, sugira uma distribuição de orçamento personalizada:

**Receita Mensal:** R$ ${monthlyIncome.toFixed(2)}

**Média de Gastos por Categoria (últimos 3 meses):**
${categoryAverages
    .sort((a, b) => b.average - a.average)
    .slice(0, 10)
    .map(c => `- ${c.category}: R$ ${c.average.toFixed(2)}/mês`)
    .join('\n')}

Por favor, sugira:
1. Distribuição percentual ideal entre categorias principais (despesas fixas, lazer, investimentos, etc.)
2. Quais categorias precisam de mais atenção/redução
3. Metas realistas para os próximos 3 meses
4. Uma sugestão específica de economia baseada no perfil`;

        return aiRouter.generateText(systemPrompt, userPrompt, 'recommendations');
    }

    /**
     * Obtém alertas de alocação
     */
    async getAllocationAlerts(
        userId: string,
        dashboardId: string
    ): Promise<{ type: 'warning' | 'critical'; message: string; allocation?: string }[]> {
        if (!userId) {
            logger.warn('getAllocationAlerts chamado sem userId', 'BudgetAllocation');
            return [];
        }

        const analysis = await this.analyzeAllocations(userId, dashboardId);
        const alerts: { type: 'warning' | 'critical'; message: string; allocation?: string }[] = [];

        // Alertas de alocações acima do limite
        analysis.allocations
            .filter(a => a.status === 'over')
            .forEach(a => {
                const overBy = Math.abs(a.differencePercentage).toFixed(1);
                alerts.push({
                    type: a.differencePercentage < -15 ? 'critical' : 'warning',
                    message: `"${a.name}" está ${overBy}% acima do planejado`,
                    allocation: a.name,
                });
            });

        // Alerta de despesas não classificadas
        if (analysis.summary.totalUnallocated > analysis.totalIncome * 0.1) {
            const percentage = ((analysis.summary.totalUnallocated / analysis.totalIncome) * 100).toFixed(1);
            alerts.push({
                type: 'warning',
                message: `${percentage}% dos gastos não estão classificados em nenhuma alocação`,
            });
        }

        // Alerta de status crítico
        if (analysis.summary.overallStatus === 'critical') {
            alerts.push({
                type: 'critical',
                message: 'Seu orçamento está muito fora do planejado este mês',
            });
        }

        return alerts;
    }

    /**
     * Mapeador de modelo Prisma para DTO
     */
    private mapProfileToDto(profile: any): AllocationProfile {
        return {
            id: profile.id,
            name: profile.name,
            description: profile.description,
            isDefault: profile.isDefault,
            isActive: profile.isActive,
            dashboardId: profile.dashboardId,
            allocations: profile.allocations.map((a: any) => ({
                id: a.id,
                name: a.name,
                percentage: a.percentage,
                color: a.color,
                icon: a.icon,
                order: a.order,
                linkedCategories: a.linkedCategories,
            })),
        };
    }
}

// Exportar instância singleton
export const budgetAllocationService = new BudgetAllocationService();
