import { Request, Response } from 'express';
import * as authService from '../services/autenticacaoServico';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import emailServico from '../services/emailServico';
import { prisma } from '../database/conexao';

export const registrar = async (req: Request, res: Response) => {
    logger.info("Novo registro de usuário", "AuthRoute", { email: req.body.email });
    const result = await authService.registerUser(req.body);
    res.status(201).json({
        success: true,
        data: result,
        message: "Usuário registrado com sucesso",
    });
};

export const login = async (req: Request, res: Response) => {
    logger.info("Tentativa de login", "AuthRoute", { email: req.body.email });
    const result = await authService.loginUser(req.body);
    res.json({
        success: true,
        data: result,
        message: "Login realizado com sucesso",
    });
};

export const googleCallback = (req: Request, res: Response) => {
    const user = req.user as any;
    const frontendUrl = process.env.FRONTEND_URL;

    logger.info("Login Google bem-sucedido", "AuthRoute", { userId: user.userId });

    res.redirect(
        `${frontendUrl}/auth/callback?accessToken=${user.accessToken}&refreshToken=${user.refreshToken}&isNewUser=${user.isNewUser}`
    );
};

export const esqueciSenha = async (req: Request, res: Response) => {
    logger.info("Solicitação de reset de senha", "AuthRoute", { email: req.body.email });
    const { email, force } = req.body;
    const result = await authService.requestPasswordReset(email, force === true);

    if (result.hasExistingToken && !result.sent) {
        // There's an existing valid token - inform frontend
        return res.json({
            success: true,
            sent: false,
            hasExistingToken: true,
            expiresIn: result.expiresIn,
            message: "Já existe um código válido para este email",
        });
    }

    res.json({
        success: true,
        sent: true,
        message: "Se o email existir, um código de redefinição será enviado",
    });
};

export const verificarCodigo = async (req: Request, res: Response) => {
    const { email, code } = req.body;
    const result = await authService.verifyResetCode(email, code);

    if (!result.valid) {
        return res.status(400).json({
            success: false,
            error: { message: result.message || "Código inválido" },
        });
    }

    res.json({
        success: true,
        message: "Código verificado com sucesso",
    });
};

export const redefinirSenha = async (req: Request, res: Response) => {
    logger.info("Reset de senha", "AuthRoute");
    await authService.resetPassword(req.body.email, req.body.code, req.body.password);
    res.json({
        success: true,
        message: "Senha redefinida com sucesso",
    });
};

export const atualizarToken = async (req: Request, res: Response) => {
    logger.info("Refresh de token", "AuthRoute");
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    res.json({
        success: true,
        data: result,
        message: "Token renovado com sucesso",
    });
};

export const obterUsuarioAtual = async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.userId;

    // Buscar usuário com campos adicionais para verificar vinculações
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            emailVerified: true,
            googleId: true,
            password: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        return res.status(404).json({
            success: false,
            error: { message: 'Usuário não encontrado' },
        });
    }

    // Preparar resposta sem expor dados sensíveis
    const { password, googleId, ...userData } = user;

    res.json({
        success: true,
        data: {
            user: {
                ...userData,
                hasGoogleLinked: !!googleId,
                hasPassword: !!password,
            }
        },
    });
};

export const atualizarUsuarioAtual = async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.userId;
    const { name, avatar } = req.body;

    logger.info('Atualização de perfil', 'AuthRoute', { userId });

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(name !== undefined && { name }),
            ...(avatar !== undefined && { avatar }),
            updatedAt: new Date(),
        },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    res.json({
        success: true,
        data: { user: updatedUser },
        message: 'Perfil atualizado com sucesso',
    });
};

export const reenviarBoasVindas = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado',
            });
        }

        await emailServico.enviarBoasVindas({
            email: user.email,
            nome: user.name || 'Usuário',
        });

        logger.info('Email de boas-vindas reenviado', 'AuthRoute', { email: user.email });

        res.json({
            success: true,
            message: `Email de boas-vindas enviado para ${user.email}`,
        });
    } catch (error: any) {
        logger.error('Erro ao reenviar email de boas-vindas', 'AuthRoute', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao enviar email',
            details: error.message,
        });
    }
};

export const alterarSenha = async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.userId;
    const { currentPassword, newPassword } = req.body;

    logger.info('Alteração de senha', 'AuthRoute', { userId });

    await authService.changePassword(userId, currentPassword, newPassword);

    res.json({
        success: true,
        message: 'Senha alterada com sucesso',
    });
};

export const desvincularGoogle = async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.userId;

    logger.info('Desvinculação de conta Google', 'AuthRoute', { userId });

    // Verificar se usuário tem senha definida (precisa de outra forma de login)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, googleId: true },
    });

    if (!user) {
        return res.status(404).json({
            success: false,
            error: { message: 'Usuário não encontrado' },
        });
    }

    if (!user.googleId) {
        return res.status(400).json({
            success: false,
            error: { message: 'Conta Google não está vinculada' },
        });
    }

    if (!user.password) {
        return res.status(400).json({
            success: false,
            error: { message: 'Você precisa definir uma senha antes de desvincular o Google. Caso contrário, não poderá fazer login.' },
        });
    }

    // Remover vinculação do Google
    await prisma.user.update({
        where: { id: userId },
        data: { googleId: null },
    });

    logger.info('Conta Google desvinculada com sucesso', 'AuthRoute', { userId });

    res.json({
        success: true,
        message: 'Conta Google desvinculada com sucesso',
    });
};

export const buscarUsuarios = async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const currentUserId = authReq.user!.userId;
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json({
            success: true,
            data: [],
        });
    }

    // Search for users by email or name (excluding current user)
    const users = await prisma.user.findMany({
        where: {
            AND: [
                { id: { not: currentUserId } },
                {
                    OR: [
                        { email: { contains: q, mode: 'insensitive' } },
                        { name: { contains: q, mode: 'insensitive' } },
                    ],
                },
            ],
        },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
        },
        take: 10, // Limit results
    });

    res.json({
        success: true,
        data: users,
    });
};
