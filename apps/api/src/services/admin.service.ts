import prisma from "../config/database.js";
import { NotFoundError, BadRequestError } from "../middleware/errorHandler.js";
import { posService } from "./pos.service.js";

export class AdminService {
  async getDashboardStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      todayOrders,
      monthOrders,
      lastMonthOrders,
      pendingOrders,
      lowStockProducts,
      recentOrders,
      monthRevenue,
      lastMonthRevenue,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.count({
        where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
      }),
      prisma.order.count({
        where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } },
      }),
      prisma.inventory.count({
        where: {
          stockQuantity: { lte: prisma.inventory.fields.lowStockThreshold ? undefined : 10 },
        },
      }).catch(() => 0),
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
        where: {
          createdAt: { gte: startOfMonth },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const currentRevenue = Number(monthRevenue._sum.totalAmount || 0);
    const previousRevenue = Number(lastMonthRevenue._sum.totalAmount || 0);
    const revenueChange = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    const orderChange = lastMonthOrders > 0
      ? ((monthOrders - lastMonthOrders) / lastMonthOrders) * 100
      : 0;

    return {
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers,
        pendingOrders,
        lowStockProducts,
        monthRevenue: currentRevenue,
        revenueChange: parseFloat(revenueChange.toFixed(1)),
        todayOrders,
        monthOrders,
        orderChange: parseFloat(orderChange.toFixed(1)),
      },
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

  async getProducts(page: number, limit: number, search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { sku: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true } },
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
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
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        category: p.category?.name || "Uncategorized",
        image: p.images[0]?.url || null,
        stock: p.inventory
          ? p.inventory.stockQuantity - p.inventory.reservedQuantity
          : null,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        createdAt: p.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOrders(page: number, limit: number, status?: string, search?: string) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
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
        itemCount: o.items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0),
        customerName: `${o.user.firstName} ${o.user.lastName}`,
        customerEmail: o.user.email,
        payment: o.payment,
        createdAt: o.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateOrderStatus(orderId: string, status: string, note?: string, changedBy?: string) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: status as never },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: status as never,
        note,
        changedBy,
      },
    });

    return { message: "Order status updated" };
  }

  async getCustomers(page: number, limit: number, search?: string) {
    const where: Record<string, unknown> = { role: "CUSTOMER" };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
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
        orderCount: c._count.orders,
        createdAt: c.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
  // ─── PRODUCT CRUD ───

  async createProduct(data: {
    name: string;
    slug: string;
    sku: string;
    description?: string;
    shortDescription?: string;
    categoryId?: string;
    brand?: string;
    unit?: string;
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    barcode?: string;
    tags?: string[];
    isFeatured?: boolean;
    isActive?: boolean;
    isPerishable?: boolean;
    metaTitle?: string;
    metaDescription?: string;
  }) {
    const existing = await prisma.product.findFirst({
      where: { OR: [{ slug: data.slug }, { sku: data.sku }] },
    });
    if (existing) throw new BadRequestError("Product with this slug or SKU already exists");

    const product = await prisma.product.create({ data: data as never });

    // Create inventory record
    await prisma.inventory.create({
      data: { productId: product.id, stockQuantity: 0, reservedQuantity: 0, lowStockThreshold: 10, reorderPoint: 5 },
    });

    return product;
  }

  async updateProduct(productId: string, data: Record<string, unknown>) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError("Product not found");

    const updated = await prisma.product.update({ where: { id: productId }, data: data as never });

    // If price changed and product is linked to Square, push update
    if (data.price !== undefined && product.squareCatalogId) {
      posService.pushPriceToSquare(productId).catch((err) => {
        console.error("Auto-push price to Square failed:", err);
      });
    }

    return updated;
  }

  async deleteProduct(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError("Product not found");
    // Soft delete by deactivating
    await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
    return { message: "Product deactivated" };
  }

  // ─── CATEGORY CRUD ───

  async getCategories() {
    return prisma.category.findMany({
      include: { _count: { select: { products: true } }, children: true },
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parentId?: string;
    sortOrder?: number;
    isFeatured?: boolean;
  }) {
    const existing = await prisma.category.findFirst({ where: { slug: data.slug } });
    if (existing) throw new BadRequestError("Category with this slug already exists");
    return prisma.category.create({ data: data as never });
  }

  async updateCategory(categoryId: string, data: Record<string, unknown>) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) throw new NotFoundError("Category not found");
    return prisma.category.update({ where: { id: categoryId }, data: data as never });
  }

  async deleteCategory(categoryId: string) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId }, include: { _count: { select: { products: true } } } });
    if (!cat) throw new NotFoundError("Category not found");
    if (cat._count.products > 0) throw new BadRequestError("Cannot delete category with products");
    await prisma.category.delete({ where: { id: categoryId } });
    return { message: "Category deleted" };
  }

  // ─── INVENTORY ───

  async getInventory(page: number, limit: number, filter?: string) {
    const where: Record<string, unknown> = {};
    if (filter === "low-stock") {
      where.stockQuantity = { lte: 10 };
    } else if (filter === "out-of-stock") {
      where.stockQuantity = { lte: 0 };
    }

    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, sku: true, isActive: true, images: { take: 1, select: { url: true } } },
          },
        },
        orderBy: { stockQuantity: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventory.count({ where }),
    ]);

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
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async adjustInventory(productId: string, data: { quantity: number; type: string; reason?: string }) {
    const inventory = await prisma.inventory.findUnique({ where: { productId } });
    if (!inventory) throw new NotFoundError("Inventory record not found");

    const previousQty = inventory.stockQuantity;
    const newQty = previousQty + data.quantity;

    await prisma.inventory.update({
      where: { productId },
      data: { stockQuantity: Math.max(0, newQty) },
    });

    await prisma.inventoryAdjustment.create({
      data: {
        inventoryId: inventory.id,
        type: data.type as never,
        quantity: data.quantity,
        previousQty,
        newQty: Math.max(0, newQty),
        reason: data.reason,
      },
    });

    return { message: "Inventory adjusted", previousQty, newQty: Math.max(0, newQty) };
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
      prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.coupon.count(),
    ]);

    return {
      coupons: coupons.map((c) => ({
        ...c,
        discountValue: Number(c.discountValue),
        minimumOrder: c.minimumOrder ? Number(c.minimumOrder) : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createCoupon(data: {
    code: string;
    discountType: string;
    discountValue: number;
    minimumOrder?: number;
    usageLimit?: number;
    perUserLimit?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }) {
    const existing = await prisma.coupon.findFirst({ where: { code: data.code } });
    if (existing) throw new BadRequestError("Coupon code already exists");

    return prisma.coupon.create({
      data: {
        code: data.code,
        discountType: data.discountType as never,
        discountValue: data.discountValue,
        minimumOrder: data.minimumOrder ?? null,
        usageLimit: data.usageLimit ?? null,
        perUserLimit: data.perUserLimit ?? 1,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateCoupon(couponId: string, data: Record<string, unknown>) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundError("Coupon not found");
    return prisma.coupon.update({ where: { id: couponId }, data: data as never });
  }

  async deleteCoupon(couponId: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundError("Coupon not found");
    await prisma.coupon.delete({ where: { id: couponId } });
    return { message: "Coupon deleted" };
  }

  // ─── DEALS ───

  async getDeals(page: number, limit: number) {
    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        include: {
          _count: { select: { products: true } },
          products: { select: { productId: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deal.count(),
    ]);
    return {
      deals: deals.map((d) => ({
        ...d,
        discountValue: Number(d.discountValue),
        productCount: d._count.products,
        productIds: d.products.map((p) => p.productId),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createDeal(data: {
    name: string;
    slug: string;
    description?: string;
    discountType: string;
    discountValue: number;
    startDate: string;
    endDate: string;
    isActive?: boolean;
    productIds?: string[];
  }) {
    const { productIds, ...dealData } = data;
    const deal = await prisma.deal.create({ data: dealData as never });

    if (productIds?.length) {
      await prisma.dealProduct.createMany({
        data: productIds.map((pid) => ({ dealId: deal.id, productId: pid })),
      });

      // Apply deal pricing to each product
      await this.applyDealToProducts(productIds, data.discountType, data.discountValue);
    }

    return deal;
  }

  async updateDeal(dealId: string, data: Record<string, unknown>) {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { products: { select: { productId: true } } },
    });
    if (!deal) throw new NotFoundError("Deal not found");

    const { productIds: newProductIds, ...dealData } = data as { productIds?: string[]; [key: string]: unknown };

    // Update the deal record
    const updated = await prisma.deal.update({ where: { id: dealId }, data: dealData as never });

    // If productIds provided, sync the product list
    if (newProductIds !== undefined) {
      const oldProductIds = deal.products.map((p) => p.productId);
      const toRemove = oldProductIds.filter((id) => !newProductIds.includes(id));
      const toAdd = newProductIds.filter((id) => !oldProductIds.includes(id));

      // Remove old product links and revert their prices
      if (toRemove.length) {
        await prisma.dealProduct.deleteMany({ where: { dealId, productId: { in: toRemove } } });
        await this.revertDealFromProducts(toRemove);
      }

      // Add new product links and apply deal pricing
      if (toAdd.length) {
        await prisma.dealProduct.createMany({
          data: toAdd.map((pid) => ({ dealId, productId: pid })),
        });
      }

      // Apply deal pricing to all current products (handles discount value changes too)
      const discountType = (dealData.discountType as string) || deal.discountType;
      const discountValue = dealData.discountValue !== undefined ? Number(dealData.discountValue) : Number(deal.discountValue);
      const allProductIds = newProductIds;
      if (allProductIds.length) {
        await this.applyDealToProducts(allProductIds, discountType, discountValue);
      }
    } else if (data.discountType !== undefined || data.discountValue !== undefined) {
      // Discount changed but product list didn't — re-apply to existing products
      const existingProductIds = deal.products.map((p) => p.productId);
      if (existingProductIds.length) {
        const discountType = (data.discountType as string) || deal.discountType;
        const discountValue = data.discountValue !== undefined ? Number(data.discountValue) : Number(deal.discountValue);
        await this.applyDealToProducts(existingProductIds, discountType, discountValue);
      }
    }

    return updated;
  }

  async deleteDeal(dealId: string) {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { products: { select: { productId: true } } },
    });
    if (!deal) throw new NotFoundError("Deal not found");

    const productIds = deal.products.map((p) => p.productId);

    // Remove deal and links
    await prisma.dealProduct.deleteMany({ where: { dealId } });
    await prisma.deal.delete({ where: { id: dealId } });

    // Revert product prices
    if (productIds.length) {
      await this.revertDealFromProducts(productIds);
    }

    return { message: "Deal deleted" };
  }

  /**
   * Apply a deal's discount to products:
   * - Saves original price as compareAtPrice
   * - Calculates new sale price
   * - Marks products as isOnSale = true
   * - Pushes price to Square POS if linked
   */
  private async applyDealToProducts(productIds: string[], discountType: string, discountValue: number) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, compareAtPrice: true, squareCatalogId: true },
    });

    for (const product of products) {
      const originalPrice = product.compareAtPrice ? Number(product.compareAtPrice) : Number(product.price);
      let salePrice: number;

      if (discountType === "PERCENTAGE") {
        salePrice = originalPrice * (1 - discountValue / 100);
      } else if (discountType === "FIXED") {
        salePrice = Math.max(0, originalPrice - discountValue);
      } else {
        // FREE_SHIPPING — don't change price, just mark as on sale
        salePrice = Number(product.price);
      }

      salePrice = Math.round(salePrice * 100) / 100;

      await prisma.product.update({
        where: { id: product.id },
        data: {
          compareAtPrice: originalPrice,
          price: salePrice,
          isOnSale: true,
        },
      });

      // Push to Square POS if linked
      if (product.squareCatalogId) {
        posService.pushPriceToSquare(product.id).catch((err) => {
          console.error(`Auto-push deal price to Square failed for ${product.id}:`, err);
        });
      }
    }
  }

  /**
   * Revert products from a deal:
   * - Restores original price from compareAtPrice
   * - Only removes isOnSale if the product is not in any other active deal
   * - Pushes reverted price to Square POS if linked
   */
  private async revertDealFromProducts(productIds: string[]) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, compareAtPrice: true, squareCatalogId: true },
    });

    for (const product of products) {
      if (!product.compareAtPrice) continue;

      // Check if product is still in another active deal
      const otherDealCount = await prisma.dealProduct.count({
        where: {
          productId: product.id,
          deal: { isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
        },
      });

      await prisma.product.update({
        where: { id: product.id },
        data: {
          price: product.compareAtPrice,
          compareAtPrice: null,
          isOnSale: otherDealCount > 0,
        },
      });

      // Push reverted price to Square POS if linked
      if (product.squareCatalogId) {
        posService.pushPriceToSquare(product.id).catch((err) => {
          console.error(`Auto-push reverted price to Square failed for ${product.id}:`, err);
        });
      }
    }
  }

  // ─── BANNERS ───

  async getBanners() {
    return prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async createBanner(data: { title: string; image: string; link?: string; position?: string; sortOrder?: number; startDate?: string; endDate?: string; isActive?: boolean }) {
    return prisma.banner.create({ data: data as never });
  }

  async updateBanner(bannerId: string, data: Record<string, unknown>) {
    return prisma.banner.update({ where: { id: bannerId }, data: data as never });
  }

  async deleteBanner(bannerId: string) {
    await prisma.banner.delete({ where: { id: bannerId } });
    return { message: "Banner deleted" };
  }

  // ─── STATIC PAGES ───

  async getPages() {
    return prisma.staticPage.findMany({ orderBy: { title: "asc" } });
  }

  async getPage(pageId: string) {
    return prisma.staticPage.findUnique({ where: { id: pageId } });
  }

  async upsertPage(data: { title: string; slug: string; content: string }) {
    return prisma.staticPage.upsert({
      where: { slug: data.slug },
      update: { title: data.title, content: data.content },
      create: data,
    });
  }

  // ─── REPORTS ───

  async getSalesReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      select: { totalAmount: true, taxAmount: true, shippingAmount: true, discountAmount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const totalTax = orders.reduce((s, o) => s + Number(o.taxAmount), 0);
    const totalShipping = orders.reduce((s, o) => s + Number(o.shippingAmount), 0);
    const totalDiscount = orders.reduce((s, o) => s + Number(o.discountAmount), 0);

    return {
      totalOrders: orders.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      totalShipping: parseFloat(totalShipping.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      avgOrderValue: orders.length > 0 ? parseFloat((totalRevenue / orders.length).toFixed(2)) : 0,
    };
  }

  async getInventoryReport() {
    const [totalProducts, inStock, lowStock, outOfStock] = await Promise.all([
      prisma.inventory.count(),
      prisma.inventory.count({ where: { stockQuantity: { gt: 10 } } }),
      prisma.inventory.count({ where: { stockQuantity: { gt: 0, lte: 10 } } }),
      prisma.inventory.count({ where: { stockQuantity: { lte: 0 } } }),
    ]);
    return { totalProducts, inStock, lowStock, outOfStock };
  }

  async getCustomerReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [newCustomers, totalCustomers] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: start, lte: end } } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
    ]);

    const topCustomers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        _count: { select: { orders: true } },
      },
      orderBy: { orders: { _count: "desc" } },
      take: 10,
    });

    return {
      newCustomers,
      totalCustomers,
      topCustomers: topCustomers.map((c) => ({
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        orderCount: c._count.orders,
      })),
    };
  }

  async exportOrders(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: { select: { productName: true, quantity: true, unitPrice: true, totalPrice: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ─── STORE SETTINGS ───

  async getStoreSettings() {
    const settings = await prisma.storeSetting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async updateStoreSettings(settings: Record<string, string>) {
    for (const [key, value] of Object.entries(settings)) {
      await prisma.storeSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    return this.getStoreSettings();
  }

  // ─── CONTACT MESSAGES ───

  async getContactMessages(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contactMessage.count(),
    ]);
    return { messages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async markMessageRead(id: string) {
    return prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
  }
}

export const adminService = new AdminService();
