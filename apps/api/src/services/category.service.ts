import prisma from "../config/database.js";
import { NotFoundError } from "../middleware/errorHandler.js";
import { getPagination, getPaginationMeta, getSkip } from "../utils/pagination.js";
import { Prisma } from "@prisma/client";

export class CategoryService {
  async getAll() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { products: { where: { isActive: true } } } },
          },
        },
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Return top-level categories (parentId is null) with nested children
    const tree = categories.filter((c) => !c.parentId);
    return tree;
  }

  async getFeatured() {
    return prisma.category.findMany({
      where: { isActive: true, isFeatured: true },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        icon: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async getBySlug(slug: string, query: { page?: string; limit?: string; sort?: string }) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, image: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!category || !category.isActive) {
      throw new NotFoundError("Category not found");
    }

    // Get products (including from subcategories)
    const subcategoryIds = category.children.map((c) => c.id);
    const categoryIds = [category.id, ...subcategoryIds];

    const { page, limit } = getPagination(query);
    const skip = getSkip(page, limit);

    const where: Prisma.ProductWhereInput = {
      categoryId: { in: categoryIds },
      isActive: true,
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    switch (query.sort) {
      case "price_asc": orderBy = { price: "asc" }; break;
      case "price_desc": orderBy = { price: "desc" }; break;
      case "name_asc": orderBy = { name: "asc" }; break;
      case "name_desc": orderBy = { name: "desc" }; break;
      case "rating": orderBy = { avgRating: "desc" }; break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          price: true,
          compareAtPrice: true,
          unit: true,
          avgRating: true,
          reviewCount: true,
          isOnSale: true,
          isFeatured: true,
          images: {
            where: { isPrimary: true },
            select: { url: true, altText: true },
            take: 1,
          },
          inventory: {
            select: { stockQuantity: true, reservedQuantity: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Get brands for filtering
    const brands = await prisma.product.findMany({
      where: { categoryId: { in: categoryIds }, isActive: true },
      select: { brand: true },
      distinct: ["brand"],
    });

    return {
      category,
      products,
      pagination: getPaginationMeta(page, limit, total),
      filters: {
        brands: brands.map((b) => b.brand).filter(Boolean),
        subcategories: category.children,
      },
    };
  }
}

export const categoryService = new CategoryService();
