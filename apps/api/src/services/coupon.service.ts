import { OrderStatus } from "@prisma/client";
import prisma from "../config/database.js";
import { BadRequestError } from "../middleware/errorHandler.js";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Validate a coupon for a shopper and cart subtotal. Returns the coupon and the discount
 * it gives, or throws a BadRequestError with a message suitable for the shopper.
 */
export async function evaluateCoupon(userId: string, code: string, subtotal: number) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.isActive) throw new BadRequestError("Invalid coupon code");

  const now = new Date();
  if (now < coupon.startDate) throw new BadRequestError("This coupon isn't active yet");
  if (now > coupon.endDate) throw new BadRequestError("This coupon has expired");
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new BadRequestError("This coupon has reached its usage limit");
  }

  const userUsageCount = await prisma.order.count({
    where: { userId, couponId: coupon.id, status: { not: OrderStatus.CANCELLED } },
  });
  if (userUsageCount >= coupon.perUserLimit) {
    throw new BadRequestError("You have already used this coupon");
  }

  if (coupon.minimumOrder && subtotal < Number(coupon.minimumOrder)) {
    throw new BadRequestError(`Minimum order of $${Number(coupon.minimumOrder).toFixed(2)} required for this coupon`);
  }

  let discount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discount = subtotal * (Number(coupon.discountValue) / 100);
    if (coupon.maximumDiscount) discount = Math.min(discount, Number(coupon.maximumDiscount));
  } else if (coupon.discountType === "FIXED_AMOUNT") {
    discount = Number(coupon.discountValue);
  }
  discount = round2(Math.min(discount, subtotal));

  return { coupon, discount, freeShipping: coupon.discountType === "FREE_SHIPPING" };
}
