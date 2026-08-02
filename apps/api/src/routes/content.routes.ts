import { Router } from "express";
import { contentController } from "../controllers/content.controller.js";

const router = Router();

router.get("/banners", (req, res, next) => { contentController.getBanners(req, res, next); });
router.get("/store-settings", (req, res, next) => { contentController.getStoreSettings(req, res, next); });
router.get("/pages/:slug", (req, res, next) => { contentController.getPage(req, res, next); });
router.post("/contact", (req, res, next) => { contentController.submitContact(req, res, next); });

export default router;
