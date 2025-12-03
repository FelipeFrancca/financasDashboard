import { Request, Response } from 'express';
import * as alertasServico from '../services/alertasServico';
import { AuthRequest } from '../middleware/auth';
import emailServico from '../services/emailServico';
import { prisma } from '../database/conexao';

export const criarAlerta = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const alerta = await alertasServico.createAlert(dashboardId, req.user!.userId, req.body);
    res.status(201).json({ success: true, data: alerta });
};

export const listarAlertas = async (req: AuthRequest, res: Response) => {
    const { dashboardId, unreadOnly } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    const alertas = await alertasServico.getAlerts(dashboardId, req.user!.userId, unreadOnly === 'true');
    res.json({ success: true, data: alertas });
};

export const marcarComoLido = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    await alertasServico.markAsRead(req.params.id, dashboardId, req.user!.userId);
    res.json({ success: true });
};

export const marcarTodosComoLidos = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.body;
    if (!dashboardId) {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    await alertasServico.markAllAsRead(dashboardId, req.user!.userId);
    res.json({ success: true });
};

export const deletarAlerta = async (req: AuthRequest, res: Response) => {
    const { dashboardId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
        return res.status(400).json({ success: false, error: 'dashboardId é obrigatório' });
    }
    await alertasServico.deleteAlert(req.params.id, dashboardId, req.user!.userId);
    res.status(204).send();
};

export const testarEmail = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: { email: true, name: true },
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
        }

        const { tipo } = req.body;

        switch (tipo) {
            case 'boas-vindas':
                await emailServico.enviarBoasVindas({
                    email: user.email,
                    nome: user.name || 'Usuário',
                });
                break;

            case 'alerta-orcamento':
                await emailServico.enviarAlertaOrcamento({
                    email: user.email,
                    nome: user.name || 'Usuário',
                    categoria: 'Alimentação',
                    limite: 1000,
                    gasto: 850,
                    percentual: 85,
                });
                break;

            case 'alerta-meta':
                await emailServico.enviarAlertaMeta({
                    email: user.email,
                    nome: user.name || 'Usuário',
                    meta: 'Viagem',
                    valorAlvo: 5000,
                    valorAtual: 3750,
                    percentual: 75,
                });
                break;

            default:
                return res.status(400).json({ 
                    success: false, 
                    error: 'Tipo inválido. Use: boas-vindas, alerta-orcamento ou alerta-meta' 
                });
        }

        res.json({ 
            success: true, 
            message: `Email de teste "${tipo}" enviado para ${user.email}` 
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao enviar email de teste',
            details: error.message 
        });
    }
};

export const verificarConexaoEmail = async (req: AuthRequest, res: Response) => {
    try {
        const conexaoOk = await emailServico.verificarConexao();
        
        if (conexaoOk) {
            res.json({ 
                success: true, 
                message: 'Conexão com servidor SMTP verificada com sucesso' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Falha ao conectar com servidor SMTP' 
            });
        }
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao verificar conexão',
            details: error.message 
        });
    }
};

