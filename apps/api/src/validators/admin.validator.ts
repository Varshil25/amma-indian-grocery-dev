import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers and hyphens");

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const money = z.number({ invalid_type_error: "Must be a number" }).min(0, "Must be 0 or more").max(1_000_000);
const optionalMoney = money.nullable().optional();
const imageUrl = z
  .string()
  .trim()
  .url("Image must be a valid URL")
  .refine((u) => /^https?:\/\//i.test(u), "Image URL must start with http:// or https://");

/** Admin UI historically sent "FIXED"; the database enum is FIXED_AMOUNT. */
const discountType = z.preprocess(
  (v) => (v === "FIXED" ? "FIXED_AMOUNT" : v),
  z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"], {
    errorMap: () => ({ message: "Discount type must be Percentage, Fixed amount or Free shipping" }),
  })
);

const dateInput = z.string().trim().min(1, "Date is required");

// ─── Products ───
const productImage = z.object({ url: imageUrl, altText: optionalText(200) });

const productBase = z.object({
  name: z.string().trim().min(1, "Product name is required").max(200),
  slug: slug.optional(),
  sku: z.string().trim().min(1, "SKU is required").max(64),
  description: optionalText(5000),
  shortDescription: optionalText(300),
  categoryId: z.string().trim().min(1, "Please choose a category"),
  brand: optionalText(100),
  unit: z.string().trim().min(1).max(20).optional(),
  unitValue: z.number().positive().max(100000).nullable().optional(),
  price: money.refine((n) => n > 0, "Price must be greater than 0"),
  compareAtPrice: optionalMoney,
  costPrice: optionalMoney,
  barcode: optionalText(64),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isOnSale: z.boolean().optional(),
  isPerishable: z.boolean().optional(),
  isTaxable: z.boolean().optional(),
  metaTitle: optionalText(200),
  metaDescription: optionalText(400),
  images: z.array(productImage).max(10, "Up to 10 images").optional(),
  lowStockThreshold: z.number().int().min(0).max(100000).optional(),
});

export const createProductSchema = productBase.extend({
  initialStock: z.number().int().min(0).max(1_000_000).optional(),
});

export const updateProductSchema = productBase.partial();

// ─── Categories ───
export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
  slug: slug.optional(),
  description: optionalText(1000),
  image: imageUrl.nullable().optional(),
  parentId: z.string().trim().min(1).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});
export const updateCategorySchema = categorySchema.partial();

// ─── Coupons ───
const couponBase = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Code must be at least 3 characters")
    .max(30)
    .transform((c) => c.toUpperCase())
    .refine((c) => /^[A-Z0-9_-]+$/.test(c), "Code can only contain letters, numbers, - and _"),
  description: optionalText(300),
  discountType,
  discountValue: money,
  minimumOrder: optionalMoney,
  maximumDiscount: optionalMoney,
  usageLimit: z.number().int().min(1).nullable().optional(),
  perUserLimit: z.number().int().min(1).max(1000).optional(),
  startDate: dateInput,
  endDate: dateInput,
  isActive: z.boolean().optional(),
});

const percentCap = <T extends { discountType?: string; discountValue?: number }>(d: T) =>
  !(d.discountType === "PERCENTAGE" && d.discountValue !== undefined && d.discountValue > 100);

export const createCouponSchema = couponBase.refine(percentCap, {
  message: "A percentage discount can't be more than 100%",
  path: ["discountValue"],
});
export const updateCouponSchema = couponBase.partial().refine(percentCap, {
  message: "A percentage discount can't be more than 100%",
  path: ["discountValue"],
});

// ─── Deals ───
// Deals change item prices; free delivery is offered through coupons instead.
const dealDiscountType = z.preprocess(
  (v) => (v === "FIXED" ? "FIXED_AMOUNT" : v),
  z.enum(["PERCENTAGE", "FIXED_AMOUNT"], {
    errorMap: () => ({ message: "Deal discount must be a percentage or a fixed amount" }),
  })
);
const dealBase = z.object({
  name: z.string().trim().min(1, "Deal name is required").max(150),
  slug: slug.optional(),
  description: optionalText(1000),
  bannerImage: imageUrl.nullable().optional(),
  discountType: dealDiscountType,
  discountValue: money.refine((n) => n > 0, "Discount must be greater than 0"),
  startDate: dateInput,
  endDate: dateInput,
  isActive: z.boolean().optional(),
  productIds: z.array(z.string().min(1)).max(500).optional(),
});
export const createDealSchema = dealBase.refine(percentCap, {
  message: "A percentage discount can't be more than 100%",
  path: ["discountValue"],
});
export const updateDealSchema = dealBase.partial().refine(percentCap, {
  message: "A percentage discount can't be more than 100%",
  path: ["discountValue"],
});

// ─── Banners ───
export const BANNER_POSITIONS = ["home_promo"] as const;
const bannerBase = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  subtitle: optionalText(200),
  image: imageUrl,
  link: z
    .string()
    .trim()
    .max(300)
    .refine((l) => l === "" || l.startsWith("/") || /^https?:\/\//.test(l), "Link must start with / or http(s)://")
    .nullable()
    .optional(),
  position: z.enum(BANNER_POSITIONS).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
  startDate: dateInput.nullable().optional(),
  endDate: dateInput.nullable().optional(),
});
export const createBannerSchema = bannerBase;
export const updateBannerSchema = bannerBase.partial();

// ─── Orders ───
export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, { errorMap: () => ({ message: "Unknown order status" }) }),
  note: z.string().trim().max(500).optional(),
});

export const markOrderPaidSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

// ─── Inventory ───
export const adjustInventorySchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .refine((n) => n !== 0, "Quantity can't be 0")
    .refine((n) => Math.abs(n) <= 1_000_000, "Quantity is too large"),
  type: z.enum(["RESTOCK", "RETURN", "DAMAGE", "EXPIRED", "CORRECTION"], {
    errorMap: () => ({ message: "Unknown adjustment type" }),
  }),
  reason: z.string().trim().max(300).optional(),
});

export const inventorySettingsSchema = z.object({
  lowStockThreshold: z.number().int().min(0).max(100000),
});

// ─── Customers ───
export const updateCustomerSchema = z.object({
  isActive: z.boolean(),
});

// ─── Pages ───
export const pageSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Title is required").max(150),
  slug,
  content: z.string().trim().min(1, "Content is required").max(50000),
  isActive: z.boolean().optional(),
});

// ─── Settings ───
export const storeSettingsSchema = z.record(z.string(), z.string().max(5000));

// ─── Media ───
export const uploadMediaSchema = z.object({
  dataUrl: z.string().min(1, "dataUrl is required"),
});
