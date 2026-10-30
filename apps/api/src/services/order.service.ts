import { OrderStatus, FulfillmentType, Prisma, Coupon } from "@prisma/client";
import prisma from "../config/database.js";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";
import { cartService } from "./cart.service.js";
import { settingsService, CheckoutSettings } from "./settings.service.js";
import { rewardService } from "./reward.service.js";
import { emailService } from "./email.service.js";
import { evaluateCoupon } from "./coupon.service.js";

type Tx = Prisma.TransactionClient;

function generateOrderNumber(): string {
  const prefix = "AMG";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export type CheckoutPaymentMethod = "PAY_ON_DELIVERY" | "CARD";

export interface QuoteInput {
  fulfillmentType: "DELIVERY" | "PICKUP";
  couponCode?: string;
  rewardPointsToRedeem?: number;
}

/** Statuses after which stock has been deducted from inventory (not just reserved). */
const STOCK_DEDUCTED: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

/** Allowed admin transitions. Fulfilment-specific steps are checked separately. */
const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  READY_FOR_PICKUP: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
};

export function allowedNextStatuses(status: OrderStatus, fulfillment: FulfillmentType): OrderStatus[] {
  return (NEXT_STATUSES[status] || []).filter((s) =>
    fulfillment === "PICKUP" ? s !== OrderStatus.OUT_FOR_DELIVERY : s !== OrderStatus.READY_FOR_PICKUP
  );
}

export class OrderService {
  // ─── Pricing ───

  private computeTotals(args: {
    subtotal: number;
    discount: number;
    rewardDiscount: number;
    freeShipping: boolean;
    fulfillmentType: "DELIVERY" | "PICKUP";
    settings: CheckoutSettings;
    freeDeliveryThreshold: number;
  }) {
    const { subtotal, discount, rewardDiscount, freeShipping, fulfillmentType, settings } = args;
    const shippingAmount =
      fulfillmentType === "PICKUP" || freeShipping || subtotal >= args.freeDeliveryThreshold
        ? 0
        : round2(settings.deliveryFee);
    const taxable = Math.max(0, subtotal - discount - rewardDiscount);
    const taxAmount = round2(taxable * settings.taxRate);
    const totalAmount = round2(taxable + taxAmount + shippingAmount);
    return { shippingAmount, taxAmount, totalAmount };
  }

  /** Price the current cart exactly as createOrder would, without creating anything. */
  async quote(userId: string, input: QuoteInput) {
    const settings = await settingsService.getCheckoutSettings();
    const cart = await cartService.getCart(userId);
    const subtotal = cart.subtotal;

    let discount = 0;
    let freeShipping = false;
    let coupon: Pick<Coupon, "id" | "code" | "discountType" | "description"> & { discountValue: number } | null = null;
    let couponError: string | null = null;

    if (input.couponCode?.trim()) {
      try {
        const r = await evaluateCoupon(userId, input.couponCode, subtotal);
        discount = r.discount;
        freeShipping = r.freeShipping;
        coupon = {
          id: r.coupon.id,
          code: r.coupon.code,
          discountType: r.coupon.discountType,
          description: r.coupon.description,
          discountValue: Number(r.coupon.discountValue),
        };
      } catch (e) {
        if (e instanceof BadRequestError) couponError = e.message;
        else throw e;
      }
    }

    let rewardPointsUsed = 0;
    let rewardDiscount = 0;
    if (input.rewardPointsToRedeem && input.rewardPointsToRedeem > 0) {
      const r = await rewardService.validateRedemption(userId, input.rewardPointsToRedeem);
      rewardPointsUsed = r.points;
      rewardDiscount = Math.min(r.value, Math.max(0, subtotal - discount));
    }

    const freeDeliveryThreshold = await rewardService.freeDeliveryThresholdFor(userId, settings.freeDeliveryThreshold);
    const totals = this.computeTotals({
      subtotal,
      discount,
      rewardDiscount,
      freeShipping,
      fulfillmentType: input.fulfillmentType,
      settings,
      freeDeliveryThreshold,
    });

    return {
      cart,
      subtotal,
      discountAmount: discount,
      coupon,
      couponError,
      rewardPointsUsed,
      rewardDiscount,
      ...totals,
      freeDeliveryThreshold,
      settings,
    };
  }

  // ─── Create ───

