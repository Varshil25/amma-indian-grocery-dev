import { Request, Response } from "express";
import { cartService } from "../services/cart.service.js";

export class CartController {
  async getCart(req: Request, res: Response) {
    const result = await cartService.getCart(req.user!.userId);
    res.json({ success: true, data: result });
  }

  async addItem(req: Request, res: Response) {
    const { productId, quantity } = req.body;
    const result = await cartService.addItem(req.user!.userId, productId, quantity);
    res.status(201).json({ success: true, data: result });
  }

  async updateItem(req: Request, res: Response) {
    const { quantity } = req.body;
    const result = await cartService.updateItemQuantity(
      req.user!.userId,
      req.params.productId as string,
      quantity
    );
    res.json({ success: true, data: result });
  }

  async removeItem(req: Request, res: Response) {
    const result = await cartService.removeItem(req.user!.userId, req.params.productId as string);
    res.json({ success: true, data: result });
  }

  async clearCart(req: Request, res: Response) {
    const result = await cartService.clearCart(req.user!.userId);
    res.json({ success: true, data: result });
  }

  async applyCoupon(req: Request, res: Response) {
    const { code } = req.body;
    const result = await cartService.applyCoupon(req.user!.userId, code);
    res.json({ success: true, data: result });
  }
}

export const cartController = new CartController();
