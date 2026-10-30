import Stripe from "stripe";
import { PaymentStatus, PaymentMethod } from "@prisma/client";
import prisma from "../config/database.js";
import { env } from "../config/env.js";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";
import { orderService } from "./order.service.js";

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

export class PaymentService {
  async createPaymentIntent(userId: string, orderId: string) {
    if (!stripe) {
      throw new BadRequestError("Payment processing is not configured");
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.status !== "PENDING") {
      throw new BadRequestError("Order is not in a payable state");
    }

    if (order.payment && order.payment.method === "CASH_ON_DELIVERY") {
      throw new BadRequestError("This order is set to be paid on delivery/pickup");
    }

    // If payment already exists, return existing client secret
    if (order.payment?.stripeClientSecret) {
      return {
        clientSecret: order.payment.stripeClientSecret,
        paymentId: order.payment.id,
      };
    }

    const amount = Math.round(Number(order.totalAmount) * 100); // cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId,
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: Number(order.totalAmount),
        currency: "USD",
        status: PaymentStatus.PENDING,
        method: PaymentMethod.STRIPE,
        stripePaymentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    };
  }

  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    if (!rawBody || !signature) {
      throw new BadRequestError("Missing webhook body or signature");
    }
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
      throw new BadRequestError("Webhook not configured");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch {
      throw new BadRequestError("Invalid webhook signature");
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentSuccess(pi.id);
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentFailure(
          pi.id,
          pi.last_payment_error?.message || "Payment failed"
        );
        break;
      }
    }

    return { received: true };
  }

  async handlePaymentSuccess(stripePaymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId },
    });

    if (!payment || payment.status === PaymentStatus.COMPLETED) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      },
    });

    // Confirm the order (deduct stock, award points, clear cart)
    await orderService.confirmOrder(payment.orderId);
  }

  async handlePaymentFailure(stripePaymentId: string, reason: string) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId },
    });

    if (!payment) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: reason,
      },
    });
  }

  /**
   * Confirm payment from the frontend (fallback if webhook is delayed)
   */
  async confirmPayment(userId: string, orderId: string) {
    if (!stripe) {
      throw new BadRequestError("Payment processing is not configured");
    }

    const payment = await prisma.payment.findFirst({
      where: {
        orderId,
        order: { userId },
      },
    });

    if (!payment || !payment.stripePaymentId) {
      throw new NotFoundError("Payment not found");
    }

    if (payment.status === "COMPLETED") {
      return { status: "already_confirmed" };
    }

    // Verify with Stripe
    const pi = await stripe.paymentIntents.retrieve(payment.stripePaymentId);

    if (pi.status === "succeeded") {
      await this.handlePaymentSuccess(payment.stripePaymentId);
      return { status: "confirmed" };
    }

    return { status: pi.status };
  }
}

export const paymentService = new PaymentService();
