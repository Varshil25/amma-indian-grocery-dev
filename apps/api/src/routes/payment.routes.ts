import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { paymentController } from "../controllers/payment.controller.js";

const router = Router();

// Stripe webhook — must come before JSON body parser (needs raw body)
router.post("/webhook", paymentController.handleWebhook);

// Authenticated routes
router.post("/create-intent", authenticate, paymentController.createPaymentIntent);
router.post("/confirm", authenticate, paymentController.confirmPayment);

export default router;
