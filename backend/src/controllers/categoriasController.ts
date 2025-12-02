import { Request, Response } from 'express';
import * as categoriasServico from '../services/categoriasServico';
import { AuthRequest } from '../middleware/auth';

export const criarCategoria = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const categoria = await categoriasServico.createCategory(req.body, dashboardId, req.user!.userId);
    res.status(201).json({ success: true, data: categoria });
};

export const listarCategorias = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const categorias = await categoriasServico.getCategories(req.query as any, dashboardId, req.user!.userId);
    res.json({ success: true, data: categorias });
};

export const obterCategoria = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const categoria = await categoriasServico.getCategoryById(req.params.id, dashboardId, req.user!.userId);
    res.json({ success: true, data: categoria });
};

export const atualizarCategoria = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const categoria = await categoriasServico.updateCategory(req.params.id, req.body, dashboardId, req.user!.userId);
    res.json({ success: true, data: categoria });
};

export const deletarCategoria = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    await categoriasServico.deleteCategory(req.params.id, dashboardId, req.user!.userId);
    res.status(204).send();
};
