import { Request, Response } from 'express';
import * as alertasServico from '../services/alertasServico';
import { AuthRequest } from '../middleware/auth';

export const listarAlertas = async (req: AuthRequest, res: Response) => {
    const unreadOnly = req.query.unread === 'true';
    const alertas = await alertasServico.getAlerts(req.user!.userId, unreadOnly);
    res.json({ success: true, data: alertas });
};

export const marcarComoLido = async (req: AuthRequest, res: Response) => {
    await alertasServico.markAsRead(req.params.id, req.user!.userId);
    res.json({ success: true });
};

export const marcarTodosComoLidos = async (req: AuthRequest, res: Response) => {
    await alertasServico.markAllAsRead(req.user!.userId);
    res.json({ success: true });
};

export const deletarAlerta = async (req: AuthRequest, res: Response) => {
    await alertasServico.deleteAlert(req.params.id, req.user!.userId);
    res.status(204).send();
};
