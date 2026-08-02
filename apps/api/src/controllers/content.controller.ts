import { Request, Response, NextFunction } from "express";
import { contentService } from "../services/content.service.js";

export class ContentController {
  async getBanners(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await contentService.getActiveBanners() }); } catch (err) { next(err); }
  }

  async getPage(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await contentService.getPageBySlug(req.params.slug as string) }); } catch (err) { next(err); }
  }

  async submitContact(req: Request, res: Response, next: NextFunction) {
    try {
      await contentService.submitContact(req.body);
      res.json({ success: true, message: "Message sent successfully" });
    } catch (err) { next(err); }
  }

  async getStoreSettings(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await contentService.getStoreSettings() }); } catch (err) { next(err); }
  }
}

export const contentController = new ContentController();
