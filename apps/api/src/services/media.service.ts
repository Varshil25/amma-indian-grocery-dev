import type { Request } from "express";
import prisma from "../config/database.js";
import { env } from "../config/env.js";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB after decoding

function publicBaseUrl(req: Request): string {
  if (env.API_PUBLIC_URL) return env.API_PUBLIC_URL.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

export class MediaService {
  /** Accepts a data URL ("data:image/png;base64,....") and returns its public URL. */
  async uploadDataUrl(req: Request, dataUrl: unknown) {
    if (typeof dataUrl !== "string") throw new BadRequestError("dataUrl is required");
    const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
    if (!match) throw new BadRequestError("dataUrl must be a base64 data URL");

    const mimeType = match[1].toLowerCase();
    if (!ALLOWED_TYPES.has(mimeType)) {
      throw new BadRequestError("Only JPEG, PNG, WebP or GIF images are allowed");
    }

    const data = Buffer.from(match[2], "base64");
    if (data.length === 0) throw new BadRequestError("Image is empty");
    if (data.length > MAX_BYTES) throw new BadRequestError("Image must be 5 MB or smaller");

    const file = await prisma.mediaFile.create({
      data: { mimeType, size: data.length, data },
      select: { id: true, mimeType: true, size: true },
    });

    return { ...file, url: `${publicBaseUrl(req)}/api/media/${file.id}` };
  }

  async get(id: string) {
    const file = await prisma.mediaFile.findUnique({ where: { id } });
    if (!file) throw new NotFoundError("Image not found");
    return file;
  }
}

export const mediaService = new MediaService();
