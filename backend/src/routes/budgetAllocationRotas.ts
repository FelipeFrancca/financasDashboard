/**
 * Budget Allocation Routes
 * Rotas para gerenciar alocações de orçamento por porcentagem
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getDefaultAllocations,
    listProfiles,
    getProfile,
    getDefaultProfile,
    createProfile,
    createDefaultProfileEndpoint,
    updateProfile,
    deleteProfile,
    analyzeAllocations,
    simulateAllocations,
    getAIRecommendations,
    getAllocationAlerts,
    getAIAllocationAnalysis,
} from '../controllers/budgetAllocationController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken as any);

// ============================================
// ROTAS DE ALOCAÇÕES PADRÃO
// ============================================

/**
 * @route GET /api/allocations/defaults
 * @desc Obtém as alocações padrão do sistema
 * @access Private
 */
router.get('/defaults', getDefaultAllocations as any);

// ============================================
// ROTAS DE PERFIS
// ============================================

/**
 * @route GET /api/allocations/profiles
 * @desc Lista todos os perfis de alocação do usuário
 * @query dashboardId - Filtrar por dashboard específico
 * @access Private
 */
router.get('/profiles', listProfiles as any);

/**
 * @route GET /api/allocations/profiles/default
 * @desc Obtém o perfil padrão do usuário (cria se não existir)
 * @query dashboardId - Dashboard específico
 * @access Private
 */
router.get('/profiles/default', getDefaultProfile as any);

/**
 * @route GET /api/allocations/profiles/:profileId
 * @desc Obtém um perfil específico
 * @access Private
 */
router.get('/profiles/:profileId', getProfile as any);

/**
 * @route POST /api/allocations/profiles
 * @desc Cria um novo perfil de alocação
 * @body { name, description?, isDefault?, dashboardId?, allocations: [{ name, percentage, color?, icon?, linkedCategories? }] }
 * @access Private
 */
router.post('/profiles', createProfile as any);

/**
 * @route POST /api/allocations/profiles/default
 * @desc Cria um perfil com alocações padrão
 * @body { dashboardId? }
 * @access Private
 */
router.post('/profiles/default', createDefaultProfileEndpoint as any);

/**
 * @route PUT /api/allocations/profiles/:profileId
 * @desc Atualiza um perfil de alocação
 * @body Partial<AllocationProfile>
 * @access Private
 */
router.put('/profiles/:profileId', updateProfile as any);

/**
 * @route DELETE /api/allocations/profiles/:profileId
 * @desc Deleta um perfil de alocação
 * @access Private
 */
router.delete('/profiles/:profileId', deleteProfile as any);

// ============================================
// ROTAS DE ANÁLISE
// ============================================

/**
 * @route GET /api/allocations/analysis/:dashboardId
 * @desc Analisa gastos reais vs alocações planejadas
 * @query profileId - Perfil específico (opcional, usa padrão)
 * @query startDate - Data inicial do período (opcional, usa mês atual)
 * @query endDate - Data final do período (opcional, usa mês atual)
 * @access Private
 */
router.get('/analysis/:dashboardId', analyzeAllocations as any);

/**
 * @route GET /api/allocations/alerts/:dashboardId
 * @desc Obtém alertas de alocação
 * @access Private
 */
router.get('/alerts/:dashboardId', getAllocationAlerts as any);

// ============================================
// ROTAS DE SIMULAÇÃO
// ============================================

/**
 * @route POST /api/allocations/simulate
 * @desc Simula alocações com base em receita mensal
 * @body { monthlyIncome: number, allocations?: AllocationCategory[] }
 * @access Private
 */
router.post('/simulate', simulateAllocations as any);

// ============================================
// ROTAS DE IA
// ============================================

/**
 * @route GET /api/allocations/ai/recommendations/:dashboardId
 * @desc Obtém recomendações de alocação geradas por IA
 * @query monthlyIncome - Receita mensal para base das recomendações
 * @access Private
 */
router.get('/ai/recommendations/:dashboardId', getAIRecommendations as any);

/**
 * @route GET /api/allocations/ai/analysis/:dashboardId
 * @desc Obtém análise completa de alocação com insights de IA
 * @access Private
 */
router.get('/ai/analysis/:dashboardId', getAIAllocationAnalysis as any);

export default router;
