import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), (req, res, next) => {
  authController.register(req, res).catch(next);
});

router.post("/login", validate(loginSchema), (req, res, next) => {
  authController.login(req, res).catch(next);
});

router.post("/refresh", validate(refreshSchema), (req, res, next) => {
  authController.refresh(req, res).catch(next);
});

router.post("/logout", validate(refreshSchema), (req, res, next) => {
  authController.logout(req, res).catch(next);
});

router.post("/forgot-password", validate(forgotPasswordSchema), (req, res, next) => {
  authController.forgotPassword(req, res).catch(next);
});

router.post("/reset-password", validate(resetPasswordSchema), (req, res, next) => {
  authController.resetPassword(req, res).catch(next);
});

router.get("/me", authenticate, (req, res, next) => {
  authController.getMe(req, res).catch(next);
});

export default router;
