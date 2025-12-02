import { Request, Response } from 'express';
import * as alertasServico from '../services/alertasServico';
import { AuthRequest } from '../middleware/auth';

export const criarAlerta = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const alerta = await alertasServico.createAlert(dashboardId, req.user!.userId, req.body);
    res.status(201).json({ success: true, data: alerta });
};

export const listarAlertas = async (req: AuthRequest, res: Response) => {
    const { dashboardId, unreadOnly } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const alertas = await alertasServico.getAlerts(dashboardId, req.user!.userId, unreadOnly === 'true');
    res.json({ success: true, data: alertas });
};

export const marcarComoLido = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    await alertasServico.markAsRead(req.params.id, dashboardId, req.user!.userId);
    res.json({ success: true });
};

export const marcarTodosComoLidos = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    await alertasServico.markAllAsRead(dashboardId, req.user!.userId);
    res.json({ success: true });
};

export const deletarAlerta = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    await alertasServico.deleteAlert(req.params.id, dashboardId, req.user!.userId);
    res.status(204).send();
};
