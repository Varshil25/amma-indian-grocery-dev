import { OrderStatus, FulfillmentType, Prisma } from "@prisma/client";
import prisma from "../config/database.js";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";
import { cartService } from "./cart.service.js";

function generateOrderNumber(): string {
  const prefix = "AMG";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

const TAX_RATE = 0.08; // 8% tax
const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_FEE = 5.99;

export class OrderService {
  async createOrder(
    userId: string,
    data: {
      fulfillmentType: string;
      addressId?: string;
      notes?: string;
      couponCode?: string;
      rewardPointsToRedeem?: number;
    }
  ) {
    // Get cart with items
    const cart = await cartService.getCart(userId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestError("Your cart is empty");
    }

    // Verify all items are in stock
    const outOfStock = cart.items.filter((item) => !item.inStock);
    if (outOfStock.length > 0) {
      throw new BadRequestError(
        `Some items are out of stock: ${outOfStock.map((i) => i.product.name).join(", ")}`
      );
    }

    const fulfillmentType = data.fulfillmentType as FulfillmentType;

    // Validate address for delivery
    if (fulfillmentType === "DELIVERY") {
      if (!data.addressId) {
        throw new BadRequestError("Delivery address is required");
      }
      const address = await prisma.address.findFirst({
        where: { id: data.addressId, userId },
      });
      if (!address) {
        throw new NotFoundError("Address not found");
      }
    }

    // Calculate totals
    let subtotal = cart.subtotal;
    let discountAmount = 0;
    let couponId: string | null = null;

    // Apply coupon if provided
    if (data.couponCode) {
      const couponResult = await cartService.applyCoupon(userId, data.couponCode);
      discountAmount = couponResult.discount || 0;
      couponId = couponResult.coupon?.id || null;
    }

    // Apply reward points
    let rewardPointsUsed = 0;
    let rewardDiscount = 0;
    if (data.rewardPointsToRedeem && data.rewardPointsToRedeem > 0) {
      const rewardAccount = await prisma.rewardAccount.findUnique({
        where: { userId },
      });
      if (!rewardAccount || rewardAccount.availablePoints < data.rewardPointsToRedeem) {
        throw new BadRequestError("Insufficient reward points");
      }
      if (data.rewardPointsToRedeem < 500) {
        throw new BadRequestError("Minimum 500 points required for redemption");
      }
      rewardPointsUsed = data.rewardPointsToRedeem;
      rewardDiscount = Math.floor(rewardPointsUsed / 100); // 100 points = $1
    }

    // Shipping
    const shippingAmount =
      fulfillmentType === "PICKUP" || subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : SHIPPING_FEE;

    const taxAmount = parseFloat(((subtotal - discountAmount - rewardDiscount) * TAX_RATE).toFixed(2));
    const totalAmount = parseFloat(
      (subtotal - discountAmount - rewardDiscount + taxAmount + shippingAmount).toFixed(2)
    );

    if (totalAmount < 0) {
      throw new BadRequestError("Invalid order total");
    }

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: OrderStatus.PENDING,
          fulfillmentType,
          addressId: data.addressId || null,
          subtotal,
          taxAmount,
          shippingAmount,
          discountAmount,
          totalAmount,
          rewardPointsUsed,
          rewardDiscount,
          couponId,
          notes: data.notes,
          estimatedDelivery:
            fulfillmentType === "DELIVERY"
              ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
              : null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productSku: item.product.slug,
              productImage: item.product.images?.[0]?.url || null,
              quantity: item.quantity,
              unitPrice: Number(item.product.price),
              totalPrice: item.lineTotal,
            })),
          },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              note: "Order placed",
            },
          },
        },
        include: {
          items: true,
          address: true,
        },
      });

      // Reserve inventory for each item
      for (const item of cart.items) {
        await tx.inventory.updateMany({
          where: { productId: item.productId },
          data: { reservedQuantity: { increment: item.quantity } },
        });
      }

      // Deduct reward points if used
      if (rewardPointsUsed > 0) {
        await tx.rewardAccount.update({
          where: { userId },
          data: {
            availablePoints: { decrement: rewardPointsUsed },
          },
        });
        await tx.rewardTransaction.create({
          data: {
            rewardAccount: { connect: { userId } },
            type: "REDEEM",
            points: -rewardPointsUsed,
            description: `Redeemed for order ${newOrder.orderNumber}`,
            referenceId: newOrder.id,
          },
        });
      }

      // Increment coupon usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
    };
  }

  async getOrders(userId: string, page: number, limit: number, status?: string) {
    const where: Prisma.OrderWhereInput = { userId };
    if (status) {
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
          payment: {
            select: { status: true, method: true, paidAt: true },
          },
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
        items: o.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
        payment: o.payment,
        createdAt: o.createdAt,
        estimatedDelivery: o.estimatedDelivery,
        deliveredAt: o.deliveredAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            product: {
              select: { slug: true, images: { take: 1, select: { url: true } } },
            },
          },
        },
        address: true,
        payment: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        coupon: {
          select: { code: true, discountType: true, discountValue: true },
        },
        refunds: true,
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

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
      statusHistory: order.statusHistory.map((h) => ({
        status: h.status,
        note: h.note,
        createdAt: h.createdAt,
      })),
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

  async cancelOrder(userId: string, orderId: string, reason: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, payment: true },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
    ];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestError("This order can no longer be cancelled");
    }

    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      });

      // Add status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.CANCELLED,
          note: `Cancelled by customer: ${reason}`,
          changedBy: userId,
        },
      });

      // Release reserved inventory
      for (const item of order.items) {
        await tx.inventory.updateMany({
          where: { productId: item.productId },
          data: { reservedQuantity: { decrement: item.quantity } },
        });
      }

      // Restore reward points if used
      if (order.rewardPointsUsed > 0) {
        await tx.rewardAccount.update({
          where: { userId },
          data: {
            availablePoints: { increment: order.rewardPointsUsed },
          },
        });
        await tx.rewardTransaction.create({
          data: {
            rewardAccount: { connect: { userId } },
            type: "ADJUSTMENT",
            points: order.rewardPointsUsed,
            description: `Points restored for cancelled order ${order.orderNumber}`,
            referenceId: order.id,
          },
        });
      }
    });

    return { message: "Order cancelled successfully" };
  }

  async getOrderTracking(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      fulfillmentType: order.fulfillmentType,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      statusHistory: order.statusHistory.map((h) => ({
        status: h.status,
        note: h.note,
        createdAt: h.createdAt,
      })),
    };
  }

  /**
   * Called after successful payment to confirm the order
   */
  async confirmOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundError("Order not found");
    if (order.status !== OrderStatus.PENDING) return;

    await prisma.$transaction(async (tx) => {
      // Move from PENDING → CONFIRMED
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CONFIRMED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.CONFIRMED,
          note: "Payment confirmed",
        },
      });

      // Deduct actual stock (move from reserved to sold)
      for (const item of order.items) {
        await tx.inventory.updateMany({
          where: { productId: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity },
            reservedQuantity: { decrement: item.quantity },
          },
        });

        // Create inventory adjustment record
        const inv = await tx.inventory.findFirst({ where: { productId: item.productId } });
        if (inv) {
          const prevQty = inv.stockQuantity + item.quantity; // before decrement
          await tx.inventoryAdjustment.create({
            data: {
              inventoryId: inv.id,
              type: "SALE",
              quantity: -item.quantity,
              previousQty: prevQty,
              newQty: inv.stockQuantity,
              reason: `Order ${order.orderNumber}`,
              referenceId: order.id,
            },
          });
        }
      }

      // Award reward points (1 point per $1 spent)
      const pointsEarned = Math.floor(Number(order.totalAmount));
      if (pointsEarned > 0) {
        const rewardAccount = await tx.rewardAccount.findUnique({
          where: { userId: order.userId },
        });

        if (rewardAccount) {
          await tx.rewardAccount.update({
            where: { userId: order.userId },
            data: {
              totalPoints: { increment: pointsEarned },
              availablePoints: { increment: pointsEarned },
              lifetimeSpend: { increment: Number(order.totalAmount) },
            },
          });

          await tx.rewardTransaction.create({
            data: {
              rewardAccount: { connect: { userId: order.userId } },
              type: "EARN_PURCHASE",
              points: pointsEarned,
              description: `Earned from order ${order.orderNumber}`,
              referenceId: order.id,
            },
          });
        }
      }

      // Clear the user's cart
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    });
  }
}

export const orderService = new OrderService();
