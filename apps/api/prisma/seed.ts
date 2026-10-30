/**
 * Initial setup for a new database.
 *
 * Creates the first admin account (from ADMIN_EMAIL / ADMIN_PASSWORD), a starter set of
 * categories and the store's info pages. It does NOT create products, coupons or deals —
 * add those from the admin panel. Safe to re-run: existing records are left untouched.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' npm run db:seed
 */
import bcrypt from "bcryptjs";
import prisma from "../src/config/database.js";

async function main() {
  console.log("Seeding database...");

  // ─── First admin ───
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) {
      console.log(`Admin ${adminEmail} already exists — left unchanged`);
    } else {
      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash: await bcrypt.hash(adminPassword, 12),
          firstName: "Store",
          lastName: "Admin",
          role: "SUPER_ADMIN",
          emailVerified: true,
        },
      });
      console.log(`Admin user created: ${adminEmail}`);
    }
  } else {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin account");
  }

  // ─── Starter categories (rename, hide or delete them in Admin → Categories) ───
  const categories = [
    { name: "Vegetables", slug: "vegetables", sortOrder: 1, isFeatured: true },
    { name: "Fresh Fruits", slug: "fresh-fruits", sortOrder: 2, isFeatured: true },
    { name: "Milk & Eggs", slug: "milk-eggs", sortOrder: 3, isFeatured: true },
    { name: "Bakery", slug: "bakery", sortOrder: 4, isFeatured: true },
    { name: "House Hold", slug: "house-hold", sortOrder: 5, isFeatured: true },
    { name: "Dry Fruits", slug: "dry-fruits", sortOrder: 6, isFeatured: true },
    { name: "Spices", slug: "spices", sortOrder: 7 },
    { name: "Grains & Rice", slug: "grains-rice", sortOrder: 8 },
    { name: "Pulses & Lentils", slug: "pulses-lentils", sortOrder: 9 },
    { name: "Snacks", slug: "snacks", sortOrder: 10 },
    { name: "Beverages", slug: "beverages", sortOrder: 11 },
    { name: "Frozen Foods", slug: "frozen-foods", sortOrder: 12 },
    { name: "Ready to Eat", slug: "ready-to-eat", sortOrder: 13 },
    { name: "Personal Care", slug: "personal-care", sortOrder: 14 },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  console.log(`${categories.length} categories ensured`);

  // ─── Info pages (edit the wording in Admin → Pages) ───
  // Deliberately free of specific addresses, fees or delivery promises: delivery fees,
  // free-delivery threshold and tax come from Admin → Settings → Checkout.
  const pages = [
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      content:
        "Privacy Policy\n\nWe collect the information you give us when you create an account or place an order — your name, email address, phone number and delivery address — and use it only to process and deliver your orders, send order updates, and run your rewards account.\n\nCard payments are handled by our payment processor; we never see or store your full card number.\n\nWe don't sell your personal information. To ask about the data we hold or to have it deleted, contact us through the Contact page.",
    },
    {
      title: "Shipping Policy",
      slug: "shipping",
      content:
        "Delivery & Pickup\n\nYou can choose home delivery or free in-store pickup at checkout, where available. The delivery fee and the order amount that qualifies for free delivery are shown in your cart before you pay.\n\nWe'll email you as your order is confirmed, prepared and sent out or ready to collect. For questions about a delivery, contact us through the Contact page.",
    },
    {
      title: "Refund Policy",
      slug: "refund",
      content:
        "Refunds & Returns\n\nIf something in your order is damaged, spoiled or not what you ordered, contact us as soon as possible with your order number and, if you can, a photo. We'll arrange a replacement or a refund to your original payment method.\n\nYou can cancel an order yourself from your order history until we start preparing it.",
    },
    {
      title: "Payments",
      slug: "payments",
      content:
        "Payments\n\nThe payment options available for your order are shown at checkout — for example paying when your order is delivered or collected, or paying online by card where enabled.\n\nOnline card payments are processed securely by our payment provider; your card details are never stored on our servers.",
    },
    {
      title: "Q&A",
      slug: "qa",
      content:
        "Frequently Asked Questions\n\nQ: How can I track my order?\nA: Sign in and open Orders in your account to see the status of each order.\n\nQ: Can I cancel an order?\nA: Yes — from your order history, until we start preparing it.\n\nQ: How do rewards points work?\nA: You earn points on every confirmed order and can redeem them at checkout. See the Rewards page in your account for details.",
    },
  ];
  for (const page of pages) {
    await prisma.staticPage.upsert({ where: { slug: page.slug }, update: {}, create: page });
  }
  console.log(`${pages.length} info pages ensured`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
