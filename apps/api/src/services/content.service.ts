import prisma from "../config/database.js";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";
import { settingsService } from "./settings.service.js";

export class ContentService {
  async getActiveBanners(position?: string) {
    const now = new Date();
    return prisma.banner.findMany({
      where: {
        isActive: true,
        ...(position ? { position } : {}),
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async getPageBySlug(slug: string) {
    const page = await prisma.staticPage.findUnique({ where: { slug } });
    if (!page || !page.isActive) throw new NotFoundError("Page not found");
    return page;
  }

  async submitContact(data: { name: string; email: string; phone?: string; subject?: string; message: string }) {
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    if (!str(data.name).trim() || !str(data.email).trim() || !str(data.message).trim()) {
      throw new BadRequestError("Name, email, and message are required");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(data.email).trim())) {
      throw new BadRequestError("Please enter a valid email address");
    }
    if (str(data.message).length > 5000 || str(data.name).length > 100) {
      throw new BadRequestError("Message is too long");
    }
    return prisma.contactMessage.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        subject: data.subject?.trim() || null,
        message: data.message.trim(),
      },
    });
  }

  getStoreSettings() {
    return settingsService.getPublic();
  }
}

export const contentService = new ContentService();
