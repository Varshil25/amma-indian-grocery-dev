import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { orderController } from "../controllers/order.controller.js";
import { invoiceService } from "../services/invoice.service.js";
import {
  createOrderSchema,
  orderPreviewSchema,
  orderListQuerySchema,
  cancelOrderSchema,
} from "../validators/order.validator.js";

const router = Router();

// All order routes require authentication
router.use(authenticate);

router.post("/preview", validate(orderPreviewSchema), asyncHandler(orderController.preview));
router.post("/", validate(createOrderSchema), asyncHandler(orderController.createOrder));
router.get("/", validate(orderListQuerySchema, "query"), asyncHandler(orderController.getOrders));
router.get("/:id", asyncHandler(orderController.getOrderById));
router.put("/:id/cancel", validate(cancelOrderSchema), asyncHandler(orderController.cancelOrder));
router.get("/:id/track", asyncHandler(orderController.trackOrder));
router.get(
  "/:id/invoice",
  asyncHandler(async (req, res) => {
    const html = await invoiceService.generateInvoiceHtml(req.params.id as string, req.user?.userId);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  })
);

export default router;
