import { Request, Response } from 'express';
import * as notificationPreferencesServico from '../services/notificationPreferencesServico';

// Get notification preferences
export const obter = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
        }

        const preferences = await notificationPreferencesServico.getNotificationPreferences(userId);
        res.json({ success: true, data: preferences });
    } catch (error: any) {
        console.error('Erro ao obter preferências:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter preferências de notificação',
            error: error.message,
        });
    }
};

// Update notification preferences
export const atualizar = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
        }

        const updated = await notificationPreferencesServico.updateNotificationPreferences(userId, req.body);
        res.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('Erro ao atualizar preferências:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar preferências de notificação',
            error: error.message,
        });
    }
};
