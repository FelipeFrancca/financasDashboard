import { Request, Response } from 'express';
import * as itemsService from '../services/itemsService';
import { AuthRequest } from '../middleware/auth';

export const getItemStats = async (req: AuthRequest, res: Response) => {
    try {
        const { dashboardId } = req.params;
        const filters = req.query;

        if (!dashboardId) {
            return res.status(400).json({ error: 'Dashboard ID is required' });
        }

        // O serviço já deve validar permissões se necessário, ou podemos adicionar aqui
        // Por enquanto, assumimos que o middleware de auth já garantiu que o usuário está logado
        // Mas idealmente deveríamos verificar se o usuário tem acesso ao dashboard

        const stats = await itemsService.getItemStats(dashboardId, filters);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching item stats:', error);
        res.status(500).json({ error: 'Failed to fetch item stats' });
    }
};
