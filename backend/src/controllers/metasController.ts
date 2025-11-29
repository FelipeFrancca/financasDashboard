import { Request, Response } from 'express';
import * as metasServico from '../services/metasServico';
import { AuthRequest } from '../middleware/auth';

export const criarMeta = async (req: AuthRequest, res: Response) => {
    const meta = await metasServico.createGoal(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: meta });
};

export const listarMetas = async (req: AuthRequest, res: Response) => {
    const resultado = await metasServico.getGoals(req.query as any, req.user!.userId);
    res.json({ success: true, data: resultado.data, total: resultado.total });
};

export const obterMeta = async (req: AuthRequest, res: Response) => {
    const meta = await metasServico.getGoalById(req.params.id, req.user!.userId);
    res.json({ success: true, data: meta });
};

export const atualizarMeta = async (req: AuthRequest, res: Response) => {
    const meta = await metasServico.updateGoal(req.params.id, req.body, req.user!.userId);
    res.json({ success: true, data: meta });
};

export const deletarMeta = async (req: AuthRequest, res: Response) => {
    await metasServico.deleteGoal(req.params.id, req.user!.userId);
    res.status(204).send();
};
