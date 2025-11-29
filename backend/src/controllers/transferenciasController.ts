import { Request, Response } from 'express';
import * as transferenciasServico from '../services/transferenciasServico';
import { AuthRequest } from '../middleware/auth';

export const criarTransferencia = async (req: AuthRequest, res: Response) => {
    const transferencia = await transferenciasServico.createTransfer(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: transferencia });
};

export const listarTransferencias = async (req: AuthRequest, res: Response) => {
    const transferencias = await transferenciasServico.getTransfers(req.query, req.user!.userId);
    res.json({ success: true, data: transferencias });
};

export const obterTransferencia = async (req: AuthRequest, res: Response) => {
    const transferencia = await transferenciasServico.getTransferById(req.params.id, req.user!.userId);
    res.json({ success: true, data: transferencia });
};

export const deletarTransferencia = async (req: AuthRequest, res: Response) => {
    await transferenciasServico.deleteTransfer(req.params.id, req.user!.userId);
    res.status(204).send();
};
