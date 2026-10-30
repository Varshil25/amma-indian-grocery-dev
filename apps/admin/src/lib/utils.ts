import { apiClient } from "./api-client";

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const money = (n: number | null | undefined) =>
  n === null || n === undefined ? "-" : `$${Number(n).toFixed(2)}`;

/** yyyy-mm-dd for <input type="date">, in the admin's local timezone */
export function toDateInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Start of the picked day in local time, as ISO (what the API stores) */
export const startOfDayISO = (day: string) => new Date(`${day}T00:00:00`).toISOString();
/** End of the picked day in local time, as ISO — so "ends Nov 28" includes all of Nov 28 */
export const endOfDayISO = (day: string) => new Date(`${day}T23:59:59.999`).toISOString();

export const todayInput = () => toDateInput(new Date());
export const daysFromNowInput = (days: number) => toDateInput(new Date(Date.now() + days * 86400000));

export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Shrink an image in the browser before upload so product photos stay small and fast.
 * Returns a data URL (JPEG, or PNG/WebP kept as-is when they have transparency needs).
 */
export async function fileToResizedDataUrl(file: File, maxSize = 1200): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.type === "image/gif") {
    if (file.size > 5 * 1024 * 1024) throw new Error("GIFs must be 5 MB or smaller");
    return readAsDataUrl(file);
  }
  const src = await readAsDataUrl(file);
  const img = await loadImage(src);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  const keepAlpha = file.type === "image/png" || file.type === "image/webp";
  if (!keepAlpha) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(keepAlpha ? "image/webp" : "image/jpeg", 0.85);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Couldn't read that file"));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file isn't a readable image"));
    img.src = src;
  });
}

export async function uploadImage(file: File): Promise<string> {
  const dataUrl = await fileToResizedDataUrl(file);
  const res = await apiClient.post<{ url: string }>("/admin/media", { dataUrl });
  return res.url;
}
