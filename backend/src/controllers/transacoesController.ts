import { Request, Response } from 'express';
import * as transacoesServico from '../services/transacoesServico';
import { AuthRequest } from '../middleware/auth';

export const criarTransacao = async (req: AuthRequest, res: Response) => {
    const transacao = await transacoesServico.createTransaction(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: transacao });
};

export const criarTransacoesEmLote = async (req: AuthRequest, res: Response) => {
    const transacoes = await transacoesServico.createManyTransactions(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: { count: transacoes.length, transactions: transacoes } });
};

export const listarTransacoes = async (req: AuthRequest, res: Response) => {
    const transacoes = await transacoesServico.getAllTransactions(req.query, req.user!.userId);
    res.json({ success: true, data: transacoes });
};

export const obterTransacao = async (req: AuthRequest, res: Response) => {
    const transacao = await transacoesServico.getTransactionById(req.params.id, req.user!.userId);
    res.json({ success: true, data: transacao });
};

export const atualizarTransacao = async (req: AuthRequest, res: Response) => {
    const transacao = await transacoesServico.updateTransaction(req.params.id, req.body, req.user!.userId);
    res.json({ success: true, data: transacao });
};

export const deletarTransacao = async (req: AuthRequest, res: Response) => {
    await transacoesServico.deleteTransaction(req.params.id, req.user!.userId);
    res.status(204).send();
};

export const obterResumo = async (req: AuthRequest, res: Response) => {
    const resumo = await transacoesServico.getStatsSummary(req.query, req.user!.userId);
    res.json({ success: true, data: resumo });
};
