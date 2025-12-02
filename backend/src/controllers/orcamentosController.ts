import { Request, Response } from 'express';
import * as orcamentosServico from '../services/orcamentosServico';
import { AuthRequest } from '../middleware/auth';

export const criarOrcamento = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const orcamento = await orcamentosServico.createBudget(req.body, dashboardId, req.user!.userId);
    res.status(201).json({ success: true, data: orcamento });
};

export const listarOrcamentos = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const orcamentos = await orcamentosServico.getBudgets(req.query as any, dashboardId, req.user!.userId);
    res.json({ success: true, data: orcamentos });
};

export const obterOrcamento = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const orcamento = await orcamentosServico.getBudgetById(req.params.id, dashboardId, req.user!.userId);
    res.json({ success: true, data: orcamento });
};

export const atualizarOrcamento = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const orcamento = await orcamentosServico.updateBudget(req.params.id, req.body, dashboardId, req.user!.userId);
    res.json({ success: true, data: orcamento });
};

export const deletarOrcamento = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    await orcamentosServico.deleteBudget(req.params.id, dashboardId, req.user!.userId);
    res.status(204).send();
};

export const obterResumo = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const resumo = await orcamentosServico.getBudgetsSummary(dashboardId, req.user!.userId);
    res.json({ success: true, data: resumo });
};
