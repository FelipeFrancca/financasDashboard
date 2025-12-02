import { Request, Response } from 'express';
import * as contasServico from '../services/contasServico';
import { AuthRequest } from '../middleware/auth';

export const criarConta = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const conta = await contasServico.createAccount(req.body, dashboardId, req.user!.userId);
    res.status(201).json({ success: true, data: conta });
};

export const listarContas = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const contas = await contasServico.getAccounts(req.query as any, dashboardId, req.user!.userId);
    res.json({ success: true, data: contas });
};

export const obterConta = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const conta = await contasServico.getAccountById(req.params.id, dashboardId, req.user!.userId);
    res.json({ success: true, data: conta });
};

export const atualizarConta = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const conta = await contasServico.updateAccount(req.params.id, req.body, dashboardId, req.user!.userId);
    res.json({ success: true, data: conta });
};

export const deletarConta = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    await contasServico.deleteAccount(req.params.id, dashboardId, req.user!.userId);
    res.status(204).send();
};

export const obterSaldoTotal = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const summary = await contasServico.getAccountsSummary(dashboardId, req.user!.userId);
    res.json({ success: true, data: summary });
};
