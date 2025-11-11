import express, { type Request, type Response } from "express";
import { z } from "zod";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import {
  registerUser,
  loginUser,
  googleAuth,
  requestPasswordReset,
  resetPassword,
  refreshAccessToken,
  getUserById,
} from "../services/authService";
import { authenticateToken, type AuthRequest } from "../middleware/auth";

const router = express.Router();

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Email não disponível"), undefined);
          }

          const result = await googleAuth({
            googleId: profile.id,
            email,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
          });

          return done(null, result);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token é obrigatório"),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login de usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return;
    }
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Iniciar autenticação com Google
 *     responses:
 *       302:
 *         description: Redireciona para Google OAuth
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback do Google OAuth
 *     responses:
 *       302:
 *         description: Redireciona para frontend com tokens
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    session: false, 
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=google_auth_failed` 
  }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${user.accessToken}&refreshToken=${user.refreshToken}&isNewUser=${user.isNewUser}`
    );
  }
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicitar redefinição de senha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email enviado se usuário existir
 */
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    await requestPasswordReset(data.email);
    res.json({ message: "Se o email existir, um link de redefinição será enviado" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Erro ao processar solicitação" });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Redefinir senha com token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *       400:
 *         description: Token inválido ou expirado
 */
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    await resetPassword(data.token, data.password);
    res.json({ message: "Senha redefinida com sucesso" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Renovar access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Novos tokens gerados
 *       401:
 *         description: Refresh token inválido
 */
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const data = refreshTokenSchema.parse(req.body);
    const result = await refreshAccessToken(data.refreshToken);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return;
    }
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obter dados do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       401:
 *         description: Não autenticado
 */
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const user = await getUserById((req as any).user.userId);

    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
