import prisma from "../config/database.js";
import { NotFoundError } from "../middleware/errorHandler.js";

export class DealService {
  async getActiveDeals() {
    const now = new Date();
    const deals = await prisma.deal.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        products: {
          where: { product: { isActive: true } },
          include: {
            product: {
              select: {
                id: true, name: true, slug: true, price: true, compareAtPrice: true, isActive: true,
                images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
              },
            },
          },
          take: 6,
        },
        _count: { select: { products: true } },
      },
      orderBy: { endDate: "asc" },
    });

    return deals.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      description: d.description,
      bannerImage: d.bannerImage,
      discountType: d.discountType === "FIXED" ? "FIXED_AMOUNT" : d.discountType,
      discountValue: Number(d.discountValue),
      startDate: d.startDate,
      endDate: d.endDate,
      productCount: d._count.products,
      previewProducts: d.products.map((dp) => ({
        id: dp.product.id,
        name: dp.product.name,
        slug: dp.product.slug,
        price: Number(dp.product.price),
        compareAtPrice: dp.product.compareAtPrice ? Number(dp.product.compareAtPrice) : null,
        image: dp.product.images[0]?.url || null,
      })),
    }));
  }

  async getDealBySlug(slug: string) {
    const now = new Date();
    const deal = await prisma.deal.findFirst({
      where: { slug, isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      include: {
        products: {
          where: { product: { isActive: true } },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
                category: { select: { name: true } },
                inventory: { select: { stockQuantity: true, reservedQuantity: true } },
              },
            },
          },
        },
      },
    });

    if (!deal) throw new NotFoundError("Deal not found");

    return {
      id: deal.id,
      name: deal.name,
      slug: deal.slug,
      description: deal.description,
      discountType: deal.discountType === "FIXED" ? "FIXED_AMOUNT" : deal.discountType,
      discountValue: Number(deal.discountValue),
      startDate: deal.startDate,
      endDate: deal.endDate,
      products: deal.products.map((dp) => ({
        id: dp.product.id,
        name: dp.product.name,
        slug: dp.product.slug,
        price: Number(dp.product.price),
        compareAtPrice: dp.product.compareAtPrice ? Number(dp.product.compareAtPrice) : null,
        image: dp.product.images[0]?.url || null,
        category: dp.product.category?.name || null,
        inStock: dp.product.inventory
          ? dp.product.inventory.stockQuantity - dp.product.inventory.reservedQuantity > 0
          : false,
      })),
    };
  }
}

export const dealService = new DealService();
