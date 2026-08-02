import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import productRoutes from "./product.routes.js";
import categoryRoutes from "./category.routes.js";
import cartRoutes from "./cart.routes.js";
import wishlistRoutes from "./wishlist.routes.js";
import orderRoutes from "./order.routes.js";
import paymentRoutes from "./payment.routes.js";
import rewardRoutes from "./reward.routes.js";
import adminRoutes from "./admin.routes.js";
import dealRoutes from "./deal.routes.js";
import contentRoutes from "./content.routes.js";
import posRoutes from "./pos.routes.js";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public & authenticated routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);

router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/rewards", rewardRoutes);
router.use("/admin", adminRoutes);
router.use("/deals", dealRoutes);
router.use("/content", contentRoutes);
router.use("/pos", posRoutes);

export default router;
