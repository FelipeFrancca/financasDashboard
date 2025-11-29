import { Request, Response } from 'express';
import * as categoriasServico from '../services/categoriasServico';
import { AuthRequest } from '../middleware/auth';

export const criarCategoria = async (req: AuthRequest, res: Response) => {
    const categoria = await categoriasServico.createCategory(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: categoria });
};

export const listarCategorias = async (req: AuthRequest, res: Response) => {
    const categorias = await categoriasServico.getCategories(req.query as any, req.user!.userId);
    res.json({ success: true, data: categorias });
};

export const obterCategoria = async (req: AuthRequest, res: Response) => {
    const categoria = await categoriasServico.getCategoryById(req.params.id, req.user!.userId);
    res.json({ success: true, data: categoria });
};

export const atualizarCategoria = async (req: AuthRequest, res: Response) => {
    const categoria = await categoriasServico.updateCategory(req.params.id, req.body, req.user!.userId);
    res.json({ success: true, data: categoria });
};

export const deletarCategoria = async (req: AuthRequest, res: Response) => {
    await categoriasServico.deleteCategory(req.params.id, req.user!.userId);
    res.status(204).send();
};
