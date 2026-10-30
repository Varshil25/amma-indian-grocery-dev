import { BadRequestError } from "../middleware/errorHandler.js";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a date coming from the admin panel. Accepts a full ISO timestamp (preferred —
 * the admin converts the picked day to the store's local time) or a bare YYYY-MM-DD,
 * which is treated as the start or end of that UTC day.
 */
export function parseDateInput(value: unknown, edge: "start" | "end", field = "date"): Date {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestError(`${field} is required`);
  }
  const v = value.trim();
  const d = DATE_ONLY.test(v)
    ? new Date(`${v}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}Z`)
    : new Date(v);
  if (isNaN(d.getTime())) throw new BadRequestError(`${field} is not a valid date`);
  return d;
}

/** Parse a reporting range; defaults to the last 30 days. End is inclusive. */
export function parseRange(startDate?: unknown, endDate?: unknown) {
  const end = endDate ? parseDateInput(endDate, "end", "endDate") : new Date();
  const start = startDate
    ? parseDateInput(startDate, "start", "startDate")
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (start > end) throw new BadRequestError("Start date must be before end date");
  return { start, end };
}
