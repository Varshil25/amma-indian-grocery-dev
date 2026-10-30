import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { paymentController } from "../controllers/payment.controller.js";

const router = Router();

// Stripe webhook — signature is checked against the raw body captured in app.ts
router.post("/webhook", asyncHandler(paymentController.handleWebhook));

// Authenticated routes
router.post("/create-intent", authenticate, asyncHandler(paymentController.createPaymentIntent));
router.post("/confirm", authenticate, asyncHandler(paymentController.confirmPayment));

export default router;
