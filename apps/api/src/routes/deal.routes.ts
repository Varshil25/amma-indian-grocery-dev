import { Router } from "express";
import { dealController } from "../controllers/deal.controller.js";

const router = Router();

router.get("/", dealController.getActiveDeals);
router.get("/:slug", dealController.getDealBySlug);

export default router;
