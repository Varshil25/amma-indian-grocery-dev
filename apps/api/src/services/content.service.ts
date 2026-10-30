import prisma from "../config/database.js";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";
import { settingsService } from "./settings.service.js";
import { PHONE_HINT, normalizeUSPhone } from "../utils/phone.js";

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

  async submitContact(body: unknown) {
    const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
    // Non-string values (numbers, objects) are treated as empty rather than crashing
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const name = str(data.name);
    const email = str(data.email).toLowerCase();
    const subject = str(data.subject);
    const message = str(data.message);
    const rawPhone = str(data.phone);

    if (!name || !email || !message) {
      throw new BadRequestError("Name, email, and message are required");
    }
    if (name.length > 100) throw new BadRequestError("Name must be 100 characters or fewer");
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError("Please enter a valid email address");
    }
    if (subject.length > 150) throw new BadRequestError("Subject must be 150 characters or fewer");
    if (message.length > 5000) throw new BadRequestError("Message must be 5000 characters or fewer");

    // Optional; stored as +1XXXXXXXXXX like account phones so the admin can show and dial it
    let phone: string | null = null;
    if (rawPhone) {
      phone = normalizeUSPhone(rawPhone);
      if (!phone) throw new BadRequestError(PHONE_HINT);
    }

    return prisma.contactMessage.create({
      data: { name, email, phone, subject: subject || null, message },
    });
  }

  getStoreSettings() {
    return settingsService.getPublic();
  }
}

export const contentService = new ContentService();
