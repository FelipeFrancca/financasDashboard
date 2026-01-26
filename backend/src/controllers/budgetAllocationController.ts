/**
 * Budget Allocation Controller
 * Endpoints para gerenciar alocações de orçamento por porcentagem
 */

import { Request, Response } from 'express';
import { 
    budgetAllocationService, 
    AllocationProfile, 
    AllocationCategory,
    DEFAULT_ALLOCATIONS 
} from '../services/budgetAllocationServico';
import { aiRouter } from '../services/aiRouterServico';
import { logger } from '../utils/logger';
import { websocketService, WS_EVENTS } from '../services/websocketServico';

// ============================================
// TIPOS
// ============================================

interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

// Helper para extrair userId de forma segura
function getUserId(req: AuthRequest): string {
    const userId = req.user?.userId;
    if (!userId) {
        throw new Error('userId é obrigatório');
    }
    return userId;
}

// ============================================
// CONTROLLERS
// ============================================

/**
 * Obtém alocações padrão do sistema
 */
export async function getDefaultAllocations(req: AuthRequest, res: Response) {
    try {
        res.json({
            success: true,
            data: DEFAULT_ALLOCATIONS,
        });
    } catch (error: any) {
        logger.error(`Erro ao obter alocações padrão: ${error.message}`, 'AllocationController');
        res.status(500).json({
            success: false,
            error: 'Erro ao obter alocações padrão',
        });
    }
}

/**
 * Lista todos os perfis de alocação do usuário
 */
export async function listProfiles(req: AuthRequest, res: Response) {
    try {
        const userId = getUserId(req);
        const { dashboardId } = req.query;

        const profiles = await budgetAllocationService.listProfiles(
            userId,
            dashboardId as string | undefined
        );

        res.json({
            success: true,
            data: profiles,
        });
    } catch (error: any) {
        logger.error(`Erro ao listar perfis: ${error.message}`, 'AllocationController');
        res.status(500).json({
            success: false,
            error: 'Erro ao listar perfis de alocação',
        });
    }
}

/**
 * Obtém um perfil específico
 */
export async function getProfile(req: AuthRequest, res: Response) {
    try {
        const userId = getUserId(req);
        const { profileId } = req.params;

        const profile = await budgetAllocationService.getProfile(profileId, userId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Perfil não encontrado',
            });
        }

        res.json({
            success: true,
            data: profile,
        });
    } catch (error: any) {
        logger.error(`Erro ao obter perfil: ${error.message}`, 'AllocationController');
        res.status(500).json({
            success: false,
            error: 'Erro ao obter perfil de alocação',
        });
    }
}

/**
 * Obtém o perfil padrão do usuário
 */
export async function getDefaultProfile(req: AuthRequest, res: Response) {
    try {
        const userId = getUserId(req);
        const { dashboardId } = req.query;

        let profile = await budgetAllocationService.getDefaultProfile(
            userId,
            dashboardId as string | undefined
        );

        // Se não existir, criar perfil padrão
        if (!profile) {
            profile = await budgetAllocationService.createDefaultProfile(
                userId,
                dashboardId as string | undefined
            );
        }

        res.json({
            success: true,
            data: profile,
        });
    } catch (error: any) {
        logger.error(`Erro ao obter perfil padrão: ${error.message}`, 'AllocationController');
        res.status(500).json({
            success: false,
            error: 'Erro ao obter perfil padrão',
        });
    }
}

/**
 * Cria um novo perfil de alocação
 */
export async function createProfile(req: AuthRequest, res: Response) {
    try {
        const userId = getUserId(req);
        const profileData: AllocationProfile = req.body;

        // Validações básicas
        if (!profileData.name) {
            return res.status(400).json({
                success: false,
                error: 'Nome do perfil é obrigatório',
            });
        }

        if (!profileData.allocations || profileData.allocations.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'O perfil deve ter pelo menos uma alocação',
            });
        }

        // Validar porcentagens
        const totalPercentage = profileData.allocations.reduce((sum, a) => sum + a.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
            return res.status(400).json({
                success: false,
                error: `A soma das porcentagens deve ser 100%. Atual: ${totalPercentage.toFixed(2)}%`,
            });
        }

        const profile = await budgetAllocationService.createProfile(userId, profileData);

        res.status(201).json({
            success: true,
            data: profile,
            message: 'Perfil criado com sucesso',
        });
    } catch (error: any) {
        logger.error(`Erro ao criar perfil: ${error.message}`, 'AllocationController');
        
        if (error.message.includes('soma das porcentagens')) {
            return res.status(400).json({
                success: false,
                error: error.message,
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erro ao criar perfil de alocação',
        });
    }
}

