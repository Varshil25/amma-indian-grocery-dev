import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ammagrocery.com" },
    update: {},
    create: {
      email: "admin@ammagrocery.com",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "SUPER_ADMIN",
      emailVerified: true,
      referralCode: "AMMA-ADMIN",
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // Create categories
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
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`${categories.length} categories created`);

  // Create sample products
  const spicesCategory = await prisma.category.findUnique({ where: { slug: "spices" } });
  const grainsCategory = await prisma.category.findUnique({ where: { slug: "grains-rice" } });
  const vegetablesCategory = await prisma.category.findUnique({ where: { slug: "vegetables" } });
  const fruitsCategory = await prisma.category.findUnique({ where: { slug: "fresh-fruits" } });
  const dairyCategory = await prisma.category.findUnique({ where: { slug: "milk-eggs" } });

  if (spicesCategory && grainsCategory && vegetablesCategory && fruitsCategory && dairyCategory) {
    const products = [
      { name: "Basmati Rice", slug: "basmati-rice", sku: "GR-001", price: 12.99, compareAtPrice: 15.99, categoryId: grainsCategory.id, brand: "India Gate", unit: "kg", unitValue: 5, isFeatured: true },
      { name: "Turmeric Powder", slug: "turmeric-powder", sku: "SP-001", price: 4.99, compareAtPrice: 6.99, categoryId: spicesCategory.id, brand: "MDH", unit: "g", unitValue: 200, isFeatured: true },
      { name: "Red Chili Powder", slug: "red-chili-powder", sku: "SP-002", price: 3.99, categoryId: spicesCategory.id, brand: "Everest", unit: "g", unitValue: 200 },
      { name: "Garam Masala", slug: "garam-masala", sku: "SP-003", price: 5.49, compareAtPrice: 7.99, categoryId: spicesCategory.id, brand: "MDH", unit: "g", unitValue: 100, isOnSale: true },
      { name: "Fresh Oranges", slug: "fresh-oranges", sku: "FR-001", price: 8.00, compareAtPrice: 10.00, categoryId: fruitsCategory.id, unit: "kg", unitValue: 1, isFeatured: true, isPerishable: true },
      { name: "Fresh Onions", slug: "fresh-onions", sku: "VG-001", price: 2.99, categoryId: vegetablesCategory.id, unit: "kg", unitValue: 1, isPerishable: true },
      { name: "Paneer", slug: "paneer", sku: "DA-001", price: 6.99, compareAtPrice: 8.99, categoryId: dairyCategory.id, brand: "Amul", unit: "g", unitValue: 400, isPerishable: true, isFeatured: true },
      { name: "Ghee", slug: "ghee", sku: "DA-002", price: 14.99, categoryId: dairyCategory.id, brand: "Amul", unit: "ml", unitValue: 500, isFeatured: true },
      { name: "Cumin Seeds", slug: "cumin-seeds", sku: "SP-004", price: 4.49, categoryId: spicesCategory.id, brand: "Everest", unit: "g", unitValue: 200 },
      { name: "Toor Dal", slug: "toor-dal", sku: "PL-001", price: 7.99, categoryId: grainsCategory.id, brand: "Tata", unit: "kg", unitValue: 1 },
    ];

    for (const prod of products) {
      const product = await prisma.product.upsert({
        where: { sku: prod.sku },
        update: {},
        create: {
          ...prod,
          price: prod.price,
          compareAtPrice: prod.compareAtPrice || null,
          unitValue: prod.unitValue || null,
        },
      });

      // Create inventory for each product
      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: {},
        create: {
          productId: product.id,
          stockQuantity: Math.floor(Math.random() * 100) + 20,
          lowStockThreshold: 10,
          reorderPoint: 5,
          reorderQuantity: 50,
        },
      });
    }
    console.log(`${products.length} products with inventory created`);
  }

  // Create sample coupons
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      description: "10% off your first order",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minimumOrder: 20,
      maximumDiscount: 15,
      usageLimit: 1000,
      perUserLimit: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  await prisma.coupon.upsert({
    where: { code: "SPICE5" },
    update: {},
    create: {
      code: "SPICE5",
      description: "$5 off orders over $30",
      discountType: "FIXED_AMOUNT",
      discountValue: 5,
      minimumOrder: 30,
      usageLimit: 500,
      perUserLimit: 3,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  });
  console.log("Sample coupons created");

  // Create static pages
  const pages = [
    { title: "Privacy Policy", slug: "privacy-policy", content: "Privacy Policy\n\nAt Amma Indian Grocery, we are committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal information.\n\nInformation We Collect: Name, email address, phone number, delivery address, and payment information when you place an order.\n\nHow We Use Your Information: To process and deliver your orders, send order confirmations and updates, improve our services, and send promotional offers (with your consent).\n\nData Security: We use industry-standard encryption to protect your personal and payment information.\n\nContact Us: For privacy-related inquiries, please email us at groceryish@contact.com." },
    { title: "Shipping Policy", slug: "shipping", content: "Shipping Policy\n\nFree Shipping: Orders over $50 qualify for free standard shipping.\n\nStandard Delivery: 2-3 business days ($5.99 for orders under $50)\n\nExpress Delivery: Same-day delivery available for orders placed before 2:00 PM ($9.99)\n\nPickup: Free in-store pickup available. Orders are typically ready within 2 hours.\n\nDelivery Area: We currently deliver within a 25-mile radius of our store at 1762 School House Road." },
    { title: "Refund Policy", slug: "refund", content: "Refund Policy\n\nWe want you to be completely satisfied with your purchase.\n\nFresh Produce: Full refund or replacement within 24 hours of delivery if the product quality is unsatisfactory.\n\nPackaged Goods: Full refund within 7 days if the product is unopened and in original condition.\n\nDamaged Items: If your order arrives damaged, please contact us within 48 hours with photos for a full refund.\n\nRefunds are processed within 5-7 business days and credited to your original payment method." },
    { title: "Payments", slug: "payments", content: "Payments\n\nWe accept all major credit cards (Visa, MasterCard, American Express, Discover), debit cards, and digital wallets.\n\nAll payments are securely processed through our payment gateway. Your card details are encrypted and never stored on our servers.\n\nFor any payment-related issues, please contact our support team." },
    { title: "Q&A", slug: "qa", content: "Frequently Asked Questions\n\nQ: What are your delivery hours?\nA: We deliver between 8:00 AM and 8:00 PM, Sunday through Thursday.\n\nQ: What is your return policy?\nA: Fresh produce can be returned within 24 hours of delivery if not satisfactory. Packaged goods can be returned within 7 days if unopened.\n\nQ: Do you offer same-day delivery?\nA: Yes, orders placed before 2:00 PM are eligible for same-day delivery.\n\nQ: How can I track my order?\nA: You can track your order from your account under the Orders section.\n\nQ: Do you have a minimum order amount?\nA: There is no minimum order amount, but orders over $50 qualify for free shipping." },
  ];

  for (const page of pages) {
    await prisma.staticPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }
  console.log(`${pages.length} static pages created`);

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
