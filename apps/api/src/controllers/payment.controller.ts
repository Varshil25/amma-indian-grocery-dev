import { Request, Response } from "express";
import { paymentService } from "../services/payment.service.js";

export class PaymentController {
  async createPaymentIntent(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { orderId } = req.body;
    const result = await paymentService.createPaymentIntent(userId, orderId);
    res.json({ success: true, data: result });
  }

  async confirmPayment(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { orderId } = req.body;
    const result = await paymentService.confirmPayment(userId, orderId);
    res.json({ success: true, data: result });
  }

  async handleWebhook(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"] as string;
    const result = await paymentService.handleWebhook(req.body, sig);
    res.json(result);
  }
}

export const paymentController = new PaymentController();
