import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/authService";

export interface AuthRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(403).json({ error: "Token inválido ou expirado" });
    return;
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
    } catch (error) {
      // Token invalid, but continue without authentication
    }
  }

  next();
}
