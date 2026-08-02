import { Request, Response } from "express";
import { wishlistService } from "../services/wishlist.service.js";

export class WishlistController {
  async getWishlist(req: Request, res: Response) {
    const result = await wishlistService.getWishlist(req.user!.userId);
    res.json({ success: true, data: result });
  }

  async addToWishlist(req: Request, res: Response) {
    const result = await wishlistService.addToWishlist(
      req.user!.userId,
      req.params.productId as string
    );
    res.status(201).json({ success: true, data: result });
  }

  async removeFromWishlist(req: Request, res: Response) {
    const result = await wishlistService.removeFromWishlist(
      req.user!.userId,
      req.params.productId as string
    );
    res.json({ success: true, data: result });
  }
}

export const wishlistController = new WishlistController();
