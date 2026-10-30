import { Request, Response } from "express";
import { orderService } from "../services/order.service.js";

export class OrderController {
  async preview(req: Request, res: Response) {
    const userId = req.user!.userId;
    const q = await orderService.quote(userId, req.body);
    res.json({
      success: true,
      data: {
        subtotal: q.subtotal,
        discountAmount: q.discountAmount,
        coupon: q.coupon,
        couponError: q.couponError,
        rewardPointsUsed: q.rewardPointsUsed,
        rewardDiscount: q.rewardDiscount,
        shippingAmount: q.shippingAmount,
        taxAmount: q.taxAmount,
        totalAmount: q.totalAmount,
        taxRate: q.settings.taxRate,
        freeDeliveryThreshold: q.freeDeliveryThreshold,
        deliveryFee: q.settings.deliveryFee,
        deliveryEnabled: q.settings.deliveryEnabled,
        pickupEnabled: q.settings.pickupEnabled,
        payOnDeliveryEnabled: q.settings.payOnDeliveryEnabled,
        onlinePaymentsEnabled: q.settings.onlinePaymentsEnabled,
        itemCount: q.cart.itemCount,
      },
    });
  }

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
