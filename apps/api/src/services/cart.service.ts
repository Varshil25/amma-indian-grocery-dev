import { Prisma } from "@prisma/client";
import prisma from "../config/database.js";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";
import { evaluateCoupon } from "./coupon.service.js";

const cartItemInclude = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      unit: true,
      unitValue: true,
      isActive: true,
      images: {
        orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
        select: { url: true, altText: true },
        take: 1,
      },
      inventory: {
        select: { stockQuantity: true, reservedQuantity: true },
      },
    },
  },
};

export class CartService {
  private async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }
    return cart;
  }

  async getCart(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: cartItemInclude,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cart) {
      return { items: [], subtotal: 0, itemCount: 0 };
    }

    // Calculate totals
    let subtotal = 0;
    let itemCount = 0;
    const items = cart.items.map((item) => {
      const price = Number(item.product.price);
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      itemCount += item.quantity;

      const available = item.product.inventory
        ? item.product.inventory.stockQuantity - item.product.inventory.reservedQuantity
        : 999;

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
        lineTotal: parseFloat(lineTotal.toFixed(2)),
        inStock: item.product.isActive && available > 0,
        availableQty: item.product.isActive ? available : 0,
      };
    });

    return {
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      itemCount,
    };
  }

  async addItem(userId: string, productId: string, quantity: number) {
    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });
    if (!product || !product.isActive) {
      throw new NotFoundError("Product not found");
    }

    // Check stock
    if (product.inventory) {
      const available = product.inventory.stockQuantity - product.inventory.reservedQuantity;
      if (available < quantity) {
        throw new BadRequestError(
          available <= 0 ? "Product is out of stock" : `Only ${available} items available`
        );
      }
    }

    const cart = await this.getOrCreateCart(userId);

    // Check if item already in cart
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      // Recheck stock for total qty
      if (product.inventory) {
        const available = product.inventory.stockQuantity - product.inventory.reservedQuantity;
        if (available < newQty) {
          throw new BadRequestError(`Only ${available} items available (${existing.quantity} already in cart)`);
        }
      }

      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    return this.getCart(userId);
  }

  async updateItemQuantity(userId: string, productId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundError("Cart not found");

    const item = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (!item) throw new NotFoundError("Item not in cart");

    // Check stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });
    if (product?.inventory) {
      const available = product.inventory.stockQuantity - product.inventory.reservedQuantity;
      if (available < quantity) {
        throw new BadRequestError(`Only ${available} items available`);
      }
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundError("Cart not found");

    const item = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (!item) throw new NotFoundError("Item not in cart");

    await prisma.cartItem.delete({ where: { id: item.id } });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { items: [], subtotal: 0, itemCount: 0 };
  }

  async applyCoupon(userId: string, code: string) {
    const cart = await this.getCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestError("Your cart is empty");
    }

    const { coupon, discount } = await evaluateCoupon(userId, code, cart.subtotal);

    return {
      ...cart,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        description: coupon.description,
      },
      discount,
      total: parseFloat((cart.subtotal - discount).toFixed(2)),
    };
  }
}

export const cartService = new CartService();
