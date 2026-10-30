import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { mediaService } from "../services/media.service.js";

const router = Router();

// Public: serve an uploaded image. Ids are random and files never change, so cache hard.
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const file = await mediaService.get(req.params.id as string);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Length", String(file.size));
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(Buffer.from(file.data));
  })
);

export default router;
