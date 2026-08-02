import { Request, Response } from "express";
import { authService } from "../services/auth.service.js";

export class AuthController {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  }

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json({ success: true, data: result });
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.json({ success: true, message: "Logged out successfully" });
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json({ success: true, data: result });
  }

  async resetPassword(req: Request, res: Response) {
    const { email, code, newPassword } = req.body;
    const result = await authService.resetPassword(email, code, newPassword);
    res.json({ success: true, data: result });
  }

  async getMe(req: Request, res: Response) {
    const result = await authService.getMe(req.user!.userId);
    res.json({ success: true, data: result });
  }
}

export const authController = new AuthController();
