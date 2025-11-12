import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { authenticateToken } from "../middleware/auth";
import * as dashboardService from "../services/dashboardService";

const router = express.Router();

const createSchema = z.object({ title: z.string().min(1), description: z.string().optional() });
const inviteSchema = z.object({ role: z.enum(["VIEWER", "EDITOR"]).optional(), expiresAt: z.string().optional(), isOneTime: z.boolean().optional() });
const acceptSchema = z.object({ code: z.string().min(1) });

// List dashboards for current user
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const dashboards = await dashboardService.listUserDashboards(userId);
    res.json(dashboards);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create dashboard
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    const dashboard = await dashboardService.createDashboard(userId, data);
    res.status(201).json(dashboard);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create invite for dashboard
router.post("/:id/invites", authenticateToken, async (req: Request, res: Response) => {
  try {
    const params = inviteSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    const invite = await dashboardService.createInvite(req.params.id, userId, params.role || "VIEWER", params.expiresAt ? new Date(params.expiresAt) : undefined, params.isOneTime || false);
    // Shareable link
    const frontendUrl = process.env.FRONTEND_URL;
    const shareUrl = frontendUrl ? `${frontendUrl}/shared/${invite.code}` : undefined;
    res.status(201).json({ invite, shareUrl });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Accept invite (user must be authenticated)
router.post("/accept-invite", authenticateToken, async (req: Request, res: Response) => {
  try {
    const data = acceptSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    const result = await dashboardService.acceptInviteByCode(userId, data.code);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Dados inválidos", details: error.errors });
    res.status(400).json({ error: (error as Error).message || "Invalid invite" });
  }
});

// Public access via share link (preview) - no auth required
router.get("/shared/:code", async (req: Request, res: Response) => {
  try {
    const code = req.params.code;
    // find invite and return minimal dashboard info
    const invite = await (await import("../services/dashboardService")).getInviteByCode?.(code) || null;
    if (!invite) return res.status(404).json({ error: "Invite not found" });
    const dashboard = await (await import("../services/dashboardService")).getDashboardWithPermission(invite.dashboardId);
    res.json({ invite: { code: invite.code, role: invite.role, expiresAt: invite.expiresAt }, dashboard });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
