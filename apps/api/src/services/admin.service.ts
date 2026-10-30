import { OrderStatus, Prisma } from "@prisma/client";
import prisma from "../config/database.js";
import { NotFoundError, BadRequestError, ConflictError } from "../middleware/errorHandler.js";
import { posService } from "./pos.service.js";
import { syncDealPricing } from "./deal-pricing.service.js";
import { orderService } from "./order.service.js";
import { settingsService, ALLOWED_SETTING_KEYS } from "./settings.service.js";
import { parseDateInput, parseRange } from "../utils/dates.js";

const REVENUE_EXCLUDED: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.REFUNDED];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const num = (d: Prisma.Decimal | number | null | undefined) => (d === null || d === undefined ? null : Number(d));

type ProductInput = {
  name?: string;
  slug?: string;
  sku?: string;
  description?: string | null;
  shortDescription?: string | null;
  categoryId?: string;
  brand?: string | null;
  unit?: string;
  unitValue?: number | null;
  price?: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  barcode?: string | null;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  isPerishable?: boolean;
  isTaxable?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  images?: { url: string; altText?: string | null }[];
  lowStockThreshold?: number;
  initialStock?: number;
};

export class AdminService {
  // ─── DASHBOARD ───

  async getDashboardStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const chartStart = new Date(startOfToday.getTime() - 13 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      todayOrders,
      monthOrders,
      lastMonthOrders,
      pendingOrders,
      lowStockRows,
      recentOrders,
      monthRevenue,
      lastMonthRevenue,
      chartOrders,
      unreadMessages,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
      prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
      // stock − reserved at or below each product's own threshold (active products only)
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM "Inventory" i
        JOIN "Product" p ON p.id = i."productId"
        WHERE p."isActive" = true AND i."stockQuantity" - i."reservedQuantity" <= i."lowStockThreshold"`,
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfMonth }, status: { notIn: REVENUE_EXCLUDED } },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth }, status: { notIn: REVENUE_EXCLUDED } },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: chartStart } },
        select: { createdAt: true, totalAmount: true, status: true },
      }),
      prisma.contactMessage.count({ where: { isRead: false } }),
    ]);

    const currentRevenue = Number(monthRevenue._sum.totalAmount || 0);
    const previousRevenue = Number(lastMonthRevenue._sum.totalAmount || 0);
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const orderChange = lastMonthOrders > 0 ? ((monthOrders - lastMonthOrders) / lastMonthOrders) * 100 : 0;

    // Last 14 days, one point per day (server-local dates)
    const daily: { date: string; orders: number; revenue: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(chartStart.getTime() + i * 24 * 60 * 60 * 1000);
      daily.push({ date: d.toISOString().slice(0, 10), orders: 0, revenue: 0 });
    }
    for (const o of chartOrders) {
      const local = new Date(o.createdAt.getFullYear(), o.createdAt.getMonth(), o.createdAt.getDate());
      const idx = Math.round((local.getTime() - chartStart.getTime()) / (24 * 60 * 60 * 1000));
      if (idx >= 0 && idx < daily.length) {
        daily[idx].orders++;
        if (!REVENUE_EXCLUDED.includes(o.status)) daily[idx].revenue += Number(o.totalAmount);
      }
    }
    daily.forEach((d) => (d.revenue = Math.round(d.revenue * 100) / 100));

    return {
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers,
        pendingOrders,
        lowStockProducts: Number(lowStockRows[0]?.count ?? 0),
        monthRevenue: currentRevenue,
        revenueChange: parseFloat(revenueChange.toFixed(1)),
        todayOrders,
        monthOrders,
        orderChange: parseFloat(orderChange.toFixed(1)),
        unreadMessages,
      },
      daily,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        customerName: `${o.user.firstName} ${o.user.lastName}`,
        customerEmail: o.user.email,
        createdAt: o.createdAt,
      })),
    };
  }

  // ─── PRODUCTS ───

  async getProducts(page: number, limit: number, search?: string, status?: string) {
    const where: Prisma.ProductWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true } },
          images: { take: 1, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], select: { url: true } },
          inventory: { select: { stockQuantity: true, reservedQuantity: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: Number(p.price),
        compareAtPrice: num(p.compareAtPrice),
        regularPrice: num(p.basePrice) ?? Number(p.price),
        inDeal: p.basePrice !== null,
        category: p.category?.name || "Uncategorized",
        categoryId: p.categoryId,
        image: p.images[0]?.url || null,
        stock: p.inventory ? p.inventory.stockQuantity - p.inventory.reservedQuantity : null,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        isOnSale: p.isOnSale,
        createdAt: p.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProduct(productId: string) {
    const p = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        inventory: true,
        dealProducts: { select: { deal: { select: { id: true, name: true, isActive: true, endDate: true } } } },
      },
    });
    if (!p) throw new NotFoundError("Product not found");
    const inDeal = p.basePrice !== null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      barcode: p.barcode,
      description: p.description,
      shortDescription: p.shortDescription,
      categoryId: p.categoryId,
      category: p.category,
      brand: p.brand,
      unit: p.unit,
      unitValue: num(p.unitValue),
      // The admin edits the regular price; while a deal runs the live price is the deal's
      price: inDeal ? Number(p.basePrice) : Number(p.price),
      compareAtPrice: inDeal ? num(p.baseCompareAtPrice) : num(p.compareAtPrice),
      livePrice: Number(p.price),
      inDeal,
      deals: p.dealProducts.map((d) => d.deal),
      costPrice: num(p.costPrice),
      tags: p.tags,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      isOnSale: inDeal ? false : p.isOnSale,
      isPerishable: p.isPerishable,
      isTaxable: p.isTaxable,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      images: p.images.map((i) => ({ id: i.id, url: i.url, altText: i.altText, isPrimary: i.isPrimary })),
      inventory: p.inventory
        ? {
            stockQuantity: p.inventory.stockQuantity,
            reservedQuantity: p.inventory.reservedQuantity,
            lowStockThreshold: p.inventory.lowStockThreshold,
          }
        : null,
      squareLinked: !!p.squareCatalogId,
    };
  }

  private async assertCategory(categoryId: string) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) throw new BadRequestError("The selected category doesn't exist");
  }

  private imagesCreate(images: { url: string; altText?: string | null }[], name: string) {
    return images.map((img, i) => ({
      url: img.url,
      altText: img.altText || name,
      sortOrder: i,
      isPrimary: i === 0,
    }));
  }

  async createProduct(data: ProductInput & { name: string; sku: string; categoryId: string; price: number }, adminId?: string) {
    const slug = data.slug || slugify(data.name);
    if (!slug) throw new BadRequestError("Product name must contain letters or numbers");

    const existing = await prisma.product.findFirst({
      where: { OR: [{ slug }, { sku: data.sku }, ...(data.barcode ? [{ barcode: data.barcode }] : [])] },
      select: { slug: true, sku: true, barcode: true },
    });
    if (existing) {
      if (existing.sku === data.sku) throw new ConflictError(`SKU "${data.sku}" is already used by another product`);
      if (existing.slug === slug) throw new ConflictError(`URL slug "${slug}" is already used by another product`);
      throw new ConflictError("Barcode is already used by another product");
    }
    await this.assertCategory(data.categoryId);

    const { images = [], initialStock = 0, lowStockThreshold = 10, ...fields } = data;

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...fields,
          slug,
          tags: (fields.tags || []).map((t) => t.toLowerCase()),
          images: { create: this.imagesCreate(images, data.name) },
          inventory: {
            create: {
              stockQuantity: initialStock,
              reservedQuantity: 0,
              lowStockThreshold,
              reorderPoint: Math.min(5, lowStockThreshold),
              lastRestockedAt: initialStock > 0 ? new Date() : null,
            },
          },
        },
        include: { inventory: true },
      });
      if (initialStock > 0 && created.inventory) {
        await tx.inventoryAdjustment.create({
          data: {
            inventoryId: created.inventory.id,
            type: "RESTOCK",
            quantity: initialStock,
            previousQty: 0,
            newQty: initialStock,
            reason: "Opening stock",
            adjustedBy: adminId,
          },
        });
      }
      return created;
    });

    return this.getProduct(product.id);
  }

  async updateProduct(productId: string, data: ProductInput) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError("Product not found");

    if (data.categoryId) await this.assertCategory(data.categoryId);
    if (data.slug && data.slug !== product.slug) {
      const clash = await prisma.product.findUnique({ where: { slug: data.slug } });
      if (clash) throw new ConflictError(`URL slug "${data.slug}" is already used by another product`);
    }
    if (data.sku && data.sku !== product.sku) {
      const clash = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (clash) throw new ConflictError(`SKU "${data.sku}" is already used by another product`);
    }

    const { images, lowStockThreshold, initialStock: _ignored, price, compareAtPrice, ...fields } = data;
    const inDeal = product.basePrice !== null;

    const priceFields: Prisma.ProductUncheckedUpdateInput = {};
    if (inDeal) {
      // A deal is running: the form edits the regular price, which is parked in basePrice.
      if (price !== undefined) priceFields.basePrice = price;
      if (compareAtPrice !== undefined) priceFields.baseCompareAtPrice = compareAtPrice;
      delete fields.isOnSale; // the deal controls the sale flag while it runs
    } else {
      if (price !== undefined) priceFields.price = price;
      if (compareAtPrice !== undefined) priceFields.compareAtPrice = compareAtPrice;
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          ...fields,
          ...priceFields,
          ...(fields.tags ? { tags: fields.tags.map((t) => t.toLowerCase()) } : {}),
        },
      });
      if (images) {
        await tx.productImage.deleteMany({ where: { productId } });
        if (images.length) {
          await tx.productImage.createMany({
            data: this.imagesCreate(images, data.name || product.name).map((i) => ({ ...i, productId })),
          });
        }
      }
      if (lowStockThreshold !== undefined) {
        await tx.inventory.upsert({
          where: { productId },
          update: { lowStockThreshold },
          create: { productId, lowStockThreshold },
        });
      }
    });

    if (inDeal && (price !== undefined || compareAtPrice !== undefined)) {
      await syncDealPricing([productId]); // recompute the deal price from the new regular price
    } else if (price !== undefined && product.squareCatalogId) {
      posService.pushPriceToSquare(productId).catch((err) => console.error("Auto-push price to Square failed:", err));
    }

    return this.getProduct(productId);
  }

  async deleteProduct(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError("Product not found");
    // Soft delete: orders keep referencing the product
    await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
    return { message: "Product deactivated" };
  }

  // ─── CATEGORIES ───

  async getCategories() {
    const cats = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
        children: { include: { _count: { select: { products: true } } }, orderBy: { sortOrder: "asc" } },
      },
      where: { parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return cats;
  }

  async createCategory(data: {
    name: string;
    slug?: string;
    description?: string | null;
    image?: string | null;
    parentId?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    isFeatured?: boolean;
  }) {
    const slug = data.slug || slugify(data.name);
    if (!slug) throw new BadRequestError("Category name must contain letters or numbers");
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictError(`A category with the URL "${slug}" already exists`);
    if (data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new BadRequestError("Parent category not found");
      if (parent.parentId) throw new BadRequestError("Subcategories can only be one level deep");
    }
    return prisma.category.create({ data: { ...data, slug } });
  }

  async updateCategory(categoryId: string, data: Record<string, unknown> & { slug?: string; parentId?: string | null }) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId }, include: { children: true } });
    if (!cat) throw new NotFoundError("Category not found");
    if (data.slug && data.slug !== cat.slug) {
      const clash = await prisma.category.findUnique({ where: { slug: data.slug } });
      if (clash) throw new ConflictError(`A category with the URL "${data.slug}" already exists`);
    }
    if (data.parentId) {
      if (data.parentId === categoryId) throw new BadRequestError("A category can't be its own parent");
      if (cat.children.length) throw new BadRequestError("A category with subcategories can't become a subcategory");
      const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new BadRequestError("Parent category not found");
      if (parent.parentId) throw new BadRequestError("Subcategories can only be one level deep");
    }
    return prisma.category.update({ where: { id: categoryId }, data });
  }

  async deleteCategory(categoryId: string) {
    const cat = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!cat) throw new NotFoundError("Category not found");
    if (cat._count.products > 0) {
      throw new BadRequestError(
        `This category has ${cat._count.products} product(s). Move them to another category or hide the category instead.`
      );
    }
    if (cat._count.children > 0) throw new BadRequestError("Delete or move its subcategories first");
    await prisma.category.delete({ where: { id: categoryId } });
    return { message: "Category deleted" };
  }

  // ─── ORDERS ───

  async getOrders(page: number, limit: number, status?: string, search?: string) {
    const where: Prisma.OrderWhereInput = {};
    if (status) {
      if (!(Object.values(OrderStatus) as string[]).includes(status)) throw new BadRequestError("Unknown order status");
      where.status = status as OrderStatus;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { select: { quantity: true } },
          payment: { select: { status: true, method: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        fulfillmentType: o.fulfillmentType,
        totalAmount: Number(o.totalAmount),
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        customerName: `${o.user.firstName} ${o.user.lastName}`,
        customerEmail: o.user.email,
        payment: o.payment,
        createdAt: o.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  getOrder(orderId: string) {
    return orderService.getOrderById(null, orderId);
  }

  updateOrderStatus(orderId: string, status: OrderStatus, note?: string, changedBy?: string) {
    return orderService.updateStatus(orderId, status, note, changedBy);
  }

  markOrderPaid(orderId: string, changedBy?: string, note?: string) {
    return orderService.markPaid(orderId, changedBy, note);
  }

  // ─── CUSTOMERS ───

  async getCustomers(page: number, limit: number, search?: string) {
    const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      customers: customers.map((c) => ({
        id: c.id,
        email: c.email,
        name: `${c.firstName} ${c.lastName}`,
        phone: c.phone,
        isActive: c.isActive,
        orderCount: c._count.orders,
        createdAt: c.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCustomer(customerId: string) {
    const c = await prisma.user.findFirst({
      where: { id: customerId, role: "CUSTOMER" },
      include: {
        addresses: { orderBy: { isDefault: "desc" } },
        rewardAccount: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
        },
      },
    });
    if (!c) throw new NotFoundError("Customer not found");
    const spent = await prisma.order.aggregate({
      where: { userId: customerId, status: { notIn: REVENUE_EXCLUDED } },
      _sum: { totalAmount: true },
    });
    return {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
      phone: c.phone,
      isActive: c.isActive,
      createdAt: c.createdAt,
      lastLoginAt: c.lastLoginAt,
      totalSpent: Number(spent._sum.totalAmount || 0),
      rewards: c.rewardAccount
        ? { tier: c.rewardAccount.tier, availablePoints: c.rewardAccount.availablePoints }
        : null,
      addresses: c.addresses,
      orders: c.orders.map((o) => ({ ...o, totalAmount: Number(o.totalAmount) })),
    };
  }

  async updateCustomer(customerId: string, data: { isActive: boolean }) {
    const c = await prisma.user.findFirst({ where: { id: customerId, role: "CUSTOMER" } });
    if (!c) throw new NotFoundError("Customer not found");
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: customerId }, data: { isActive: data.isActive } });
      if (!data.isActive) {
        // Sign them out everywhere
        await tx.refreshToken.updateMany({ where: { userId: customerId, revokedAt: null }, data: { revokedAt: new Date() } });
      }
    });
    return { message: data.isActive ? "Customer unblocked" : "Customer blocked" };
  }

  // ─── INVENTORY ───

  async getInventory(page: number, limit: number, filter?: string, search?: string) {
    const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];
    if (filter === "low-stock") {
      conditions.push(Prisma.sql`i."stockQuantity" - i."reservedQuantity" > 0 AND i."stockQuantity" - i."reservedQuantity" <= i."lowStockThreshold"`);
    } else if (filter === "out-of-stock") {
      conditions.push(Prisma.sql`i."stockQuantity" - i."reservedQuantity" <= 0`);
    }
    if (search) {
      const like = `%${search}%`;
      conditions.push(Prisma.sql`(p.name ILIKE ${like} OR p.sku ILIKE ${like})`);
    }
    const where = Prisma.join(conditions, " AND ");

    const [rows, countRows] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>`
        SELECT i.id FROM "Inventory" i JOIN "Product" p ON p.id = i."productId"
        WHERE ${where}
        ORDER BY i."stockQuantity" - i."reservedQuantity" ASC, p.name ASC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM "Inventory" i JOIN "Product" p ON p.id = i."productId" WHERE ${where}`,
    ]);
    const total = Number(countRows[0]?.count ?? 0);

    const items = await prisma.inventory.findMany({
      where: { id: { in: rows.map((r) => r.id) } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            isActive: true,
            images: { take: 1, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], select: { url: true } },
          },
        },
      },
    });
    const order = new Map(rows.map((r, i) => [r.id, i]));
    items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    return {
      items: items.map((i) => ({
        id: i.id,
        productId: i.product.id,
        productName: i.product.name,
        sku: i.product.sku,
        image: i.product.images[0]?.url || null,
        isActive: i.product.isActive,
        stockQuantity: i.stockQuantity,
        reservedQuantity: i.reservedQuantity,
        available: i.stockQuantity - i.reservedQuantity,
        lowStockThreshold: i.lowStockThreshold,
        reorderPoint: i.reorderPoint,
        lastRestockedAt: i.lastRestockedAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async adjustInventory(
    productId: string,
    data: { quantity: number; type: string; reason?: string },
    adjustedBy?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({ where: { productId } });
      if (!inventory) throw new NotFoundError("Inventory record not found");

      const previousQty = inventory.stockQuantity;
      const newQty = previousQty + data.quantity;
      if (newQty < 0) {
        throw new BadRequestError(`Can't remove ${Math.abs(data.quantity)} — only ${previousQty} in stock`);
      }
      if (newQty < inventory.reservedQuantity) {
        throw new BadRequestError(
          `${inventory.reservedQuantity} unit(s) are reserved by open orders, so stock can't go below that`
        );
      }

