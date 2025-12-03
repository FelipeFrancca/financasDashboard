import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as authController from "../controllers/autenticacaoController";
import { googleAuth } from "../services/autenticacaoServico"; // Importar apenas o necessário para o strategy
import { authenticateToken } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";
import { authLimiter, strictLimiter } from "../middleware/rateLimiter";
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    refreshTokenSchema,
} from "../validators/authValidator";

const router = express.Router();

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) return done(new Error("Email não disponível"), undefined);

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

// Rotas
router.post("/register", authLimiter, validateBody(registerSchema), asyncHandler(authController.registrar as any));
router.post("/login", authLimiter, validateBody(loginSchema), asyncHandler(authController.login as any));

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed` }),
    authController.googleCallback
);

router.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), asyncHandler(authController.esqueciSenha as any));
router.post("/reset-password", strictLimiter, validateBody(resetPasswordSchema), asyncHandler(authController.redefinirSenha as any));
router.post("/refresh", validateBody(refreshTokenSchema), asyncHandler(authController.atualizarToken as any));
router.get("/me", authenticateToken, asyncHandler(authController.obterUsuarioAtual as any));
router.post("/resend-welcome", authenticateToken, asyncHandler(authController.reenviarBoasVindas as any));

export default router;
