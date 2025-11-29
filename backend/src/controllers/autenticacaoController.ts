import { Request, Response } from 'express';
import * as authService from '../services/autenticacaoServico';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

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
    await authService.requestPasswordReset(req.body.email);
    res.json({
        success: true,
        message: "Se o email existir, um link de redefinição será enviado",
    });
};

export const redefinirSenha = async (req: Request, res: Response) => {
    logger.info("Reset de senha", "AuthRoute");
    await authService.resetPassword(req.body.token, req.body.password);
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

export const obterUsuarioAtual = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const user = await authService.getUserById(userId);
    res.json({
        success: true,
        data: { user },
    });
};
