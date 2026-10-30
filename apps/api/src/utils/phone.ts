/**
 * US phone numbers. Customers type them every which way — "(610) 555-0123", "610.555.0123",
 * "+1 610 555 0123" — so they're stored in one form (E.164, "+16105550123"). That keeps the
 * unique index meaningful (the same number can't be registered twice in different formats)
 * and lets the admin search by any format.
 */
export const PHONE_HINT = "Enter a valid US phone number, e.g. (610) 555-0123";

/** "+16105550123" for a valid US number, otherwise null. */
export function normalizeUSPhone(input: string): string | null {
  const trimmed = input.trim();
  // Only digits, spaces and the usual separators; a leading + must be followed by 1
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && !digits.startsWith("1")) return null; // non-US country code
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  // NANP: area code and exchange can't start with 0 or 1
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return null;
  return `+1${digits}`;
}

/** "(610) 555-0123" for a stored +1 number; anything else (older free-text entries) as-is. */
export function formatUSPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(phone);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : phone;
}
