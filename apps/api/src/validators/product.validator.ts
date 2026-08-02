import { z } from "zod";

export const productQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  rating: z.string().optional(),
  sort: z.enum(["price_asc", "price_desc", "name_asc", "name_desc", "newest", "rating", "best_selling"]).optional(),
  search: z.string().optional(),
  inStock: z.enum(["true", "false"]).optional(),
  featured: z.enum(["true", "false"]).optional(),
  onSale: z.enum(["true", "false"]).optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.string().optional(),
});