  async createOrder(
    userId: string,
    data: {
      fulfillmentType: "DELIVERY" | "PICKUP";
      addressId?: string;
      notes?: string;
      couponCode?: string;
      rewardPointsToRedeem?: number;
      paymentMethod?: CheckoutPaymentMethod;
    }
  ) {
    const q = await this.quote(userId, data);
    const { cart, settings } = q;
    const paymentMethod: CheckoutPaymentMethod = data.paymentMethod || "PAY_ON_DELIVERY";

    if (!cart.items.length) throw new BadRequestError("Your cart is empty");
    if (q.couponError) throw new BadRequestError(q.couponError);

    if (data.fulfillmentType === "DELIVERY" && !settings.deliveryEnabled) {
      throw new BadRequestError("Delivery is not available right now. Please choose store pickup.");
    }
    if (data.fulfillmentType === "PICKUP" && !settings.pickupEnabled) {
      throw new BadRequestError("Store pickup is not available right now. Please choose delivery.");
    }
    if (paymentMethod === "CARD" && !settings.onlinePaymentsEnabled) {
      throw new BadRequestError("Online card payments are not available right now");
    }
    if (paymentMethod === "PAY_ON_DELIVERY" && !settings.payOnDeliveryEnabled) {
      throw new BadRequestError("Paying on delivery/pickup is not available right now");
    }

    const unavailable = cart.items.filter((i) => !i.product.isActive);
    if (unavailable.length) {
      throw new BadRequestError(
        `No longer available: ${unavailable.map((i) => i.product.name).join(", ")}. Please remove it from your cart.`
      );
    }
    const short = cart.items.filter((i) => i.availableQty < i.quantity);
    if (short.length) {
      throw new BadRequestError(
        `Not enough stock for: ${short
          .map((i) => `${i.product.name} (${Math.max(0, i.availableQty)} left)`)
          .join(", ")}`
      );
    }

    if (data.fulfillmentType === "DELIVERY") {
      if (!data.addressId) throw new BadRequestError("Delivery address is required");
      const address = await prisma.address.findFirst({ where: { id: data.addressId, userId } });
      if (!address) throw new NotFoundError("Address not found");
    }

    if (q.totalAmount <= 0 && paymentMethod === "CARD") {
      throw new BadRequestError("Nothing to pay by card for this order");
    }

    const order = await prisma.$transaction(async (tx) => {
      // Reserve stock first; the conditional update stops two shoppers buying the last unit.
      for (const item of cart.items) {
        const reserved = await tx.$executeRaw`
          UPDATE "Inventory"
          SET "reservedQuantity" = "reservedQuantity" + ${item.quantity}, "updatedAt" = NOW()
          WHERE "productId" = ${item.productId}
            AND "stockQuantity" - "reservedQuantity" >= ${item.quantity}`;
        if (reserved === 0) {
          const hasInventory = await tx.inventory.count({ where: { productId: item.productId } });
          if (hasInventory) throw new BadRequestError(`Not enough stock for ${item.product.name}`);
        }
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: OrderStatus.PENDING,
          fulfillmentType: data.fulfillmentType,
          addressId: data.fulfillmentType === "DELIVERY" ? data.addressId : null,
          subtotal: q.subtotal,
          taxAmount: q.taxAmount,
          shippingAmount: q.shippingAmount,
          discountAmount: q.discountAmount,
          totalAmount: q.totalAmount,
          rewardPointsUsed: q.rewardPointsUsed,
          rewardDiscount: q.rewardDiscount,
          couponId: q.coupon?.id || null,
          notes: data.notes,
          estimatedDelivery:
            data.fulfillmentType === "DELIVERY" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productSku: item.product.sku,
              productImage: item.product.images?.[0]?.url || null,
              quantity: item.quantity,
              unitPrice: Number(item.product.price),
              totalPrice: item.lineTotal,
            })),
          },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              note:
                paymentMethod === "CARD"
                  ? "Order placed — awaiting card payment"
                  : `Order placed — pay on ${data.fulfillmentType === "PICKUP" ? "pickup" : "delivery"}`,
            },
          },
          ...(paymentMethod === "PAY_ON_DELIVERY"
            ? {
                payment: {
                  create: {
                    amount: q.totalAmount,
                    currency: "USD",
                    status: "PENDING",
                    method: "CASH_ON_DELIVERY",
                  },
                },
              }
            : {}),
        },
        include: { items: true, user: { select: { email: true, firstName: true } } },
      });

      if (q.rewardPointsUsed > 0) {
        const account = await tx.rewardAccount.update({
          where: { userId },
          data: { availablePoints: { decrement: q.rewardPointsUsed } },
        });
        if (account.availablePoints < 0) throw new BadRequestError("Insufficient reward points");
        await tx.rewardTransaction.create({
          data: {
            rewardAccountId: account.id,
            type: "REDEEM",
            points: -q.rewardPointsUsed,
            description: `Redeemed for order ${newOrder.orderNumber}`,
            referenceId: newOrder.id,
          },
        });
      }

      if (q.coupon) {
        await tx.coupon.update({ where: { id: q.coupon.id }, data: { usedCount: { increment: 1 } } });
      }

      // Pay-on-delivery orders are final now, so empty the cart. Card orders keep the cart
      // until payment succeeds, so a failed payment doesn't lose the shopper's items.
      if (paymentMethod === "PAY_ON_DELIVERY") {
        const c = await tx.cart.findUnique({ where: { userId } });
        if (c) await tx.cartItem.deleteMany({ where: { cartId: c.id } });
      }

      return newOrder;
    });

    emailService
      .sendOrderConfirmation({
        orderNumber: order.orderNumber,
        customerEmail: order.user.email,
        customerName: order.user.firstName,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
      })
      .catch((err) => console.error("Order confirmation email failed:", err));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      paymentMethod,
    };
  }

  // ─── Read ───

  async getOrders(userId: string, page: number, limit: number, status?: string) {
    const where: Prisma.OrderWhereInput = { userId };
    if (status && (Object.values(OrderStatus) as string[]).includes(status)) {
      where.status = status as OrderStatus;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            select: {
              id: true,
              productName: true,
              productImage: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
          payment: { select: { status: true, method: true, paidAt: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        fulfillmentType: o.fulfillmentType,
        totalAmount: Number(o.totalAmount),
        itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
        items: o.items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice), totalPrice: Number(i.totalPrice) })),
        payment: o.payment,
        createdAt: o.createdAt,
        estimatedDelivery: o.estimatedDelivery,
        deliveredAt: o.deliveredAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Full order detail. Pass userId to scope to a customer; omit for admin. */
  async getOrderById(userId: string | null, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, ...(userId ? { userId } : {}) },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items: {
          include: { product: { select: { slug: true, images: { take: 1, select: { url: true } } } } },
        },
        address: true,
        payment: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        coupon: { select: { code: true, discountType: true, discountValue: true } },
        refunds: true,
      },
    });

    if (!order) throw new NotFoundError("Order not found");

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      fulfillmentType: order.fulfillmentType,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      shippingAmount: Number(order.shippingAmount),
      discountAmount: Number(order.discountAmount),
      rewardPointsUsed: order.rewardPointsUsed,
      rewardDiscount: Number(order.rewardDiscount),
      totalAmount: Number(order.totalAmount),
      notes: order.notes,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      cancelReason: order.cancelReason,
      createdAt: order.createdAt,
      canCancel:
        (order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) &&
        order.payment?.status !== "COMPLETED",
      nextStatuses: allowedNextStatuses(order.status, order.fulfillmentType),
      customer: userId
        ? undefined
        : {
            id: order.user.id,
            name: `${order.user.firstName} ${order.user.lastName}`,
            email: order.user.email,
            phone: order.user.phone,
          },
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        productSku: i.productSku,
        productImage: i.productImage,
        productSlug: i.product?.slug,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
      address: order.address,
      payment: order.payment
        ? {
            id: order.payment.id,
            status: order.payment.status,
            method: order.payment.method,
            amount: Number(order.payment.amount),
            paidAt: order.payment.paidAt,
            receiptUrl: order.payment.receiptUrl,
          }
        : null,
      statusHistory: order.statusHistory.map((h) => ({ status: h.status, note: h.note, createdAt: h.createdAt })),
      coupon: order.coupon
        ? {
            code: order.coupon.code,
            discountType: order.coupon.discountType,
            discountValue: Number(order.coupon.discountValue),
          }
        : null,
      refunds: order.refunds.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  }

  async getOrderTracking(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { statusHistory: { orderBy: { createdAt: "asc" } } },
    });
    if (!order) throw new NotFoundError("Order not found");
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      fulfillmentType: order.fulfillmentType,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      statusHistory: order.statusHistory.map((h) => ({ status: h.status, note: h.note, createdAt: h.createdAt })),
    };
  }

  // ─── State changes ───

  /** Customer-initiated cancel: only before the order is being prepared, and not once paid by card. */
  async cancelOrder(userId: string, orderId: string, reason: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: { payment: true } });
    if (!order) throw new NotFoundError("Order not found");

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestError("This order can no longer be cancelled");
    }
    if (order.payment?.status === "COMPLETED") {
      throw new BadRequestError("This order has been paid. Please contact the store to cancel and get a refund.");
    }

    await prisma.$transaction((tx) => this.cancelTx(tx, order.id, `Cancelled by customer: ${reason}`, userId, reason));
    this.notifyStatus(order.id).catch(() => {});
    return { message: "Order cancelled successfully" };
  }

  /** Admin status change with transition rules and the matching stock/points/payment effects. */
  async updateStatus(orderId: string, status: OrderStatus, note: string | undefined, changedBy: string | undefined) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new NotFoundError("Order not found");

    const allowed = allowedNextStatuses(order.status, order.fulfillmentType);
    if (!allowed.includes(status)) {
      throw new BadRequestError(
        `Can't change an order from ${order.status.replace(/_/g, " ").toLowerCase()} to ${status
          .replace(/_/g, " ")
          .toLowerCase()}`
      );
    }

    if (
      status === OrderStatus.CONFIRMED &&
      order.payment?.method !== "CASH_ON_DELIVERY" &&
      order.payment?.status !== "COMPLETED"
    ) {
      throw new BadRequestError("This order is waiting for card payment. It will confirm automatically once paid.");
    }

    await prisma.$transaction(async (tx) => {
      if (status === OrderStatus.CANCELLED) {
        await this.cancelTx(tx, orderId, note ? `Cancelled by store: ${note}` : "Cancelled by store", changedBy, note);
        return;
      }

      if (status === OrderStatus.CONFIRMED) {
        await this.confirmTx(tx, orderId, note || "Confirmed by store", changedBy);
        return;
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status, ...(status === OrderStatus.DELIVERED ? { deliveredAt: new Date() } : {}) },
      });
      await tx.orderStatusHistory.create({ data: { orderId, status, note, changedBy } });

      // Cash collected at handover
      if (
        status === OrderStatus.DELIVERED &&
        order.payment?.method === "CASH_ON_DELIVERY" &&
        order.payment.status !== "COMPLETED"
      ) {
        await tx.payment.update({ where: { orderId }, data: { status: "COMPLETED", paidAt: new Date() } });
      }
    });

    this.notifyStatus(orderId).catch(() => {});
    return { message: "Order status updated" };
  }

  /** Admin records that a pay-on-delivery order has been paid. */
  async markPaid(orderId: string, changedBy: string | undefined, note?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new NotFoundError("Order not found");
    if (order.status === OrderStatus.CANCELLED) throw new BadRequestError("This order was cancelled");
    if (!order.payment) throw new BadRequestError("This order has no payment record");
    if (order.payment.status === "COMPLETED") throw new BadRequestError("This order is already paid");
    if (order.payment.method !== "CASH_ON_DELIVERY") {
      throw new BadRequestError("Card payments are marked paid automatically by Stripe");
    }
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { orderId }, data: { status: "COMPLETED", paidAt: new Date() } });
      await tx.orderStatusHistory.create({
        data: { orderId, status: order.status, note: note || "Payment received", changedBy },
      });
    });
    return { message: "Payment recorded" };
  }

  /** Called when a card payment succeeds. */
  async confirmOrder(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError("Order not found");
    if (order.status !== OrderStatus.PENDING) return;
    await prisma.$transaction(async (tx) => {
      await this.confirmTx(tx, orderId, "Payment confirmed", undefined);
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    });
    this.notifyStatus(orderId).catch(() => {});
  }

  /** PENDING → CONFIRMED: move reserved stock to sold, award points. */
  private async confirmTx(tx: Tx, orderId: string, note: string, changedBy: string | undefined) {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new NotFoundError("Order not found");
    if (order.status !== OrderStatus.PENDING) return;

    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.CONFIRMED } });
    await tx.orderStatusHistory.create({ data: { orderId, status: OrderStatus.CONFIRMED, note, changedBy } });

    for (const item of order.items) {
      const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
      if (!inv) continue;
      const newQty = Math.max(0, inv.stockQuantity - item.quantity);
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { stockQuantity: newQty, reservedQuantity: Math.max(0, inv.reservedQuantity - item.quantity) },
      });
      await tx.inventoryAdjustment.create({
        data: {
          inventoryId: inv.id,
          type: "SALE",
          quantity: -item.quantity,
          previousQty: inv.stockQuantity,
          newQty,
          reason: `Order ${order.orderNumber}`,
          referenceId: order.id,
          adjustedBy: changedBy,
        },
      });
    }

    await rewardService.awardPurchaseTx(tx, order.userId, order.id, order.orderNumber, Number(order.totalAmount));
  }

  /** Cancel inside a transaction: release or restore stock, refund points, free the coupon use. */
  private async cancelTx(tx: Tx, orderId: string, note: string, changedBy: string | undefined, reason?: string) {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true, payment: true } });
    if (!order) throw new NotFoundError("Order not found");
    if (order.status === OrderStatus.CANCELLED) return;

    const deducted = STOCK_DEDUCTED.includes(order.status);

    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date(), cancelReason: reason || null },
    });
    await tx.orderStatusHistory.create({ data: { orderId, status: OrderStatus.CANCELLED, note, changedBy } });

    for (const item of order.items) {
      const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
      if (!inv) continue;
      if (deducted) {
        // Stock had left the shelf on confirmation — put it back
        const newQty = inv.stockQuantity + item.quantity;
        await tx.inventory.update({ where: { productId: item.productId }, data: { stockQuantity: newQty } });
        await tx.inventoryAdjustment.create({
          data: {
            inventoryId: inv.id,
            type: "RETURN",
            quantity: item.quantity,
            previousQty: inv.stockQuantity,
            newQty,
            reason: `Order ${order.orderNumber} cancelled`,
            referenceId: order.id,
            adjustedBy: changedBy,
          },
        });
      } else {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { reservedQuantity: Math.max(0, inv.reservedQuantity - item.quantity) },
        });
      }
    }

    if (order.rewardPointsUsed > 0) {
      const account = await tx.rewardAccount.update({
        where: { userId: order.userId },
        data: { availablePoints: { increment: order.rewardPointsUsed } },
      });
      await tx.rewardTransaction.create({
        data: {
          rewardAccountId: account.id,
          type: "ADJUSTMENT",
          points: order.rewardPointsUsed,
          description: `Points restored for cancelled order ${order.orderNumber}`,
          referenceId: order.id,
        },
      });
    }

    if (deducted) {
      await rewardService.reversePurchaseTx(tx, order.userId, order.id, order.orderNumber, Number(order.totalAmount));
    }

    if (order.couponId) {
      await tx.coupon.updateMany({
        where: { id: order.couponId, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }

    if (order.payment) {
      if (order.payment.status === "COMPLETED") {
        // Money was taken: record a refund for the store to complete in Stripe / at the till
        await tx.refund.create({
          data: {
            orderId,
            amount: order.payment.amount,
            reason: reason || "Order cancelled",
            status: "PENDING",
            processedBy: changedBy,
          },
        });
      } else if (order.payment.status === "PENDING" || order.payment.status === "PROCESSING") {
        await tx.payment.update({
          where: { orderId },
          data: { status: "FAILED", failureReason: "Order cancelled before payment" },
        });
      }
    }
  }

  /**
   * Card orders reserve stock while the shopper pays. If they never pay, cancel the
   * order after an hour so the stock goes back on sale.
   */
  async expireUnpaidCardOrders(maxAgeMinutes = 60) {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    const stale = await prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        createdAt: { lt: cutoff },
        OR: [{ payment: null }, { payment: { method: "STRIPE", status: { in: ["PENDING", "FAILED", "PROCESSING"] } } }],
      },
      select: { id: true },
      take: 100,
    });
    for (const o of stale) {
      await prisma
        .$transaction((tx) => this.cancelTx(tx, o.id, "Cancelled automatically — card payment not completed", undefined, "Payment not completed"))
        .catch((err) => console.error(`Failed to expire order ${o.id}:`, err));
    }
    return stale.length;
  }

  private async notifyStatus(orderId: string) {
    const o = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, status: true, user: { select: { email: true, firstName: true } } },
    });
    if (!o) return;
    await emailService.sendOrderStatusUpdate({
      customerEmail: o.user.email,
      customerName: o.user.firstName,
      orderNumber: o.orderNumber,
      status: o.status,
    });
  }
}

export const orderService = new OrderService();
