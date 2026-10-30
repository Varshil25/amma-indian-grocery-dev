/**
 * Removes the sample products and coupons that older versions of prisma/seed.ts created
 * (Basmati Rice GR-001, Turmeric Powder SP-001, … and coupons WELCOME10 / SPICE5).
 *
 * Only touches records that still match the sample SKU *and* name, so real products that
 * happen to reuse a SKU are left alone. Anything already used on an order is deactivated
 * instead of deleted, so order history stays intact.
 *
 *   npm run db:remove-sample-data            # dry run — shows what would change
 *   npm run db:remove-sample-data -- --apply # make the changes
 */
import prisma from "../src/config/database.js";

const SAMPLE_PRODUCTS: Record<string, string> = {
  "GR-001": "Basmati Rice",
  "SP-001": "Turmeric Powder",
  "SP-002": "Red Chili Powder",
  "SP-003": "Garam Masala",
  "FR-001": "Fresh Oranges",
  "VG-001": "Fresh Onions",
  "DA-001": "Paneer",
  "DA-002": "Ghee",
  "SP-004": "Cumin Seeds",
  "PL-001": "Toor Dal",
};
const SAMPLE_COUPONS: Record<string, string> = {
  WELCOME10: "10% off your first order",
  SPICE5: "$5 off orders over $30",
};

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(apply ? "Removing sample data…" : "Dry run — nothing will change. Re-run with --apply to remove.");

  const products = await prisma.product.findMany({
    where: { sku: { in: Object.keys(SAMPLE_PRODUCTS) } },
    include: { _count: { select: { orderItems: true } } },
  });
  for (const p of products) {
    if (SAMPLE_PRODUCTS[p.sku] !== p.name) {
      console.log(`  skip  ${p.sku} "${p.name}" — name differs from the sample, looks like a real product`);
      continue;
    }
    if (p._count.orderItems > 0) {
      console.log(`  hide  ${p.sku} "${p.name}" — on ${p._count.orderItems} order line(s), deactivating`);
      if (apply) await prisma.product.update({ where: { id: p.id }, data: { isActive: false, isFeatured: false } });
      continue;
    }
    console.log(`  delete ${p.sku} "${p.name}"`);
    if (apply) {
      await prisma.$transaction(async (tx) => {
        const inv = await tx.inventory.findUnique({ where: { productId: p.id } });
        if (inv) await tx.inventoryAdjustment.deleteMany({ where: { inventoryId: inv.id } });
        await tx.cartItem.deleteMany({ where: { productId: p.id } });
        await tx.dealProduct.deleteMany({ where: { productId: p.id } });
        await tx.review.deleteMany({ where: { productId: p.id } });
        await tx.product.delete({ where: { id: p.id } }); // images, inventory, wishlist cascade
      });
    }
  }

  const coupons = await prisma.coupon.findMany({
    where: { code: { in: Object.keys(SAMPLE_COUPONS) } },
    include: { _count: { select: { orders: true } } },
  });
  for (const c of coupons) {
    if (SAMPLE_COUPONS[c.code] !== c.description) {
      console.log(`  skip  coupon ${c.code} — description differs from the sample`);
      continue;
    }
    if (c._count.orders > 0) {
      console.log(`  hide  coupon ${c.code} — used on ${c._count.orders} order(s), deactivating`);
      if (apply) await prisma.coupon.update({ where: { id: c.id }, data: { isActive: false } });
      continue;
    }
    console.log(`  delete coupon ${c.code}`);
    if (apply) await prisma.coupon.delete({ where: { id: c.id } });
  }

  if (!products.length && !coupons.length) console.log("  No sample data found.");
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
