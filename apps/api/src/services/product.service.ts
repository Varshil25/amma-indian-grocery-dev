import { Prisma } from "@prisma/client";
import prisma from "../config/database.js";
import { NotFoundError, ConflictError } from "../middleware/errorHandler.js";
import { getPagination, getPaginationMeta, getSkip } from "../utils/pagination.js";

interface ProductQuery {
  page?: string;
  limit?: string;
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  rating?: string;
  sort?: string;
  search?: string;
  inStock?: string;
  featured?: string;
  onSale?: string;
}

const productSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  sku: true,
  categoryId: true,
  brand: true,
  unit: true,
  unitValue: true,
  price: true,
  compareAtPrice: true,
  isActive: true,
  isFeatured: true,
  isOnSale: true,
  isPerishable: true,
  tags: true,
  avgRating: true,
  reviewCount: true,
  createdAt: true,
  images: {
    where: { isPrimary: true },
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

export class ProductService {
  async list(query: ProductQuery) {
    const { page, limit } = getPagination(query);
    const skip = getSkip(page, limit);

    const where: Prisma.ProductWhereInput = { isActive: true };

    // Category filter (by slug)
    if (query.category) {
      const category = await prisma.category.findUnique({
        where: { slug: query.category },
      });
      if (category) {
        // Include subcategories
        const subcategories = await prisma.category.findMany({
          where: { parentId: category.id, isActive: true },
          select: { id: true },
        });
        const categoryIds = [category.id, ...subcategories.map((c) => c.id)];
        where.categoryId = { in: categoryIds };
      }
    }

    if (query.brand) {
      where.brand = { equals: query.brand, mode: "insensitive" };
    }

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = new Prisma.Decimal(query.minPrice);
      if (query.maxPrice) where.price.lte = new Prisma.Decimal(query.maxPrice);
    }

    if (query.rating) {
      where.avgRating = { gte: new Prisma.Decimal(query.rating) };
    }

    if (query.inStock === "true") {
      where.inventory = { stockQuantity: { gt: 0 } };
    }

    if (query.featured === "true") {
      where.isFeatured = true;
    }

    if (query.onSale === "true") {
      where.isOnSale = true;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { brand: { contains: query.search, mode: "insensitive" } },
        { tags: { has: query.search.toLowerCase() } },
      ];
    }

    // Sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    switch (query.sort) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      case "name_desc":
        orderBy = { name: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "rating":
        orderBy = { avgRating: "desc" };
        break;
      case "best_selling":
        orderBy = { reviewCount: "desc" };
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: productSelect,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Get unique brands for filter sidebar
    const brands = await prisma.product.findMany({
      where: { isActive: true, ...(where.categoryId ? { categoryId: where.categoryId } : {}) },
      select: { brand: true },
      distinct: ["brand"],
    });

    return {
      products,
      pagination: getPaginationMeta(page, limit, total),
      filters: {
        brands: brands.map((b) => b.brand).filter(Boolean),
      },
    };
  }

  async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        category: { select: { id: true, name: true, slug: true } },
        inventory: { select: { stockQuantity: true, reservedQuantity: true } },
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundError("Product not found");
    }

    // Get related products from the same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      select: productSelect,
      take: 8,
      orderBy: { avgRating: "desc" },
    });

    return { product, relatedProducts };
  }

  async getFeatured(limit = 12) {
    return prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      select: productSelect,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  async getBestSellers(limit = 12) {
    return prisma.product.findMany({
      where: { isActive: true },
      select: productSelect,
      take: limit,
      orderBy: { reviewCount: "desc" },
    });
  }

  async search(q: string, limit = 10) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
          { tags: { has: q.toLowerCase() } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: {
          where: { isPrimary: true },
          select: { url: true },
          take: 1,
        },
        category: { select: { name: true, slug: true } },
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    return products;
  }

  // Reviews
  async getReviews(productId: string, query: { page?: string; limit?: string }) {
    const { page, limit } = getPagination(query);
    const skip = getSkip(page, limit);

    const where = { productId, isApproved: true };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Rating distribution
    const distribution = await prisma.review.groupBy({
      by: ["rating"],
      where: { productId, isApproved: true },
      _count: true,
    });

    return {
      reviews,
      pagination: getPaginationMeta(page, limit, total),
      ratingDistribution: distribution.map((d) => ({
        rating: d.rating,
        count: d._count,
      })),
    };
  }

  async createReview(userId: string, productId: string, data: {
    rating: number;
    title?: string;
    comment?: string;
  }) {
    // Check product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError("Product not found");

    // Check if user already reviewed
    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) throw new ConflictError("You have already reviewed this product");

    // Check if user has purchased this product (verified review)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: { in: ["DELIVERED"] } },
      },
    });

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        isVerified: !!hasPurchased,
        isApproved: true, // Auto-approve for now
      },
    });

    // Update product average rating
    const stats = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: stats._avg.rating || 0,
        reviewCount: stats._count,
      },
    });

    // Award review points
    const rewardAccount = await prisma.rewardAccount.findUnique({ where: { userId } });
    if (rewardAccount) {
      await prisma.rewardAccount.update({
        where: { userId },
        data: {
          totalPoints: { increment: 25 },
          availablePoints: { increment: 25 },
        },
      });
      await prisma.rewardTransaction.create({
        data: {
          rewardAccountId: rewardAccount.id,
          type: "EARN_REVIEW",
          points: 25,
          description: `Review bonus for ${product.name}`,
        },
      });
    }

    return review;
  }
}

export const productService = new ProductService();
