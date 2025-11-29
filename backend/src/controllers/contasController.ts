import { Request, Response } from 'express';
import * as contasServico from '../services/contasServico';
import { AuthRequest } from '../middleware/auth';

export const criarConta = async (req: AuthRequest, res: Response) => {
    const conta = await contasServico.createAccount(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: conta });
};

export const listarContas = async (req: AuthRequest, res: Response) => {
    const contas = await contasServico.getAccounts(req.query as any, req.user!.userId);
    res.json({ success: true, data: contas });
};

export const obterConta = async (req: AuthRequest, res: Response) => {
    const conta = await contasServico.getAccountById(req.params.id, req.user!.userId);
    res.json({ success: true, data: conta });
};

export const atualizarConta = async (req: AuthRequest, res: Response) => {
    const conta = await contasServico.updateAccount(req.params.id, req.body, req.user!.userId);
    res.json({ success: true, data: conta });
};

export const deletarConta = async (req: AuthRequest, res: Response) => {
    await contasServico.deleteAccount(req.params.id, req.user!.userId);
    res.status(204).send();
};

export const obterSaldoTotal = async (req: AuthRequest, res: Response) => {
    const saldo = await contasServico.getTotalBalance(req.user!.userId);
    res.json({ success: true, data: { totalBalance: saldo } });
};