/**
 * Cria perfil com alocações padrão
 */
export async function createDefaultProfileEndpoint(req: AuthRequest, res: Response) {
    try {
        const userId = getUserId(req);
        const { dashboardId } = req.body;

        const profile = await budgetAllocationService.createDefaultProfile(userId, dashboardId);

        res.status(201).json({
            success: true,
            data: profile,
            message: 'Perfil padrão criado com sucesso',
        });
    } catch (error: any) {
        logger.error(`Erro ao criar perfil padrão: ${error.message}`, 'AllocationController');
        res.status(500).json({
            success: false,
            error: 'Erro ao criar perfil padrão',
        });
    }
}

/**
 * Atualiza um perfil de alocação
 */
export async function updateProfile(req: AuthRequest, res: Response) {
    try {
        const userId = getUserId(req);
        const { profileId } = req.params;
        const updates: Partial<AllocationProfile> = req.body;

        // Validar porcentagens se estiver atualizando alocações
        if (updates.allocations) {
            const totalPercentage = updates.allocations.reduce((sum, a) => sum + a.percentage, 0);
            if (Math.abs(totalPercentage - 100) > 0.01) {
                return res.status(400).json({
                    success: false,
                    error: `A soma das porcentagens deve ser 100%. Atual: ${totalPercentage.toFixed(2)}%`,
                });
            }
        }

        const profile = await budgetAllocationService.updateProfile(profileId, userId, updates);

        // Emitir evento WebSocket se houver dashboardId
        if (profile.dashboardId) {
            websocketService.emitToDashboard(profile.dashboardId, WS_EVENTS.ALLOCATION_UPDATED, {
                profile,
                userId,
            });
        }

        res.json({
            success: true,
            data: profile,
            message: 'Perfil atualizado com sucesso',
        });
    } catch (error: any) {
        logger.error(`Erro ao atualizar perfil: ${error.message}`, 'AllocationController');
        
        if (error.message === 'Perfil não encontrado') {
            return res.status(404).json({
                success: false,
                error: error.message,
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar perfil de alocação',
        });
    }
}

/**
 * Deleta um perfil de alocação
 */
export async function deleteProfile(req: AuthRequest, res: Response) {
    try {
        const userId = getUserId(req);
        const { profileId } = req.params;

        await budgetAllocationService.deleteProfile(profileId, userId);

        res.json({
            success: true,
            message: 'Perfil deletado com sucesso',
        });
    } catch (error: any) {
        logger.error(`Erro ao deletar perfil: ${error.message}`, 'AllocationController');
        
        if (error.message === 'Perfil não encontrado') {
            return res.status(404).json({
                success: false,
                error: error.message,
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erro ao deletar perfil de alocação',
        });
    }
}

/**
 * Analisa gastos vs alocações planejadas
 */
export async function analyzeAllocations(req: AuthRequest, res: Response) {
    try {
        const userId = getUserId(req);
        const { dashboardId } = req.params;
        const { profileId, startDate, endDate } = req.query;

        if (!dashboardId) {
            return res.status(400).json({
                success: false,
                error: 'dashboardId é obrigatório',
            });
        }

        const start = startDate ? new Date(startDate as string) : undefined;
        const end = endDate ? new Date(endDate as string) : undefined;

        const analysis = await budgetAllocationService.analyzeAllocations(
            userId,
            dashboardId,
            profileId as string | undefined,
            start,
            end
        );

        res.json({
            success: true,
            data: analysis,
        });
    } catch (error: any) {
        logger.error(`Erro ao analisar alocações: ${error.message}`, 'AllocationController');
        res.status(500).json({
            success: false,
            error: 'Erro ao analisar alocações',
        });
    }
}

/**
 * Simula alocações com base em receita
 */
export async function simulateAllocations(req: AuthRequest, res: Response) {
    try {
        const { monthlyIncome, allocations } = req.body;

        if (!monthlyIncome || monthlyIncome <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Receita mensal deve ser um valor positivo',
            });
        }

        // Usar alocações fornecidas ou padrão
        const allocs: AllocationCategory[] = allocations || DEFAULT_ALLOCATIONS;

        // Validar porcentagens
        const totalPercentage = allocs.reduce((sum, a) => sum + a.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
            return res.status(400).json({
                success: false,
                error: `A soma das porcentagens deve ser 100%. Atual: ${totalPercentage.toFixed(2)}%`,
            });
        }

        const simulation = budgetAllocationService.simulateAllocations(monthlyIncome, allocs);

        res.json({
            success: true,
            data: simulation,
        });
    } catch (error: any) {
        logger.error(`Erro ao simular alocações: ${error.message}`, 'AllocationController');
        res.status(500).json({
            success: false,
            error: 'Erro ao simular alocações',
        });
    }
}

