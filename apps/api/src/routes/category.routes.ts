import { Router } from "express";
import { categoryController } from "../controllers/category.controller.js";

const router = Router();

router.get("/", (req, res, next) => {
  categoryController.getAll(req, res).catch(next);
});

router.get("/featured", (req, res, next) => {
  categoryController.getFeatured(req, res).catch(next);
});

router.get("/:slug", (req, res, next) => {
  categoryController.getBySlug(req, res).catch(next);
});

export default router;
