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

// ============ GRUPO DE PARCELAS ============

export const obterGrupoParcelas = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    const { groupId } = req.params;

    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    if (!groupId) {
        return res.status(400).json({ success: false, error: 'groupId é obrigatório' });
    }

    const parcelas = await transacoesServico.getInstallmentGroup(groupId, dashboardId, req.user!.userId);
    res.json({ success: true, data: parcelas });
};

export const atualizarGrupoParcelas = async (req: AuthRequest, res: Response) => {
    const { dashboardId, scope, ...updateData } = req.body;
    const { groupId } = req.params;

    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    if (!groupId) {
        return res.status(400).json({ success: false, error: 'groupId é obrigatório' });
    }

    const validScopes = ['all', 'remaining', 'single'];
    const updateScope = validScopes.includes(scope) ? scope : 'all';

    const result = await transacoesServico.updateInstallmentGroup(
        groupId,
        updateData,
        dashboardId,
        req.user!.userId,
        updateScope as 'all' | 'remaining' | 'single'
    );

    res.json({ success: true, data: result });
};

export const deletarTransacoesEmLote = async (req: AuthRequest, res: Response) => {
    const { dashboardId, ids, includeInstallments = true } = req.body;

    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'ids é obrigatório e deve ser um array não vazio' });
    }

    const result = await transacoesServico.deleteManyTransactions(
        ids,
        dashboardId,
        req.user!.userId,
        includeInstallments
    );

    res.json({ success: true, data: result });
};

