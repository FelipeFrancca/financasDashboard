import { Request, Response } from 'express';
import * as transacoesServico from '../services/transacoesServico';
import { AuthRequest } from '../middleware/auth';

export const criarTransacao = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const transacao = await transacoesServico.createTransaction(req.body, dashboardId, req.user!.userId);
    res.status(201).json({ success: true, data: transacao });
};

export const criarTransacoesEmLote = async (req: AuthRequest, res: Response) => {
    const { dashboardId, transactions } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const transacoes = await transacoesServico.createManyTransactions(transactions, dashboardId, req.user!.userId);
    res.status(201).json({ success: true, data: { count: transacoes.length, transactions: transacoes } });
};

export const listarTransacoes = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const transacoes = await transacoesServico.getAllTransactions(req.query, dashboardId, req.user!.userId);
    res.json({ success: true, data: transacoes });
};

export const obterTransacao = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const transacao = await transacoesServico.getTransactionById(req.params.id, dashboardId, req.user!.userId);
    res.json({ success: true, data: transacao });
};

export const atualizarTransacao = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const transacao = await transacoesServico.updateTransaction(req.params.id, req.body, dashboardId, req.user!.userId);
    res.json({ success: true, data: transacao });
};

export const deletarTransacao = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    await transacoesServico.deleteTransaction(req.params.id, dashboardId, req.user!.userId);
    res.status(204).send();
};

export const obterResumo = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const resumo = await transacoesServico.getStatsSummary(req.query, dashboardId, req.user!.userId);
    res.json({ success: true, data: resumo });
};
