import { Request, Response } from 'express';
import * as metasServico from '../services/metasServico';
import { AuthRequest } from '../middleware/auth';

export const criarMeta = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const meta = await metasServico.createGoal(req.body, dashboardId, req.user!.userId);
    res.status(201).json({ success: true, data: meta });
};

export const listarMetas = async (req: AuthRequest, res: Response) => {
    const { dashboardId, page, limit, ...rest } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }

    const queryDto = {
        ...rest,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
    };

    const resultado = await metasServico.getGoals(queryDto as any, dashboardId, req.user!.userId);
    res.json({ success: true, data: resultado.data, total: resultado.total });
};

export const obterMeta = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const meta = await metasServico.getGoalById(req.params.id, dashboardId, req.user!.userId);
    res.json({ success: true, data: meta });
};

export const atualizarMeta = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const meta = await metasServico.updateGoal(req.params.id, req.body, dashboardId, req.user!.userId);
    res.json({ success: true, data: meta });
};

export const deletarMeta = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    await metasServico.deleteGoal(req.params.id, dashboardId, req.user!.userId);
    res.status(204).send();
};
