import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { authenticate } from "../middleware/auth.js";
import { rewardController } from "../controllers/reward.controller.js";

const router = Router();

// All reward routes require authentication
router.use(authenticate);

router.get("/", asyncHandler(rewardController.getAccount));
router.get("/history", asyncHandler(rewardController.getHistory));
router.get("/tiers", asyncHandler(rewardController.getTiers));
router.get("/referral", asyncHandler(rewardController.getReferralInfo));
router.post("/apply-referral", asyncHandler(rewardController.applyReferral));

export default router;
