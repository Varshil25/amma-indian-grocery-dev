import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { adminController } from "../controllers/admin.controller.js";

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize("ADMIN" as never, "SUPER_ADMIN" as never, "STAFF" as never));

// Dashboard
router.get("/dashboard/stats", adminController.getDashboardStats);

// Products
router.get("/products", adminController.getProducts);
router.post("/products", adminController.createProduct);
router.put("/products/:id", adminController.updateProduct);
router.delete("/products/:id", adminController.deleteProduct);

// Categories
router.get("/categories", adminController.getCategories);
router.post("/categories", adminController.createCategory);
router.put("/categories/:id", adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);

// Orders
router.get("/orders", adminController.getOrders);
router.put("/orders/:id/status", adminController.updateOrderStatus);

// Customers
router.get("/customers", adminController.getCustomers);

// Inventory
router.get("/inventory", adminController.getInventory);
router.post("/inventory/:productId/adjust", adminController.adjustInventory);
router.get("/inventory/expiring", adminController.getExpiringBatches);

// Coupons
router.get("/coupons", adminController.getCoupons);
router.post("/coupons", adminController.createCoupon);
router.put("/coupons/:id", adminController.updateCoupon);
router.delete("/coupons/:id", adminController.deleteCoupon);

// Deals
router.get("/deals", adminController.getDeals);
router.post("/deals", adminController.createDeal);
router.put("/deals/:id", adminController.updateDeal);
router.delete("/deals/:id", adminController.deleteDeal);

// Banners
router.get("/banners", adminController.getBanners);
router.post("/banners", adminController.createBanner);
router.put("/banners/:id", adminController.updateBanner);
router.delete("/banners/:id", adminController.deleteBanner);

// Static Pages
router.get("/pages", adminController.getPages);
router.get("/pages/:id", adminController.getPage);
router.post("/pages", adminController.upsertPage);

// Reports
router.get("/reports/sales", adminController.getSalesReport);
router.get("/reports/inventory", adminController.getInventoryReport);
router.get("/reports/customers", adminController.getCustomerReport);
router.get("/reports/export/orders", adminController.exportOrders);

// Store Settings
router.get("/store-settings", adminController.getStoreSettings);
router.put("/store-settings", adminController.updateStoreSettings);

// Contact Messages
router.get("/contact-messages", adminController.getContactMessages);
router.put("/contact-messages/:id/read", adminController.markMessageRead);

export default router;
