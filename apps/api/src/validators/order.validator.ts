import { z } from "zod";

export const createOrderSchema = z.object({
  fulfillmentType: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
  addressId: z.string().optional(),
  notes: z.string().max(500).optional(),
  couponCode: z.string().max(50).optional(),
  rewardPointsToRedeem: z.number().int().min(0).default(0),
});

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.string().optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required").max(500),
});
