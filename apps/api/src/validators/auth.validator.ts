import { z } from "zod";
import { normalizeUSPhone, PHONE_HINT } from "../utils/phone.js";

const email = z.string().trim().toLowerCase().email("Invalid email address");
// bcrypt only uses the first 72 bytes; anything longer would be silently cut off
const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer");
const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} must be 50 characters or fewer`);

/** Optional phone: blank means "not given"; anything else must be a valid US number. */
export const optionalPhone = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v.trim() === "") return undefined;
    const normalized = normalizeUSPhone(v);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: PHONE_HINT });
      return z.NEVER;
    }
    return normalized;
  });

export const registerSchema = z.object({
  email,
  password: newPassword,
  firstName: name("First name"),
  lastName: name("Last name"),
  phone: optionalPhone,
  referralCode: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((v) => v || undefined),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  email,
  code: z.string().trim().min(6).max(6),
  newPassword,
});

export const verifyEmailSchema = z.object({
  email,
  code: z.string().min(6).max(6),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword,
});
