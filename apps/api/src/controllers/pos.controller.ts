import { Request, Response, NextFunction } from "express";
import { posService } from "../services/pos.service.js";

export class PosController {
  async syncInventory(_req: Request, res: Response, next: NextFunction) {
    try { res.json(await posService.syncInventoryFromSquare()); } catch (err) { next(err); }
  }

  async getSyncStatus(_req: Request, res: Response, next: NextFunction) {
    try { res.json(await posService.getSyncStatus()); } catch (err) { next(err); }
  }

  async pushOrder(req: Request, res: Response, next: NextFunction) {
    try { res.json(await posService.pushOrderToSquare(req.params.orderId as string)); } catch (err) { next(err); }
  }

  async importCatalog(_req: Request, res: Response, next: NextFunction) {
    try { res.json(await posService.importCatalogFromSquare()); } catch (err) { next(err); }
  }

  async pushPrice(req: Request, res: Response, next: NextFunction) {
    try { res.json(await posService.pushPriceToSquare(req.params.productId as string)); } catch (err) { next(err); }
  }

  async pushAllPrices(_req: Request, res: Response, next: NextFunction) {
    try { res.json(await posService.pushAllPricesToSquare()); } catch (err) { next(err); }
  }

  // Square webhooks
  async handleInventoryWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      await posService.handleInventoryWebhook(req.body);
      res.json({ received: true });
    } catch (err) { next(err); }
  }

  async handleCatalogWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      await posService.handleCatalogWebhook(req.body);
      res.json({ received: true });
    } catch (err) { next(err); }
  }
}

export const posController = new PosController();
