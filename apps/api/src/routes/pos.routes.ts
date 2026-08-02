import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { posController } from "../controllers/pos.controller.js";

const router = Router();

// Square webhooks (no auth — verified by signature in production)
router.post("/webhooks/inventory", posController.handleInventoryWebhook);
router.post("/webhooks/catalog", posController.handleCatalogWebhook);

// Admin-only POS management
router.use(authenticate, authorize("ADMIN" as never, "SUPER_ADMIN" as never));

router.post("/sync-inventory", posController.syncInventory);
router.get("/sync-status", posController.getSyncStatus);
router.post("/push-order/:orderId", posController.pushOrder);
router.post("/import-catalog", posController.importCatalog);
router.post("/push-price/:productId", posController.pushPrice);
router.post("/push-all-prices", posController.pushAllPrices);

export default router;
