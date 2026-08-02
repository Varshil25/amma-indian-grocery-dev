import { Request, Response } from "express";
import { productService } from "../services/product.service.js";

export class ProductController {
  async list(req: Request, res: Response) {
    const result = await productService.list(req.query as any);
    res.json({ success: true, data: result });
  }

  async getBySlug(req: Request, res: Response) {
    const result = await productService.getBySlug(req.params.slug as string);
    res.json({ success: true, data: result });
  }

  async getFeatured(req: Request, res: Response) {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
    const result = await productService.getFeatured(limit);
    res.json({ success: true, data: result });
  }

  async getBestSellers(req: Request, res: Response) {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
    const result = await productService.getBestSellers(limit);
    res.json({ success: true, data: result });
  }

  async search(req: Request, res: Response) {
    const q = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const result = await productService.search(q, limit);
    res.json({ success: true, data: result });
  }

  async getReviews(req: Request, res: Response) {
    const result = await productService.getReviews(req.params.id as string, req.query as Record<string, string>);
    res.json({ success: true, data: result });
  }

  async createReview(req: Request, res: Response) {
    const result = await productService.createReview(
      req.user!.userId,
      req.params.id as string,
      req.body
    );
    res.status(201).json({ success: true, data: result });
  }
}

export const productController = new ProductController();
