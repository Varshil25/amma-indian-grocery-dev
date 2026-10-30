import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
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
