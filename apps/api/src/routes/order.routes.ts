import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { orderController } from "../controllers/order.controller.js";
import { invoiceService } from "../services/invoice.service.js";
import {
  createOrderSchema,
  orderListQuerySchema,
  cancelOrderSchema,
} from "../validators/order.validator.js";

const router = Router();

// All order routes require authentication
router.use(authenticate);

router.post("/", validate(createOrderSchema), orderController.createOrder);
router.get("/", validate(orderListQuerySchema, "query"), orderController.getOrders);
router.get("/:id", orderController.getOrderById);
router.put("/:id/cancel", validate(cancelOrderSchema), orderController.cancelOrder);
router.get("/:id/track", orderController.trackOrder);
router.get("/:id/invoice", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const html = await invoiceService.generateInvoiceHtml(req.params.id as string, req.user?.userId);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    next(err);
  }
});

export default router;