/**
 * Obtém recomendações de IA para alocações
 */
export async function getAIRecommendations(req: AuthRequest, res: Response) {
    try {
        const userId = getUserId(req);
        const { dashboardId } = req.params;
        const { monthlyIncome } = req.query;

        if (!dashboardId) {
            return res.status(400).json({
                success: false,
                error: 'dashboardId é obrigatório',
            });
        }

        if (!monthlyIncome || Number(monthlyIncome) <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Receita mensal deve ser informada',
            });
        }

        const recommendations = await budgetAllocationService.getAIRecommendations(
            userId,
            dashboardId,
            Number(monthlyIncome)
        );

        res.json({
            success: true,
            data: {
                recommendations,
            },
        });
    } catch (error: any) {
        logger.error(`Erro ao obter recomendações IA: ${error.message}`, 'AllocationController');
        res.status(500).json({
            success: false,
            error: 'Erro ao obter recomendações de IA',
        });
    }
}

/**
 * Obtém alertas de alocação
 */
export async function getAllocationAlerts(req: AuthRequest, res: Response) {
    try {
        const userId = getUserId(req);
        const { dashboardId } = req.params;

        if (!dashboardId) {
            return res.status(400).json({
                success: false,
                error: 'dashboardId é obrigatório',
            });
        }

        const alerts = await budgetAllocationService.getAllocationAlerts(userId, dashboardId);

        res.json({
            success: true,
            data: alerts,
        });
    } catch (error: any) {
        logger.error(`Erro ao obter alertas: ${error.message}`, 'AllocationController');
        res.status(500).json({
            success: false,
            error: 'Erro ao obter alertas de alocação',
        });
    }
}

/**
 * Obtém análise de alocação com IA
 */
export async function getAIAllocationAnalysis(req: AuthRequest, res: Response) {
    try {
        const userId = getUserId(req);
        const { dashboardId } = req.params;

        if (!dashboardId) {
            return res.status(400).json({
                success: false,
                error: 'dashboardId é obrigatório',
            });
        }

        // Obter análise de alocação
        const analysis = await budgetAllocationService.analyzeAllocations(userId, dashboardId);

        // Gerar análise com IA
        const aiAnalysis = await aiRouter.generateAllocationAnalysis({
            monthlyIncome: analysis.totalIncome,
            allocations: analysis.allocations.map(a => ({
                name: a.name,
                targetPercentage: a.targetPercentage,
                actualPercentage: a.actualPercentage,
                targetAmount: a.targetAmount,
                actualAmount: a.actualAmount,
                status: a.status,
            })),
            unallocatedExpenses: analysis.unallocatedExpenses,
            overallStatus: analysis.summary.overallStatus,
        });

        res.json({
            success: true,
            data: {
                analysis,
                aiInsights: aiAnalysis,
            },
        });
    } catch (error: any) {
        logger.error(`Erro ao obter análise IA: ${error.message}`, 'AllocationController');
        res.status(500).json({
            success: false,
            error: 'Erro ao obter análise de IA',
        });
    }
}
