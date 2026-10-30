import { z } from "zod";
import { normalizeUSPhone, PHONE_HINT } from "../utils/phone.js";

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name must be 50 characters or fewer").optional(),
  lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name must be 50 characters or fewer").optional(),
  // Not sent: unchanged. Blank: remove the number. Otherwise a valid US number, stored as +1XXXXXXXXXX.
  phone: z
    .string()
    .nullable()
    .optional()
    .transform((v, ctx) => {
      if (v === undefined) return undefined;
      if (v === null || v.trim() === "") return null;
      const normalized = normalizeUSPhone(v);
      if (!normalized) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: PHONE_HINT });
        return z.NEVER;
      }
      return normalized;
    }),
});

// USPS codes: 50 states, DC and the inhabited territories
const US_STATE_CODES = new Set(
  ("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH " +
    "OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC PR VI GU AS MP").split(" ")
);

export const addressSchema = z.object({
  label: z.string().max(50).optional(),
  // Defaults to the account holder's name when not given
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .refine((s) => US_STATE_CODES.has(s), "Use a 2-letter US state code, e.g. PA"),
  zipCode: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code (e.g. 19355)"),
  country: z.string().default("US"),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
});
