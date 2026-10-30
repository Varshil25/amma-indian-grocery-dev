/**
 * US phone numbers — same rules as the API (apps/api/src/utils/phone.ts), so the form can
 * say what's wrong before submitting. Stored as "+16105550123", shown as "(610) 555-0123".
 */
export const PHONE_HINT = "Enter a valid US phone number, e.g. (610) 555-0123";

export function normalizeUSPhone(input: string): string | null {
  const trimmed = input.trim();
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && !digits.startsWith("1")) return null;
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return null;
  return `+1${digits}`;
}

/** Blank is fine (the field is optional); otherwise it must be a valid US number. */
export const isValidOptionalPhone = (v?: string) => !v || !v.trim() || normalizeUSPhone(v) !== null;

export function formatUSPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(phone);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : phone;
}
