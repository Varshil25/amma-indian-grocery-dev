import { Request, Response, NextFunction } from "express";
import { dealService } from "../services/deal.service.js";

export class DealController {
  async getActiveDeals(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await dealService.getActiveDeals() }); } catch (err) { next(err); }
  }

  async getDealBySlug(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await dealService.getDealBySlug(req.params.slug as string) }); } catch (err) { next(err); }
  }
}

export const dealController = new DealController();
