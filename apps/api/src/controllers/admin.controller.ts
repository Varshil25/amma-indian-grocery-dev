import { Request, Response } from "express";
import { OrderStatus } from "@prisma/client";
import { adminService } from "../services/admin.service.js";
import { mediaService } from "../services/media.service.js";
import { invoiceService } from "../services/invoice.service.js";

function q(val: unknown): string | undefined {
  return typeof val === "string" && val.trim() ? val.trim() : undefined;
}
const page = (req: Request) => Math.max(1, Number(req.query.page) || 1);
const limit = (req: Request, max = 100) => Math.min(max, Math.max(1, Number(req.query.limit) || 20));
const id = (req: Request) => req.params.id as string;

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  // Quote everything; neutralise spreadsheet formula injection
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

// All handlers are wrapped with asyncHandler in admin.routes.ts
export const adminController = {
  // ─── DASHBOARD ───
  getDashboardStats: async (_req: Request, res: Response) => {
    res.json(await adminService.getDashboardStats());
  },

  // ─── MEDIA ───
  uploadMedia: async (req: Request, res: Response) => {
    res.status(201).json(await mediaService.uploadDataUrl(req, req.body.dataUrl));
  },

  // ─── PRODUCTS ───
  getProducts: async (req: Request, res: Response) => {
    res.json(await adminService.getProducts(page(req), limit(req), q(req.query.search), q(req.query.status)));
  },
  getProduct: async (req: Request, res: Response) => {
    res.json(await adminService.getProduct(id(req)));
  },
  createProduct: async (req: Request, res: Response) => {
    res.status(201).json(await adminService.createProduct(req.body, req.user?.userId));
  },
  updateProduct: async (req: Request, res: Response) => {
    res.json(await adminService.updateProduct(id(req), req.body));
  },
  deleteProduct: async (req: Request, res: Response) => {
    res.json(await adminService.deleteProduct(id(req)));
  },

  // ─── CATEGORIES ───
  getCategories: async (_req: Request, res: Response) => {
    res.json(await adminService.getCategories());
  },
  createCategory: async (req: Request, res: Response) => {
    res.status(201).json(await adminService.createCategory(req.body));
  },
  updateCategory: async (req: Request, res: Response) => {
    res.json(await adminService.updateCategory(id(req), req.body));
  },
  deleteCategory: async (req: Request, res: Response) => {
    res.json(await adminService.deleteCategory(id(req)));
  },

  // ─── ORDERS ───
  getOrders: async (req: Request, res: Response) => {
    res.json(await adminService.getOrders(page(req), limit(req), q(req.query.status), q(req.query.search)));
  },
  getOrder: async (req: Request, res: Response) => {
    res.json(await adminService.getOrder(id(req)));
  },
  updateOrderStatus: async (req: Request, res: Response) => {
    res.json(
      await adminService.updateOrderStatus(id(req), req.body.status as OrderStatus, req.body.note, req.user?.userId)
    );
  },
  getOrderInvoice: async (req: Request, res: Response) => {
    const html = await invoiceService.generateInvoiceHtml(id(req));
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  },
  markOrderPaid: async (req: Request, res: Response) => {
    res.json(await adminService.markOrderPaid(id(req), req.user?.userId, req.body?.note));
  },

  // ─── CUSTOMERS ───
  getCustomers: async (req: Request, res: Response) => {
    res.json(await adminService.getCustomers(page(req), limit(req), q(req.query.search)));
  },
  getCustomer: async (req: Request, res: Response) => {
    res.json(await adminService.getCustomer(id(req)));
  },
  updateCustomer: async (req: Request, res: Response) => {
    res.json(await adminService.updateCustomer(id(req), req.body));
  },

  // ─── INVENTORY ───
  getInventory: async (req: Request, res: Response) => {
    res.json(await adminService.getInventory(page(req), limit(req), q(req.query.filter), q(req.query.search)));
  },
  adjustInventory: async (req: Request, res: Response) => {
    res.json(await adminService.adjustInventory(req.params.productId as string, req.body, req.user?.userId));
  },
  updateInventorySettings: async (req: Request, res: Response) => {
    res.json(await adminService.updateInventorySettings(req.params.productId as string, req.body));
  },
  getInventoryHistory: async (req: Request, res: Response) => {
    res.json(await adminService.getInventoryHistory(req.params.productId as string));
  },
  getExpiringBatches: async (req: Request, res: Response) => {
    res.json(await adminService.getExpiringBatches(Number(req.query.days) || 7));
  },

  // ─── COUPONS ───
  getCoupons: async (req: Request, res: Response) => {
    res.json(await adminService.getCoupons(page(req), limit(req)));
  },
  createCoupon: async (req: Request, res: Response) => {
    res.status(201).json(await adminService.createCoupon(req.body));
  },
  updateCoupon: async (req: Request, res: Response) => {
    res.json(await adminService.updateCoupon(id(req), req.body));
  },
  deleteCoupon: async (req: Request, res: Response) => {
    res.json(await adminService.deleteCoupon(id(req)));
  },

  // ─── DEALS ───
  getDeals: async (req: Request, res: Response) => {
    res.json(await adminService.getDeals(page(req), limit(req)));
  },
  createDeal: async (req: Request, res: Response) => {
    res.status(201).json(await adminService.createDeal(req.body));
  },
  updateDeal: async (req: Request, res: Response) => {
    res.json(await adminService.updateDeal(id(req), req.body));
  },
  deleteDeal: async (req: Request, res: Response) => {
    res.json(await adminService.deleteDeal(id(req)));
  },

  // ─── BANNERS ───
  getBanners: async (_req: Request, res: Response) => {
    res.json(await adminService.getBanners());
  },
  createBanner: async (req: Request, res: Response) => {
    res.status(201).json(await adminService.createBanner(req.body));
  },
  updateBanner: async (req: Request, res: Response) => {
    res.json(await adminService.updateBanner(id(req), req.body));
  },
  deleteBanner: async (req: Request, res: Response) => {
    res.json(await adminService.deleteBanner(id(req)));
  },

  // ─── STATIC PAGES ───
  getPages: async (_req: Request, res: Response) => {
    res.json(await adminService.getPages());
  },
  getPage: async (req: Request, res: Response) => {
    res.json(await adminService.getPage(id(req)));
  },
  savePage: async (req: Request, res: Response) => {
    res.json(await adminService.savePage(req.body));
  },
  deletePage: async (req: Request, res: Response) => {
    res.json(await adminService.deletePage(id(req)));
  },

  // ─── REPORTS ───
  getSalesReport: async (req: Request, res: Response) => {
    res.json(await adminService.getSalesReport(q(req.query.startDate), q(req.query.endDate)));
  },
  getInventoryReport: async (_req: Request, res: Response) => {
    res.json(await adminService.getInventoryReport());
  },
  getCustomerReport: async (req: Request, res: Response) => {
    res.json(await adminService.getCustomerReport(q(req.query.startDate), q(req.query.endDate)));
  },
  exportOrders: async (req: Request, res: Response) => {
    const orders = await adminService.exportOrders(q(req.query.startDate), q(req.query.endDate));
    const header = ["Order Number", "Date", "Customer", "Email", "Status", "Fulfillment", "Payment", "Payment Status", "Items", "Subtotal", "Discount", "Shipping", "Tax", "Total"];
    const rows = orders.map((o) =>
      [
        o.orderNumber,
        o.createdAt.toISOString(),
        `${o.user.firstName} ${o.user.lastName}`,
        o.user.email,
        o.status,
        o.fulfillmentType,
        o.payment?.method ?? "",
        o.payment?.status ?? "",
        o.items.reduce((s, i) => s + i.quantity, 0),
        Number(o.subtotal).toFixed(2),
        (Number(o.discountAmount) + Number(o.rewardDiscount)).toFixed(2),
        Number(o.shippingAmount).toFixed(2),
        Number(o.taxAmount).toFixed(2),
        Number(o.totalAmount).toFixed(2),
      ]
        .map(csvCell)
        .join(",")
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=orders-export.csv");
    res.send([header.map(csvCell).join(","), ...rows].join("\n"));
  },

  // ─── STORE SETTINGS ───
  getStoreSettings: async (_req: Request, res: Response) => {
    res.json({ success: true, data: await adminService.getStoreSettings() });
  },
  updateStoreSettings: async (req: Request, res: Response) => {
    res.json({ success: true, data: await adminService.updateStoreSettings(req.body) });
  },

  // ─── CONTACT MESSAGES ───
  getContactMessages: async (req: Request, res: Response) => {
    res.json({ success: true, data: await adminService.getContactMessages(page(req)) });
  },
  markMessageRead: async (req: Request, res: Response) => {
    res.json({ success: true, data: await adminService.markMessageRead(id(req)) });
  },
};
