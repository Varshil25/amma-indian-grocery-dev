import { BadRequestError } from "../middleware/errorHandler.js";
import { Request, Response } from "express";
import { rewardService } from "../services/reward.service.js";

export class RewardController {
  async getAccount(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await rewardService.getAccount(userId);
    res.json({ success: true, data: result });
  }

  async getHistory(req: Request, res: Response) {
    const userId = req.user!.userId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await rewardService.getHistory(userId, page, limit);
    res.json({ success: true, data: result });
  }

  async getTiers(_req: Request, res: Response) {
    const result = await rewardService.getTiers();
    res.json({ success: true, data: result });
  }

  async getReferralInfo(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await rewardService.getReferralInfo(userId);
    res.json({ success: true, data: result });
  }

  async applyReferral(req: Request, res: Response) {
    const userId = req.user!.userId;
    const code = typeof req.body?.code === "string" ? req.body.code : "";
    if (!code.trim()) throw new BadRequestError("Referral code is required");
    const result = await rewardService.applyReferralCode(userId, code);
    res.json({ success: true, data: result });
  }
}

export const rewardController = new RewardController();
