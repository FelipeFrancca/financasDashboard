import { Request, Response } from 'express';
import * as orcamentosServico from '../services/orcamentosServico';
import { AuthRequest } from '../middleware/auth';

export const criarOrcamento = async (req: AuthRequest, res: Response) => {
    const orcamento = await orcamentosServico.createBudget(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: orcamento });
};

export const listarOrcamentos = async (req: AuthRequest, res: Response) => {
    const orcamentos = await orcamentosServico.getBudgets(req.query as any, req.user!.userId);
    res.json({ success: true, data: orcamentos });
};

export const obterOrcamento = async (req: AuthRequest, res: Response) => {
    const orcamento = await orcamentosServico.getBudgetById(req.params.id, req.user!.userId);
    res.json({ success: true, data: orcamento });
};

export const atualizarOrcamento = async (req: AuthRequest, res: Response) => {
    const orcamento = await orcamentosServico.updateBudget(req.params.id, req.body, req.user!.userId);
    res.json({ success: true, data: orcamento });
};

export const deletarOrcamento = async (req: AuthRequest, res: Response) => {
    await orcamentosServico.deleteBudget(req.params.id, req.user!.userId);
    res.status(204).send();
};

export const obterResumo = async (req: AuthRequest, res: Response) => {
    const resumo = await orcamentosServico.getBudgetsSummary(req.user!.userId);
    res.json({ success: true, data: resumo });
};
