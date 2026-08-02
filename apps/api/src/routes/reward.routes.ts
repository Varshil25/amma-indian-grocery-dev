import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { rewardController } from "../controllers/reward.controller.js";

const router = Router();

// All reward routes require authentication
router.use(authenticate);

router.get("/", rewardController.getAccount);
router.get("/history", rewardController.getHistory);
router.get("/tiers", rewardController.getTiers);
router.get("/referral", rewardController.getReferralInfo);
router.post("/apply-referral", rewardController.applyReferral);

export default router;
