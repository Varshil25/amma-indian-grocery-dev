import prisma from "../config/database.js";
import { env } from "../config/env.js";

/**
 * Store settings are key/value rows edited from Admin → Settings.
 * Checkout values fall back to these defaults until the owner saves their own.
 */
export const CHECKOUT_DEFAULTS = {
  tax_rate: "8", // percent
  delivery_fee: "5.99",
  free_delivery_threshold: "50",
  delivery_enabled: "true",
  pickup_enabled: "true",
  pay_on_delivery_enabled: "true",
} as const;

/** Keys the admin is allowed to write. Anything else is rejected. */
export const ALLOWED_SETTING_KEYS = new Set<string>([
  "store_name",
  "store_address",
  "store_phone",
  "store_email",
  "store_map_embed",
  "store_hours",
  "social_facebook",
  "social_whatsapp",
  "social_instagram",
  ...Object.keys(CHECKOUT_DEFAULTS),
]);

export interface CheckoutSettings {
  taxRate: number; // fraction, e.g. 0.08
  deliveryFee: number;
  freeDeliveryThreshold: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  payOnDeliveryEnabled: boolean;
  onlinePaymentsEnabled: boolean;
}

function num(value: string | undefined, fallback: string): number {
  const n = parseFloat(value ?? "");
  return Number.isFinite(n) && n >= 0 ? n : parseFloat(fallback);
}

function bool(value: string | undefined, fallback: string): boolean {
  return (value ?? fallback) === "true";
}

export const onlinePaymentsConfigured = () => !!(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY);

export class SettingsService {
  async getAll(): Promise<Record<string, string>> {
    const rows = await prisma.storeSetting.findMany();
    const result: Record<string, string> = {};
    for (const r of rows) result[r.key] = r.value;
    return result;
  }

  async getCheckoutSettings(): Promise<CheckoutSettings> {
    const s = await this.getAll();
    const d = CHECKOUT_DEFAULTS;
    return {
      taxRate: num(s.tax_rate, d.tax_rate) / 100,
      deliveryFee: num(s.delivery_fee, d.delivery_fee),
      freeDeliveryThreshold: num(s.free_delivery_threshold, d.free_delivery_threshold),
      deliveryEnabled: bool(s.delivery_enabled, d.delivery_enabled),
      pickupEnabled: bool(s.pickup_enabled, d.pickup_enabled),
      payOnDeliveryEnabled: bool(s.pay_on_delivery_enabled, d.pay_on_delivery_enabled),
      onlinePaymentsEnabled: onlinePaymentsConfigured(),
    };
  }

  /** Settings safe to expose to shoppers, with checkout defaults filled in. */
  async getPublic() {
    const s = await this.getAll();
    return {
      ...CHECKOUT_DEFAULTS,
      ...s,
      online_payments_enabled: String(onlinePaymentsConfigured()),
      stripe_publishable_key: onlinePaymentsConfigured() ? env.STRIPE_PUBLISHABLE_KEY! : "",
    };
  }
}

export const settingsService = new SettingsService();
