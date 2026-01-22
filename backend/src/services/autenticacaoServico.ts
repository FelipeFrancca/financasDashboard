import { prisma } from '../database/conexao';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import emailServico from './emailServico';
import { AppError } from '../utils/AppError';

// Define User type locally to avoid import issues
type User = {
  id: string;
  email: string;
  password: string | null;
  name: string | null;
  googleId: string | null;
  avatar: string | null;
  emailVerified: boolean;
  verificationToken: string | null;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

// Validação de JWT secrets - aviso em vez de falha fatal para permitir diagnóstico
if (!JWT_SECRET) {
  console.error('⚠️  AVISO: JWT_SECRET não está configurado nas variáveis de ambiente');
  console.error('   A autenticação não funcionará corretamente até que seja configurado.');
}

if (!JWT_REFRESH_SECRET) {
  console.error('⚠️  AVISO: JWT_REFRESH_SECRET não está configurado nas variáveis de ambiente');
  console.error('   O refresh de tokens não funcionará corretamente até que seja configurado.');
}

// Configure email transporter (using same SMTP config as emailServico)
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.sendinblue.com',
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type GoogleUserData = {
  googleId: string;
  email: string;
  name?: string;
  avatar?: string;
};

export type TokenPayload = {
  userId: string;
  email: string;
};

// Generate JWT tokens
export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign({ userId, email } as TokenPayload, JWT_SECRET as jwt.Secret, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string, email: string): string {
  return jwt.sign({ userId, email } as TokenPayload, JWT_REFRESH_SECRET as jwt.Secret, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

// Verify JWT token
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET as jwt.Secret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET as jwt.Secret) as TokenPayload;
}

// Register new user
export async function registerUser(data: RegisterInput): Promise<{ user: Omit<User, "password">; accessToken: string; refreshToken: string }> {
  // Check if user already exists
  const existingUser = await (prisma as any).user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("Email já está em uso");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user
  const user = await (prisma as any).user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      emailVerified: false,
    },
  });

  // Enviar email de boas-vindas
  try {
    await emailServico.enviarBoasVindas({
      email: user.email,
      nome: user.name || 'Usuário',
    });
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    // Não falhar o registro se o email falhar
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

// Login user
export async function loginUser(data: LoginInput): Promise<{ user: Omit<User, "password">; accessToken: string; refreshToken: string }> {
  // Find user
  const user = await (prisma as any).user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.password) {
    throw new AppError("Email não encontrado", 401, true, "EMAIL_NOT_FOUND");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Senha incorreta", 401, true, "INVALID_PASSWORD");
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

// Google OAuth login/register
export async function googleAuth(data: GoogleUserData): Promise<{ user: Omit<User, "password">; accessToken: string; refreshToken: string; isNewUser: boolean }> {
  // Check if user exists with Google ID
  let user = await (prisma as any).user.findUnique({
    where: { googleId: data.googleId },
  });

  let isNewUser = false;

  if (!user) {
    // Check if user exists with email
    user = await (prisma as any).user.findUnique({
      where: { email: data.email },
    });

    if (user) {
      // Link Google account to existing user
      user = await (prisma as any).user.update({
        where: { id: user.id },
        data: {
          googleId: data.googleId,
          avatar: data.avatar,
          emailVerified: true,
        },
      });
    } else {
      // Create new user
      user = await (prisma as any).user.create({
        data: {
          email: data.email,
          googleId: data.googleId,
          name: data.name,
          avatar: data.avatar,
          emailVerified: true,
        },
      });
      isNewUser = true;

      // Enviar email de boas-vindas
      try {
        await emailServico.enviarBoasVindas({
          email: user.email,
          nome: user.name || 'Usuário',
        });
      } catch (error) {
        console.error('Erro ao enviar email de boas-vindas:', error);
        // Não falhar o registro se o email falhar
      }
    }
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
    isNewUser,
  };
}

// Request password reset
export type PasswordResetResult = {
  sent: boolean;
  hasExistingToken?: boolean;
  expiresIn?: number; // seconds remaining
};

export async function requestPasswordReset(email: string, force: boolean = false): Promise<PasswordResetResult> {
  const user = await (prisma as any).user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists - pretend we sent
    return { sent: true };
  }

  // Check if there is already a valid token
  if (user.resetToken && user.resetTokenExpiry && user.resetTokenExpiry > new Date()) {
    if (!force) {
      // Return info about existing token so frontend can ask for confirmation
      const expiresIn = Math.ceil((user.resetTokenExpiry.getTime() - Date.now()) / 1000);
      return {
        sent: false,
        hasExistingToken: true,
        expiresIn,
      };
    }
    // If force=true, continue to generate new token
  }

  // Generate 4-digit code
  const resetToken = Math.floor(1000 + Math.random() * 9000).toString();
  const resetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Save token to database
  await (prisma as any).user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  });

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Código de Redefinição de Senha - Finanças Dashboard",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Redefinição de Senha</h1>
          <p>Você solicitou a redefinição de senha para sua conta no Finanças Dashboard.</p>
          <p>Seu código de verificação é:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1976d2;">${resetToken}</span>
          </div>
          <p>Este código é válido por 5 minutos.</p>
          <p>Se você não solicitou esta redefinição, ignore este email.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw new Error("Erro ao enviar email de redefinição");
  }
}

// Verify reset code without changing password
export async function verifyResetCode(email: string, code: string): Promise<{ valid: boolean; message?: string }> {
  const user = await (prisma as any).user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists
    return { valid: false, message: "Código inválido" };
  }

  if (!user.resetToken || !user.resetTokenExpiry) {
    return { valid: false, message: "Nenhum código de redefinição ativo" };
  }

  if (user.resetTokenExpiry < new Date()) {
    return { valid: false, message: "Código expirado" };
  }

  if (user.resetToken !== code) {
    return { valid: false, message: "Código incorreto" };
  }

  return { valid: true };
}

// Reset password with code
export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  const user = await (prisma as any).user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Email inválido");
  }

  if (user.resetToken !== code || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    throw new Error("Código inválido ou expirado");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear reset token
  await (prisma as any).user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
}

// Change password (authenticated user)
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("Usuário não encontrado", 404, true, "USER_NOT_FOUND");
  }

  // Users who registered via Google may not have a password
  if (!user.password) {
    throw new AppError(
      "Sua conta foi criada via Google. Para definir uma senha, use 'Esqueci minha senha' na tela de login.",
      400,
      true,
      "NO_PASSWORD_SET"
    );
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new AppError("Senha atual incorreta", 401, true, "INVALID_CURRENT_PASSWORD");
  }

  // Hash and update new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await (prisma as any).user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date(),
    },
  });
}

// Get user by ID
export async function getUserById(userId: string): Promise<Omit<User, "password"> | null> {
  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const payload = verifyRefreshToken(refreshToken);

    // Verify user still exists
    const user = await (prisma as any).user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id, user.email);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw new Error("Token de refresh inválido");
  }
}

export { prisma };
