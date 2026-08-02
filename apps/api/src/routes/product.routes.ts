import { Router } from "express";
import { productController } from "../controllers/product.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { reviewSchema } from "../validators/product.validator.js";

const router = Router();

// Public routes
router.get("/", (req, res, next) => {
  productController.list(req, res).catch(next);
});

router.get("/search", (req, res, next) => {
  productController.search(req, res).catch(next);
});

router.get("/featured", (req, res, next) => {
  productController.getFeatured(req, res).catch(next);
});

router.get("/best-sellers", (req, res, next) => {
  productController.getBestSellers(req, res).catch(next);
});

router.get("/:slug", (req, res, next) => {
  productController.getBySlug(req, res).catch(next);
});

router.get("/:id/reviews", (req, res, next) => {
  productController.getReviews(req, res).catch(next);
});

// Authenticated routes
router.post("/:id/reviews", authenticate, validate(reviewSchema), (req, res, next) => {
  productController.createReview(req, res).catch(next);
});

export default router;
