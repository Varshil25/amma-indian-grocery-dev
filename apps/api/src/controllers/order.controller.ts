import { Request, Response } from "express";
import { orderService } from "../services/order.service.js";

export class OrderController {
  async createOrder(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await orderService.createOrder(userId, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async getOrders(req: Request, res: Response) {
    const userId = req.user!.userId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status as string | undefined;
    const result = await orderService.getOrders(userId, page, limit, status);
    res.json({ success: true, data: result });
  }

  async getOrderById(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await orderService.getOrderById(userId, req.params.id as string);
    res.json({ success: true, data: result });
  }

  async cancelOrder(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await orderService.cancelOrder(
      userId,
      req.params.id as string,
      req.body.reason
    );
    res.json({ success: true, data: result });
  }

  async trackOrder(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await orderService.getOrderTracking(userId, req.params.id as string);
    res.json({ success: true, data: result });
  }
}

export const orderController = new OrderController();
