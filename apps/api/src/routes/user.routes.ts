import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema, addressSchema } from "../validators/user.validator.js";
import { changePasswordSchema } from "../validators/auth.validator.js";

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get("/profile", (req, res, next) => {
  userController.getProfile(req, res).catch(next);
});

router.put("/profile", validate(updateProfileSchema), (req, res, next) => {
  userController.updateProfile(req, res).catch(next);
});

router.put("/change-password", validate(changePasswordSchema), (req, res, next) => {
  userController.changePassword(req, res).catch(next);
});

router.get("/addresses", (req, res, next) => {
  userController.getAddresses(req, res).catch(next);
});

router.post("/addresses", validate(addressSchema), (req, res, next) => {
  userController.addAddress(req, res).catch(next);
});

router.put("/addresses/:id", validate(addressSchema), (req, res, next) => {
  userController.updateAddress(req, res).catch(next);
});

router.delete("/addresses/:id", (req, res, next) => {
  userController.deleteAddress(req, res).catch(next);
});

export default router;
