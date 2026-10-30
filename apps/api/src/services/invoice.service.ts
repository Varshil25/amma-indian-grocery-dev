import prisma from "../config/database.js";
import { NotFoundError } from "../middleware/errorHandler.js";
import { settingsService } from "./settings.service.js";

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export class InvoiceService {
  async generateInvoiceHtml(orderId: string, userId?: string) {
    const where: Record<string, unknown> = { id: orderId };
    if (userId) where.userId = userId;

    const order = await prisma.order.findFirst({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        items: true,
        address: true,
        payment: true,
      },
    });

    if (!order) throw new NotFoundError("Order not found");
    const store = await settingsService.getAll();
    const storeName = esc(store.store_name || "Amma Indian Grocery");

    const itemRows = order.items
      .map(
        (i) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb">${esc(i.productName)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center">${i.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right">$${Number(i.unitPrice).toFixed(2)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right">$${Number(i.totalPrice).toFixed(2)}</td>
      </tr>`
      )
      .join("");

    const addressBlock = order.address
      ? `
      <p style="margin:4px 0">${esc(order.address.firstName)} ${esc(order.address.lastName)}</p>
      <p style="margin:4px 0">${esc(order.address.addressLine1)}</p>
      ${order.address.addressLine2 ? `<p style="margin:4px 0">${esc(order.address.addressLine2)}</p>` : ""}
      <p style="margin:4px 0">${esc(order.address.city)}, ${esc(order.address.state)} ${esc(order.address.zipCode)}</p>
      ${order.address.phone ? `<p style="margin:4px 0">${esc(order.address.phone)}</p>` : ""}
    `
      : "<p>Pickup order</p>";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${order.orderNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #111827; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #22c55e; }
    .invoice-title { font-size: 28px; color: #6b7280; text-align: right; }
    .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .details-block { }
    .details-block h4 { margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .details-block p { margin: 4px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { background: #f9fafb; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    .totals { width: 300px; margin-left: auto; }
    .totals tr td { padding: 6px 10px; font-size: 14px; }
    .totals .total-row td { font-size: 18px; font-weight: bold; border-top: 2px solid #111827; padding-top: 10px; }
    .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">${storeName}</div>
      <p style="color:#6b7280;font-size:14px;margin:4px 0">Fresh. Authentic. Delivered.</p>
    </div>
    <div style="text-align:right">
      <div class="invoice-title">INVOICE</div>
      <p style="margin:4px 0;font-size:14px"><strong>#${order.orderNumber}</strong></p>
      <p style="margin:4px 0;font-size:14px;color:#6b7280">${new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
  </div>

  <div class="details">
    <div class="details-block">
      <h4>Bill To</h4>
      <p style="font-weight:bold">${esc(order.user.firstName)} ${esc(order.user.lastName)}</p>
      <p>${esc(order.user.email)}</p>
      ${order.user.phone ? `<p>${esc(order.user.phone)}</p>` : ""}
    </div>
    <div class="details-block">
      <h4>Ship To</h4>
      ${addressBlock}
    </div>
    <div class="details-block">
      <h4>Payment</h4>
      <p>${order.payment?.method || "N/A"}</p>
      <p>Status: ${order.payment?.status || "Pending"}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td style="text-align:right">$${Number(order.subtotal).toFixed(2)}</td></tr>
    ${Number(order.discountAmount) > 0 ? `<tr><td style="color:#22c55e">Discount</td><td style="text-align:right;color:#22c55e">-$${Number(order.discountAmount).toFixed(2)}</td></tr>` : ""}
    <tr><td>Tax</td><td style="text-align:right">$${Number(order.taxAmount).toFixed(2)}</td></tr>
    <tr><td>Shipping</td><td style="text-align:right">${Number(order.shippingAmount) === 0 ? "Free" : `$${Number(order.shippingAmount).toFixed(2)}`}</td></tr>
    <tr class="total-row"><td>Total</td><td style="text-align:right;color:#22c55e">$${Number(order.totalAmount).toFixed(2)}</td></tr>
  </table>

  <div class="footer">
    <p>Thank you for shopping with ${storeName}!</p>
    ${store.store_email ? `<p>Questions? Contact us at ${esc(store.store_email)}</p>` : ""}
  </div>
</body>
</html>`;
  }
}

export const invoiceService = new InvoiceService();
