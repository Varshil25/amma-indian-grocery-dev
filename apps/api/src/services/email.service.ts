import { env } from "../config/env.js";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private from = env.EMAIL_FROM;

  async send(options: EmailOptions): Promise<void> {
    // In production, use SendGrid/Nodemailer
    // For now, log to console
    if (env.NODE_ENV === "production" && env.SENDGRID_API_KEY) {
      try {
        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: options.to }] }],
            from: { email: this.from },
            subject: options.subject,
            content: [{ type: "text/html", value: options.html }],
          }),
        });
        if (!response.ok) {
          console.error("SendGrid error:", await response.text());
        }
      } catch (err) {
        console.error("Email send failed:", err);
      }
    } else {
      console.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);
    }
  }

  async sendOrderConfirmation(order: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    totalAmount: number;
    items: { productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
  }) {
    const itemRows = order.items
      .map(
        (i) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.productName}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${i.totalPrice.toFixed(2)}</td></tr>`
      )
      .join("");

    await this.send({
      to: order.customerEmail,
      subject: `Order Confirmed - #${order.orderNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#22c55e;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
            <h1 style="margin:0;font-size:24px">Order Confirmed!</h1>
          </div>
          <div style="padding:24px;background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
            <p>Hi ${order.customerName},</p>
            <p>Thank you for your order! Here's your order summary:</p>
            <p><strong>Order #${order.orderNumber}</strong></p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <thead><tr style="background:#f9fafb"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Total</th></tr></thead>
              <tbody>${itemRows}</tbody>
              <tfoot><tr><td colspan="2" style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold;color:#22c55e">$${order.totalAmount.toFixed(2)}</td></tr></tfoot>
            </table>
            <p>We'll notify you when your order is ready.</p>
            <p style="color:#6b7280;font-size:14px">— Amma Indian Grocery</p>
          </div>
        </div>
      `,
    });
  }

  async sendOrderStatusUpdate(data: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    status: string;
  }) {
    const statusMessages: Record<string, string> = {
      CONFIRMED: "Your order has been confirmed and is being prepared.",
      PROCESSING: "Your order is now being processed.",
      READY_FOR_PICKUP: "Your order is ready for pickup!",
      OUT_FOR_DELIVERY: "Your order is out for delivery!",
      DELIVERED: "Your order has been delivered. Enjoy!",
      CANCELLED: "Your order has been cancelled.",
    };

    await this.send({
      to: data.customerEmail,
      subject: `Order #${data.orderNumber} - ${data.status.replace(/_/g, " ")}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:white;border:1px solid #e5e7eb;border-radius:8px">
          <h2 style="color:#111827">Order Update</h2>
          <p>Hi ${data.customerName},</p>
          <p>${statusMessages[data.status] || `Your order status is now: ${data.status}`}</p>
          <p><strong>Order:</strong> #${data.orderNumber}</p>
          <p style="color:#6b7280;font-size:14px">— Amma Indian Grocery</p>
        </div>
      `,
    });
  }

  async sendPasswordReset(data: { email: string; code: string }) {
    await this.send({
      to: data.email,
      subject: "Password Reset - Amma Indian Grocery",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:white;border:1px solid #e5e7eb;border-radius:8px">
          <h2 style="color:#111827">Password Reset</h2>
          <p>Your password reset code is:</p>
          <div style="background:#f3f4f6;padding:16px;text-align:center;border-radius:8px;margin:16px 0">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#22c55e">${data.code}</span>
          </div>
          <p>This code expires in 10 minutes.</p>
          <p style="color:#6b7280;font-size:14px">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendWelcome(data: { email: string; name: string }) {
    await this.send({
      to: data.email,
      subject: "Welcome to Amma Indian Grocery!",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:white;border:1px solid #e5e7eb;border-radius:8px">
          <div style="text-align:center;margin-bottom:16px">
            <h1 style="color:#22c55e;margin:0">Welcome!</h1>
          </div>
          <p>Hi ${data.name},</p>
          <p>Welcome to Amma Indian Grocery! You've earned <strong>50 bonus points</strong> just for signing up.</p>
          <p>Start shopping and earn rewards with every purchase.</p>
          <p style="color:#6b7280;font-size:14px">— Amma Indian Grocery</p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
