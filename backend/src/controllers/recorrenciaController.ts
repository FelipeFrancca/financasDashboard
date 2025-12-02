import { Request, Response } from 'express';
import * as recorrenciaServico from '../services/recorrenciaServico';
import { AuthRequest } from '../middleware/auth';

export const criarRecorrente = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const recorrente = await recorrenciaServico.createRecurring(dashboardId, req.user!.userId, req.body);
    res.status(201).json({ success: true, data: recorrente });
};

export const listarRecorrentes = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const recorrentes = await recorrenciaServico.getRecurring(dashboardId, req.user!.userId);
    res.json({ success: true, data: recorrentes });
};

export const atualizarRecorrente = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const recorrente = await recorrenciaServico.updateRecurring(req.params.id, dashboardId, req.user!.userId, req.body);
    res.json({ success: true, data: recorrente });
};

export const deletarRecorrente = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    await recorrenciaServico.deleteRecurring(req.params.id, dashboardId, req.user!.userId);
    res.status(204).send();
};
