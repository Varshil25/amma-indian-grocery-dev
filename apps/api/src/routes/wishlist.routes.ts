import { Router } from "express";
import { wishlistController } from "../controllers/wishlist.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", (req, res, next) => {
  wishlistController.getWishlist(req, res).catch(next);
});

router.post("/:productId", (req, res, next) => {
  wishlistController.addToWishlist(req, res).catch(next);
});

router.delete("/:productId", (req, res, next) => {
  wishlistController.removeFromWishlist(req, res).catch(next);
});

export default router;
