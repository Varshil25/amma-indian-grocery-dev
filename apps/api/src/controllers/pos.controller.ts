import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { posService } from "../services/pos.service.js";
import { env } from "../config/env.js";
import { AppError, UnauthorizedError } from "../middleware/errorHandler.js";

/**
 * Square signs each webhook: base64(HMAC-SHA256(signatureKey, notificationUrl + rawBody)).
 * Without this check anyone could POST a fake "catalog update" and change product prices.
 */
function verifySquareSignature(req: Request) {
  if (!env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
    throw new AppError("Square webhooks are not configured", 503, "NOT_CONFIGURED");
  }
  const signature = req.get("x-square-hmacsha256-signature");
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!signature || !rawBody) throw new UnauthorizedError("Missing webhook signature");

  const base = env.API_PUBLIC_URL ? env.API_PUBLIC_URL.replace(/\/$/, "") : `${req.protocol}://${req.get("host")}`;
  const notificationUrl = `${base}${req.originalUrl}`;
  const expected = crypto
    .createHmac("sha256", env.SQUARE_WEBHOOK_SIGNATURE_KEY)
    .update(notificationUrl + rawBody.toString("utf8"))
    .digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new UnauthorizedError("Invalid webhook signature");
  }
}

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
      verifySquareSignature(req);
      await posService.handleInventoryWebhook(req.body);
      res.json({ received: true });
    } catch (err) { next(err); }
  }

  async handleCatalogWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      verifySquareSignature(req);
      await posService.handleCatalogWebhook(req.body);
      res.json({ received: true });
    } catch (err) { next(err); }
  }
}

export const posController = new PosController();
