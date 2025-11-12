import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

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

// Configure email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
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
    throw new Error("Credenciais inválidas");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new Error("Credenciais inválidas");
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
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await (prisma as any).user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  // Save token to database
  await (prisma as any).user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  });

  // Send email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Redefinição de Senha - Finanças Dashboard",
      html: `
        <h1>Redefinição de Senha</h1>
        <p>Você solicitou a redefinição de senha para sua conta no Finanças Dashboard.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;">Redefinir Senha</a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta redefinição, ignore este email.</p>
      `,
    });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw new Error("Erro ao enviar email de redefinição");
  }
}

// Reset password with token
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await (prisma as any).user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gte: new Date() },
    },
  });

  if (!user) {
    throw new Error("Token inválido ou expirado");
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
