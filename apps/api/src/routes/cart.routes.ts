import { Router } from "express";
import { cartController } from "../controllers/cart.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { addCartItemSchema, updateCartItemSchema, applyCouponSchema } from "../validators/cart.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", (req, res, next) => {
  cartController.getCart(req, res).catch(next);
});

router.post("/items", validate(addCartItemSchema), (req, res, next) => {
  cartController.addItem(req, res).catch(next);
});

router.put("/items/:productId", validate(updateCartItemSchema), (req, res, next) => {
  cartController.updateItem(req, res).catch(next);
});

router.delete("/items/:productId", (req, res, next) => {
  cartController.removeItem(req, res).catch(next);
});

router.delete("/", (req, res, next) => {
  cartController.clearCart(req, res).catch(next);
});

router.post("/apply-coupon", validate(applyCouponSchema), (req, res, next) => {
  cartController.applyCoupon(req, res).catch(next);
});

export default router;
