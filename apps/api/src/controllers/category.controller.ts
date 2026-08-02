import { Request, Response } from "express";
import { categoryService } from "../services/category.service.js";

export class CategoryController {
  async getAll(req: Request, res: Response) {
    const result = await categoryService.getAll();
    res.json({ success: true, data: result });
  }

  async getFeatured(req: Request, res: Response) {
    const result = await categoryService.getFeatured();
    res.json({ success: true, data: result });
  }

  async getBySlug(req: Request, res: Response) {
    const result = await categoryService.getBySlug(req.params.slug as string, req.query as Record<string, string>);
    res.json({ success: true, data: result });
  }
}

export const categoryController = new CategoryController();
