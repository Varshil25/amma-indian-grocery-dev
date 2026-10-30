import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler as h } from "../utils/async-handler.js";
import { adminController as c } from "../controllers/admin.controller.js";
import {
  createProductSchema,
  updateProductSchema,
  categorySchema,
  updateCategorySchema,
  createCouponSchema,
  updateCouponSchema,
  createDealSchema,
  updateDealSchema,
  createBannerSchema,
  updateBannerSchema,
  updateOrderStatusSchema,
  markOrderPaidSchema,
  adjustInventorySchema,
  inventorySettingsSchema,
  updateCustomerSchema,
  pageSchema,
  storeSettingsSchema,
  uploadMediaSchema,
} from "../validators/admin.validator.js";

const router = Router();

// All admin routes require authentication + a staff role
router.use(authenticate, authorize("ADMIN" as never, "SUPER_ADMIN" as never, "STAFF" as never));

// Dashboard
router.get("/dashboard/stats", h(c.getDashboardStats));

// Media (image uploads)
router.post("/media", validate(uploadMediaSchema), h(c.uploadMedia));

// Products
router.get("/products", h(c.getProducts));
router.get("/products/:id", h(c.getProduct));
router.post("/products", validate(createProductSchema), h(c.createProduct));
router.put("/products/:id", validate(updateProductSchema), h(c.updateProduct));
router.delete("/products/:id", h(c.deleteProduct));

// Categories
router.get("/categories", h(c.getCategories));
router.post("/categories", validate(categorySchema), h(c.createCategory));
router.put("/categories/:id", validate(updateCategorySchema), h(c.updateCategory));
router.delete("/categories/:id", h(c.deleteCategory));

// Orders
router.get("/orders", h(c.getOrders));
router.get("/orders/:id", h(c.getOrder));
router.put("/orders/:id/status", validate(updateOrderStatusSchema), h(c.updateOrderStatus));
router.post("/orders/:id/mark-paid", validate(markOrderPaidSchema), h(c.markOrderPaid));
router.get("/orders/:id/invoice", h(c.getOrderInvoice));

// Customers
router.get("/customers", h(c.getCustomers));
router.get("/customers/:id", h(c.getCustomer));
router.put("/customers/:id", validate(updateCustomerSchema), h(c.updateCustomer));

// Inventory
router.get("/inventory", h(c.getInventory));
router.get("/inventory/expiring", h(c.getExpiringBatches));
router.post("/inventory/:productId/adjust", validate(adjustInventorySchema), h(c.adjustInventory));
router.put("/inventory/:productId", validate(inventorySettingsSchema), h(c.updateInventorySettings));
router.get("/inventory/:productId/history", h(c.getInventoryHistory));

// Coupons
router.get("/coupons", h(c.getCoupons));
router.post("/coupons", validate(createCouponSchema), h(c.createCoupon));
router.put("/coupons/:id", validate(updateCouponSchema), h(c.updateCoupon));
router.delete("/coupons/:id", h(c.deleteCoupon));

// Deals
router.get("/deals", h(c.getDeals));
router.post("/deals", validate(createDealSchema), h(c.createDeal));
router.put("/deals/:id", validate(updateDealSchema), h(c.updateDeal));
router.delete("/deals/:id", h(c.deleteDeal));

// Banners
router.get("/banners", h(c.getBanners));
router.post("/banners", validate(createBannerSchema), h(c.createBanner));
router.put("/banners/:id", validate(updateBannerSchema), h(c.updateBanner));
router.delete("/banners/:id", h(c.deleteBanner));

// Static Pages
router.get("/pages", h(c.getPages));
router.get("/pages/:id", h(c.getPage));
router.post("/pages", validate(pageSchema), h(c.savePage));
router.delete("/pages/:id", h(c.deletePage));

// Reports
router.get("/reports/sales", h(c.getSalesReport));
router.get("/reports/inventory", h(c.getInventoryReport));
router.get("/reports/customers", h(c.getCustomerReport));
router.get("/reports/export/orders", h(c.exportOrders));

// Store Settings
router.get("/store-settings", h(c.getStoreSettings));
router.put("/store-settings", validate(storeSettingsSchema), h(c.updateStoreSettings));

// Contact Messages
router.get("/contact-messages", h(c.getContactMessages));
router.put("/contact-messages/:id/read", h(c.markMessageRead));

export default router;
