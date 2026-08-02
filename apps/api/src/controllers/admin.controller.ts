import { Request, Response, NextFunction } from "express";
import { adminService } from "../services/admin.service.js";

function q(val: unknown): string | undefined {
  return val ? String(val) : undefined;
}

export class AdminController {
  // ─── DASHBOARD ───
  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.getDashboardStats()); } catch (err) { next(err); }
  }

  // ─── PRODUCTS ───
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await adminService.getProducts(Number(req.query.page) || 1, Number(req.query.limit) || 20, q(req.query.search)));
    } catch (err) { next(err); }
  }

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await adminService.createProduct(req.body)); } catch (err) { next(err); }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.updateProduct(req.params.id as string, req.body)); } catch (err) { next(err); }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.deleteProduct(req.params.id as string)); } catch (err) { next(err); }
  }

  // ─── CATEGORIES ───
  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.getCategories()); } catch (err) { next(err); }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await adminService.createCategory(req.body)); } catch (err) { next(err); }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.updateCategory(req.params.id as string, req.body)); } catch (err) { next(err); }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.deleteCategory(req.params.id as string)); } catch (err) { next(err); }
  }

  // ─── ORDERS ───
  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await adminService.getOrders(Number(req.query.page) || 1, Number(req.query.limit) || 20, q(req.query.status), q(req.query.search)));
    } catch (err) { next(err); }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await adminService.updateOrderStatus(req.params.id as string, req.body.status, req.body.note, req.user?.userId));
    } catch (err) { next(err); }
  }

  // ─── CUSTOMERS ───
  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await adminService.getCustomers(Number(req.query.page) || 1, Number(req.query.limit) || 20, q(req.query.search)));
    } catch (err) { next(err); }
  }

  // ─── INVENTORY ───
  async getInventory(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await adminService.getInventory(Number(req.query.page) || 1, Number(req.query.limit) || 20, q(req.query.filter)));
    } catch (err) { next(err); }
  }

  async adjustInventory(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.adjustInventory(req.params.productId as string, req.body)); } catch (err) { next(err); }
  }

  async getExpiringBatches(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.getExpiringBatches(Number(req.query.days) || 7)); } catch (err) { next(err); }
  }

  // ─── COUPONS ───
  async getCoupons(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.getCoupons(Number(req.query.page) || 1, Number(req.query.limit) || 20)); } catch (err) { next(err); }
  }

  async createCoupon(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await adminService.createCoupon(req.body)); } catch (err) { next(err); }
  }

  async updateCoupon(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.updateCoupon(req.params.id as string, req.body)); } catch (err) { next(err); }
  }

  async deleteCoupon(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.deleteCoupon(req.params.id as string)); } catch (err) { next(err); }
  }

  // ─── DEALS ───
  async getDeals(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.getDeals(Number(req.query.page) || 1, Number(req.query.limit) || 20)); } catch (err) { next(err); }
  }

  async createDeal(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await adminService.createDeal(req.body)); } catch (err) { next(err); }
  }

  async updateDeal(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.updateDeal(req.params.id as string, req.body)); } catch (err) { next(err); }
  }

  async deleteDeal(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.deleteDeal(req.params.id as string)); } catch (err) { next(err); }
  }

  // ─── BANNERS ───
  async getBanners(_req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.getBanners()); } catch (err) { next(err); }
  }

  async createBanner(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await adminService.createBanner(req.body)); } catch (err) { next(err); }
  }

  async updateBanner(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.updateBanner(req.params.id as string, req.body)); } catch (err) { next(err); }
  }

  async deleteBanner(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.deleteBanner(req.params.id as string)); } catch (err) { next(err); }
  }

  // ─── STATIC PAGES ───
  async getPages(_req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.getPages()); } catch (err) { next(err); }
  }

  async getPage(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.getPage(req.params.id as string)); } catch (err) { next(err); }
  }

  async upsertPage(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.upsertPage(req.body)); } catch (err) { next(err); }
  }

  // ─── REPORTS ───
  async getSalesReport(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.getSalesReport(String(req.query.startDate), String(req.query.endDate))); } catch (err) { next(err); }
  }

  async getInventoryReport(_req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.getInventoryReport()); } catch (err) { next(err); }
  }

  async getCustomerReport(req: Request, res: Response, next: NextFunction) {
    try { res.json(await adminService.getCustomerReport(String(req.query.startDate), String(req.query.endDate))); } catch (err) { next(err); }
  }

  async exportOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await adminService.exportOrders(String(req.query.startDate), String(req.query.endDate));
      // Return as CSV
      const header = "Order Number,Customer,Email,Status,Total,Date\n";
      const rows = orders.map((o) =>
        `${o.orderNumber},"${o.user.firstName} ${o.user.lastName}",${o.user.email},${o.status},${Number(o.totalAmount).toFixed(2)},${o.createdAt.toISOString()}`
      ).join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=orders-export.csv");
      res.send(header + rows);
    } catch (err) { next(err); }
  }

  // ─── STORE SETTINGS ───
  async getStoreSettings(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await adminService.getStoreSettings() }); } catch (err) { next(err); }
  }

  async updateStoreSettings(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await adminService.updateStoreSettings(req.body) }); } catch (err) { next(err); }
  }

  // ─── CONTACT MESSAGES ───
  async getContactMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      res.json({ success: true, data: await adminService.getContactMessages(page) });
    } catch (err) { next(err); }
  }

  async markMessageRead(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await adminService.markMessageRead(req.params.id) }); } catch (err) { next(err); }
  }
}

export const adminController = new AdminController();
