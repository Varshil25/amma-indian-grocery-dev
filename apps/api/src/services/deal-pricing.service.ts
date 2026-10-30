import { Prisma } from "@prisma/client";
import prisma from "../config/database.js";
import { posService } from "./pos.service.js";
import { orderService } from "./order.service.js";

type DealLike = { discountType: string; discountValue: Prisma.Decimal | number };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Price after applying one deal to a regular price. FREE_SHIPPING leaves price alone. */
export function dealPrice(regular: number, deal: DealLike): number {
  const value = Number(deal.discountValue);
  if (deal.discountType === "PERCENTAGE") return round2(Math.max(0, regular * (1 - value / 100)));
  if (deal.discountType === "FIXED" || deal.discountType === "FIXED_AMOUNT") return round2(Math.max(0, regular - value));
  return regular;
}

/**
 * Hot Deals change the selling price of their products while they are live.
 *
 * - When a product enters a live deal, its regular price and compare-at price are parked
 *   in basePrice/baseCompareAtPrice, price becomes the deal price and compareAtPrice the
 *   regular price (shown struck through), and isOnSale is set.
 * - When no live deal covers it any more, the parked values are restored.
 * - If several live deals cover a product, the lowest price wins.
 *
 * Runs after any deal or price change, on startup, and on a timer so scheduled deals
 * start and end on their own.
 */
export async function syncDealPricing(productIds?: string[]): Promise<{ applied: number; reverted: number }> {
  const now = new Date();

  const products = await prisma.product.findMany({
    where: {
      ...(productIds ? { id: { in: productIds } } : {}),
      OR: [{ basePrice: { not: null } }, { dealProducts: { some: {} } }],
    },
    select: {
      id: true,
      price: true,
      compareAtPrice: true,
      basePrice: true,
      baseCompareAtPrice: true,
      isOnSale: true,
      squareCatalogId: true,
      dealProducts: {
        where: { deal: { isActive: true, startDate: { lte: now }, endDate: { gte: now } } },
        select: { deal: { select: { discountType: true, discountValue: true } } },
      },
    },
  });

  let applied = 0;
  let reverted = 0;

  for (const p of products) {
    const priceDeals = p.dealProducts.map((dp) => dp.deal).filter((d) => d.discountType !== "FREE_SHIPPING");
    const isApplied = p.basePrice !== null;
    const regular = Number(isApplied ? p.basePrice : p.price);
    const regularCompare = isApplied ? p.baseCompareAtPrice : p.compareAtPrice;

    let changed = false;

    if (priceDeals.length > 0) {
      const best = Math.min(...priceDeals.map((d) => dealPrice(regular, d)));
      const target = { price: best, compareAtPrice: regular, isOnSale: true };
      const matches =
        isApplied &&
        Number(p.price) === target.price &&
        Number(p.compareAtPrice) === target.compareAtPrice &&
        p.isOnSale;
      if (!matches) {
        await prisma.product.update({
          where: { id: p.id },
          data: {
            ...target,
            basePrice: regular,
            baseCompareAtPrice: regularCompare,
          },
        });
        applied++;
        changed = true;
      }
    } else if (isApplied) {
      const restoredCompare = p.baseCompareAtPrice;
      await prisma.product.update({
        where: { id: p.id },
        data: {
          price: regular,
          compareAtPrice: restoredCompare,
          basePrice: null,
          baseCompareAtPrice: null,
          isOnSale: restoredCompare !== null && Number(restoredCompare) > regular,
        },
      });
      reverted++;
      changed = true;
    }

    if (changed && p.squareCatalogId) {
      posService.pushPriceToSquare(p.id).catch((err) => {
        console.error(`Square price push failed for ${p.id}:`, err);
      });
    }
  }

  return { applied, reverted };
}

let timer: NodeJS.Timeout | null = null;

/** Background jobs every 5 minutes: deal start/end pricing and expiring unpaid card orders. */
export function startDealPricingScheduler() {
  if (timer) return;
  const run = () => {
    syncDealPricing()
      .then((r) => {
        if (r.applied || r.reverted) console.log(`[deals] pricing sync: ${r.applied} applied, ${r.reverted} reverted`);
      })
      .catch((err) => console.error("[deals] pricing sync failed:", err));
    orderService
      .expireUnpaidCardOrders()
      .then((n) => n && console.log(`[orders] cancelled ${n} unpaid card order(s)`))
      .catch((err) => console.error("[orders] expiry failed:", err));
  };
  run();
  timer = setInterval(run, 5 * 60 * 1000);
  timer.unref();
}
