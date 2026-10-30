import prisma from "../config/database.js";
import { ConflictError, NotFoundError } from "../middleware/errorHandler.js";

const wishlistProductSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  unit: true,
  unitValue: true,
  isActive: true,
  avgRating: true,
  reviewCount: true,
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    select: { url: true, altText: true },
    take: 1,
  },
  category: {
    select: { id: true, name: true, slug: true },
  },
  inventory: {
    select: { stockQuantity: true, reservedQuantity: true },
  },
};

export class WishlistService {
  async getWishlist(userId: string) {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { select: wishlistProductSelect } },
      orderBy: { createdAt: "desc" },
    });

    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      product: item.product,
    }));
  }

  async addToWishlist(userId: string, productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      throw new NotFoundError("Product not found");
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      throw new ConflictError("Product already in wishlist");
    }

    await prisma.wishlistItem.create({ data: { userId, productId } });
    return { message: "Added to wishlist" };
  }

  async removeFromWishlist(userId: string, productId: string) {
    const item = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!item) {
      throw new NotFoundError("Product not in wishlist");
    }

    await prisma.wishlistItem.delete({ where: { id: item.id } });
    return { message: "Removed from wishlist" };
  }

  async isInWishlist(userId: string, productIds: string[]) {
    const items = await prisma.wishlistItem.findMany({
      where: { userId, productId: { in: productIds } },
      select: { productId: true },
    });
    return items.map((i) => i.productId);
  }
}

export const wishlistService = new WishlistService();
