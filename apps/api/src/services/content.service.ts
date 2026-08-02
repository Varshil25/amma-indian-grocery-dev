import prisma from "../config/database.js";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";

export class ContentService {
  async getActiveBanners() {
    const now = new Date();
    return prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async getPageBySlug(slug: string) {
    const page = await prisma.staticPage.findUnique({ where: { slug } });
    if (!page) throw new NotFoundError("Page not found");
    return page;
  }

  async submitContact(data: { name: string; email: string; phone?: string; subject?: string; message: string }) {
    if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
      throw new BadRequestError("Name, email, and message are required");
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

  async getStoreSettings() {
    const settings = await prisma.storeSetting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }
}

export const contentService = new ContentService();