      await tx.inventory.update({
        where: { productId },
        data: {
          stockQuantity: newQty,
          ...(data.type === "RESTOCK" && data.quantity > 0 ? { lastRestockedAt: new Date() } : {}),
        },
      });
      await tx.inventoryAdjustment.create({
        data: {
          inventoryId: inventory.id,
          type: data.type as never,
          quantity: data.quantity,
          previousQty,
          newQty,
          reason: data.reason,
          adjustedBy,
        },
      });
      return { message: "Inventory adjusted", previousQty, newQty };
    });
  }

  async updateInventorySettings(productId: string, data: { lowStockThreshold: number }) {
    const inv = await prisma.inventory.findUnique({ where: { productId } });
    if (!inv) throw new NotFoundError("Inventory record not found");
    await prisma.inventory.update({ where: { productId }, data: { lowStockThreshold: data.lowStockThreshold } });
    return { message: "Saved" };
  }

  async getInventoryHistory(productId: string) {
    const inv = await prisma.inventory.findUnique({ where: { productId } });
    if (!inv) throw new NotFoundError("Inventory record not found");
    return prisma.inventoryAdjustment.findMany({
      where: { inventoryId: inv.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async getExpiringBatches(days: number = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return prisma.inventoryBatch.findMany({
      where: { expiryDate: { lte: cutoff }, remainingQty: { gt: 0 } },
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { expiryDate: "asc" },
      take: 50,
    });
  }

  // ─── COUPONS ───

  async getCoupons(page: number, limit: number) {
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.coupon.count(),
    ]);
    return {
      coupons: coupons.map((c) => ({
        ...c,
        discountValue: Number(c.discountValue),
        minimumOrder: num(c.minimumOrder),
        maximumDiscount: num(c.maximumDiscount),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createCoupon(data: {
    code: string;
    description?: string | null;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
    discountValue: number;
    minimumOrder?: number | null;
    maximumDiscount?: number | null;
    usageLimit?: number | null;
    perUserLimit?: number;
    startDate: string;
    endDate: string;
    isActive?: boolean;
  }) {
    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictError(`Coupon code ${data.code} already exists`);
    const startDate = parseDateInput(data.startDate, "start", "Start date");
    const endDate = parseDateInput(data.endDate, "end", "End date");
    if (endDate <= startDate) throw new BadRequestError("End date must be after the start date");

    return prisma.coupon.create({
      data: {
        code: data.code,
        description: data.description || null,
        discountType: data.discountType,
        discountValue: data.discountType === "FREE_SHIPPING" ? 0 : data.discountValue,
        minimumOrder: data.minimumOrder ?? null,
        maximumDiscount: data.maximumDiscount ?? null,
        usageLimit: data.usageLimit ?? null,
        perUserLimit: data.perUserLimit ?? 1,
        startDate,
        endDate,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateCoupon(couponId: string, data: Record<string, unknown>) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundError("Coupon not found");
    const update: Record<string, unknown> = { ...data };
    if (data.code && data.code !== coupon.code) {
      const clash = await prisma.coupon.findUnique({ where: { code: data.code as string } });
      if (clash) throw new ConflictError(`Coupon code ${data.code} already exists`);
    }
    if (data.startDate) update.startDate = parseDateInput(data.startDate, "start", "Start date");
    if (data.endDate) update.endDate = parseDateInput(data.endDate, "end", "End date");
    const start = (update.startDate as Date) || coupon.startDate;
    const end = (update.endDate as Date) || coupon.endDate;
    if (end <= start) throw new BadRequestError("End date must be after the start date");
    return prisma.coupon.update({ where: { id: couponId }, data: update });
  }

  async deleteCoupon(couponId: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId }, include: { _count: { select: { orders: true } } } });
    if (!coupon) throw new NotFoundError("Coupon not found");
    if (coupon._count.orders > 0) {
      // Orders reference it — keep the record for history and switch it off instead
      await prisma.coupon.update({ where: { id: couponId }, data: { isActive: false } });
      return { message: `Coupon was used on ${coupon._count.orders} order(s), so it was deactivated instead of deleted` };
    }
    await prisma.coupon.delete({ where: { id: couponId } });
    return { message: "Coupon deleted" };
  }

  // ─── DEALS ───

  async getDeals(page: number, limit: number) {
    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        include: { _count: { select: { products: true } }, products: { select: { productId: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deal.count(),
    ]);
    return {
      deals: deals.map(({ products, _count, ...d }) => ({
        ...d,
        discountType: d.discountType === "FIXED" ? "FIXED_AMOUNT" : d.discountType,
        discountValue: Number(d.discountValue),
        productCount: _count.products,
        productIds: products.map((p) => p.productId),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async assertProductsExist(productIds: string[]) {
    if (!productIds.length) return;
    const found = await prisma.product.count({ where: { id: { in: productIds } } });
    if (found !== new Set(productIds).size) throw new BadRequestError("One or more selected products no longer exist");
  }

  async createDeal(data: {
    name: string;
    slug?: string;
    description?: string | null;
    bannerImage?: string | null;
    discountType: string;
    discountValue: number;
    startDate: string;
    endDate: string;
    isActive?: boolean;
    productIds?: string[];
  }) {
    const { productIds = [], ...rest } = data;
    const slug = rest.slug || slugify(rest.name);
    const startDate = parseDateInput(rest.startDate, "start", "Start date");
    const endDate = parseDateInput(rest.endDate, "end", "End date");
    if (endDate <= startDate) throw new BadRequestError("End date must be after the start date");
    if (await prisma.deal.findUnique({ where: { slug } })) {
      throw new ConflictError(`A deal with the URL "${slug}" already exists`);
    }
    const uniqueIds = [...new Set(productIds)];
    await this.assertProductsExist(uniqueIds);

    const deal = await prisma.deal.create({
      data: {
        ...rest,
        slug,
        startDate,
        endDate,
        discountValue: rest.discountType === "FREE_SHIPPING" ? 0 : rest.discountValue,
        products: { create: uniqueIds.map((productId) => ({ productId })) },
      },
    });
    await syncDealPricing(uniqueIds);
    return deal;
  }

  async updateDeal(dealId: string, data: Record<string, unknown> & { productIds?: string[]; slug?: string }) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId }, include: { products: { select: { productId: true } } } });
    if (!deal) throw new NotFoundError("Deal not found");

    const { productIds, ...rest } = data;
    const update: Record<string, unknown> = { ...rest };
    if (rest.startDate) update.startDate = parseDateInput(rest.startDate, "start", "Start date");
    if (rest.endDate) update.endDate = parseDateInput(rest.endDate, "end", "End date");
    const start = (update.startDate as Date) || deal.startDate;
    const end = (update.endDate as Date) || deal.endDate;
    if (end <= start) throw new BadRequestError("End date must be after the start date");
    if (rest.slug && rest.slug !== deal.slug && (await prisma.deal.findUnique({ where: { slug: rest.slug } }))) {
      throw new ConflictError(`A deal with the URL "${rest.slug}" already exists`);
    }
    if (rest.discountType === "FREE_SHIPPING") update.discountValue = 0;

    const oldIds = deal.products.map((p) => p.productId);
    const newIds = productIds ? [...new Set(productIds)] : oldIds;
    if (productIds) await this.assertProductsExist(newIds);

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.deal.update({ where: { id: dealId }, data: update });
      if (productIds) {
        const toRemove = oldIds.filter((id) => !newIds.includes(id));
        const toAdd = newIds.filter((id) => !oldIds.includes(id));
        if (toRemove.length) await tx.dealProduct.deleteMany({ where: { dealId, productId: { in: toRemove } } });
        if (toAdd.length) await tx.dealProduct.createMany({ data: toAdd.map((productId) => ({ dealId, productId })) });
      }
      return u;
    });

    await syncDealPricing([...new Set([...oldIds, ...newIds])]);
    return updated;
  }

  async deleteDeal(dealId: string) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId }, include: { products: { select: { productId: true } } } });
    if (!deal) throw new NotFoundError("Deal not found");
    await prisma.deal.delete({ where: { id: dealId } }); // DealProduct rows cascade
    await syncDealPricing(deal.products.map((p) => p.productId));
    return { message: "Deal deleted" };
  }

  // ─── BANNERS ───

  async getBanners() {
    return prisma.banner.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] });
  }

  private bannerDates(data: Record<string, unknown>) {
    const out: Record<string, unknown> = { ...data };
    if ("startDate" in data) out.startDate = data.startDate ? parseDateInput(data.startDate, "start", "Start date") : null;
    if ("endDate" in data) out.endDate = data.endDate ? parseDateInput(data.endDate, "end", "End date") : null;
    if ("link" in data && data.link === "") out.link = null;
    return out;
  }

  async createBanner(data: Record<string, unknown>) {
    return prisma.banner.create({ data: { position: "home_promo", ...this.bannerDates(data) } as never });
  }

  async updateBanner(bannerId: string, data: Record<string, unknown>) {
    const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
    if (!banner) throw new NotFoundError("Banner not found");
    return prisma.banner.update({ where: { id: bannerId }, data: this.bannerDates(data) as never });
  }

  async deleteBanner(bannerId: string) {
    const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
    if (!banner) throw new NotFoundError("Banner not found");
    await prisma.banner.delete({ where: { id: bannerId } });
    return { message: "Banner deleted" };
  }

  // ─── STATIC PAGES ───

  async getPages() {
    return prisma.staticPage.findMany({ orderBy: { title: "asc" } });
  }

  async getPage(pageId: string) {
    const page = await prisma.staticPage.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundError("Page not found");
    return page;
  }

  async savePage(data: { id?: string; title: string; slug: string; content: string; isActive?: boolean }) {
    const clash = await prisma.staticPage.findUnique({ where: { slug: data.slug } });
    if (data.id) {
      const page = await prisma.staticPage.findUnique({ where: { id: data.id } });
      if (!page) throw new NotFoundError("Page not found");
      if (clash && clash.id !== data.id) throw new ConflictError(`Another page already uses the URL "${data.slug}"`);
      const { id, ...rest } = data;
      return prisma.staticPage.update({ where: { id }, data: rest });
    }
    if (clash) throw new ConflictError(`A page with the URL "${data.slug}" already exists`);
    const { id: _id, ...rest } = data;
    return prisma.staticPage.create({ data: rest });
  }

  async deletePage(pageId: string) {
    const page = await prisma.staticPage.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundError("Page not found");
    await prisma.staticPage.delete({ where: { id: pageId } });
    return { message: "Page deleted" };
  }

  // ─── REPORTS ───

  async getSalesReport(startDate?: string, endDate?: string) {
    const { start, end } = parseRange(startDate, endDate);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end }, status: { notIn: REVENUE_EXCLUDED } },
      select: {
        id: true,
        totalAmount: true,
        taxAmount: true,
        shippingAmount: true,
        discountAmount: true,
        rewardDiscount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const sum = (f: (o: (typeof orders)[number]) => Prisma.Decimal) =>
      parseFloat(orders.reduce((s, o) => s + Number(f(o)), 0).toFixed(2));
    const totalRevenue = sum((o) => o.totalAmount);

    // Daily series across the whole range
    const byDay = new Map<string, { date: string; orders: number; revenue: number }>();
    for (let t = start.getTime(); t <= end.getTime(); t += 24 * 60 * 60 * 1000) {
      const key = new Date(t).toISOString().slice(0, 10);
      byDay.set(key, { date: key, orders: 0, revenue: 0 });
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const row = byDay.get(key) || { date: key, orders: 0, revenue: 0 };
      row.orders++;
      row.revenue = Math.round((row.revenue + Number(o.totalAmount)) * 100) / 100;
      byDay.set(key, row);
    }

    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { orderId: { in: orders.map((o) => o.id) } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 10,
    });

    return {
      startDate: start,
      endDate: end,
      totalOrders: orders.length,
      totalRevenue,
      totalTax: sum((o) => o.taxAmount),
      totalShipping: sum((o) => o.shippingAmount),
      totalDiscount: parseFloat((sum((o) => o.discountAmount) + sum((o) => o.rewardDiscount)).toFixed(2)),
      avgOrderValue: orders.length > 0 ? parseFloat((totalRevenue / orders.length).toFixed(2)) : 0,
      daily: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)),
      topProducts: topProducts.map((t) => ({
        productId: t.productId,
        name: t.productName,
        quantity: t._sum.quantity || 0,
        revenue: Number(t._sum.totalPrice || 0),
      })),
    };
  }

  async getInventoryReport() {
    const rows = await prisma.$queryRaw<{ in_stock: bigint; low: bigint; out: bigint; total: bigint }[]>`
      SELECT
        COUNT(*) FILTER (WHERE i."stockQuantity" - i."reservedQuantity" > i."lowStockThreshold")::bigint AS in_stock,
        COUNT(*) FILTER (WHERE i."stockQuantity" - i."reservedQuantity" > 0
                           AND i."stockQuantity" - i."reservedQuantity" <= i."lowStockThreshold")::bigint AS low,
        COUNT(*) FILTER (WHERE i."stockQuantity" - i."reservedQuantity" <= 0)::bigint AS out,
        COUNT(*)::bigint AS total
      FROM "Inventory" i JOIN "Product" p ON p.id = i."productId"
      WHERE p."isActive" = true`;
    const r = rows[0];
    return {
      totalProducts: Number(r?.total ?? 0),
      inStock: Number(r?.in_stock ?? 0),
      lowStock: Number(r?.low ?? 0),
      outOfStock: Number(r?.out ?? 0),
    };
  }

  async getCustomerReport(startDate?: string, endDate?: string) {
    const { start, end } = parseRange(startDate, endDate);
    const [newCustomers, totalCustomers, topCustomers] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: start, lte: end } } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.findMany({
        where: { role: "CUSTOMER", orders: { some: {} } },
        select: { id: true, firstName: true, lastName: true, email: true, _count: { select: { orders: true } } },
        orderBy: { orders: { _count: "desc" } },
        take: 10,
      }),
    ]);
    return {
      newCustomers,
      totalCustomers,
      topCustomers: topCustomers.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        orderCount: c._count.orders,
      })),
    };
  }

  async exportOrders(startDate?: string, endDate?: string) {
    const { start, end } = parseRange(startDate, endDate);
    return prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        payment: { select: { method: true, status: true } },
        items: { select: { productName: true, quantity: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ─── STORE SETTINGS ───

  getStoreSettings() {
    return settingsService.getPublic();
  }

  async updateStoreSettings(settings: Record<string, string>) {
    const unknown = Object.keys(settings).filter((k) => !ALLOWED_SETTING_KEYS.has(k));
    if (unknown.length) throw new BadRequestError(`Unknown setting: ${unknown.join(", ")}`);

    const numeric = ["tax_rate", "delivery_fee", "free_delivery_threshold"];
    for (const key of numeric) {
      if (key in settings) {
        const n = Number(settings[key]);
        if (settings[key].trim() === "" || !Number.isFinite(n) || n < 0) {
          throw new BadRequestError(`${key.replace(/_/g, " ")} must be a number of 0 or more`);
        }
        if (key === "tax_rate" && n > 30) throw new BadRequestError("Tax rate looks too high (max 30%)");
      }
    }
    for (const key of ["delivery_enabled", "pickup_enabled", "pay_on_delivery_enabled"]) {
      if (key in settings && !["true", "false"].includes(settings[key])) {
        throw new BadRequestError(`${key} must be true or false`);
      }
    }
    if (settings.store_hours) {
      try {
        const parsed = JSON.parse(settings.store_hours);
        if (!Array.isArray(parsed)) throw new Error();
      } catch {
        throw new BadRequestError("Store hours are not in the expected format");
      }
    }

    await prisma.$transaction(
      Object.entries(settings).map(([key, value]) =>
        prisma.storeSetting.upsert({ where: { key }, update: { value: value.trim() }, create: { key, value: value.trim() } })
      )
    );
    return settingsService.getPublic();
  }

  // ─── CONTACT MESSAGES ───

  async getContactMessages(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [messages, total, unread] = await Promise.all([
      prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { isRead: false } }),
    ]);
    return { messages, unread, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async markMessageRead(id: string) {
    const msg = await prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) throw new NotFoundError("Message not found");
    return prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
  }
}

export const adminService = new AdminService();
