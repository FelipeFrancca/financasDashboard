import { Request, Response } from 'express';
import * as recorrenciaServico from '../services/recorrenciaServico';
import { AuthRequest } from '../middleware/auth';

export const criarRecorrencia = async (req: AuthRequest, res: Response) => {
    const recorrencia = await recorrenciaServico.createRecurring(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: recorrencia });
};

export const listarRecorrencias = async (req: AuthRequest, res: Response) => {
    const lista = await recorrenciaServico.getRecurring(req.user!.userId);
    res.json({ success: true, data: lista });
};

export const processarRecorrencias = async (req: AuthRequest, res: Response) => {
    await recorrenciaServico.processDueTransactions();
    res.json({ success: true, message: 'Processamento iniciado' });
};
