import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";

interface StaticPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PageResponse {
  success: boolean;
  data: StaticPage;
}

export interface StoreSettings {
  store_name?: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  store_map_embed?: string;
  store_hours?: string; // JSON string of { day, time }[]
  social_facebook?: string;
  social_whatsapp?: string;
  social_instagram?: string;
  [key: string]: string | undefined;
}

interface StoreSettingsResponse {
  success: boolean;
  data: StoreSettings;
}

export function useStaticPage(slug: string) {
  return useQuery({
    queryKey: ["content", "page", slug],
    queryFn: () =>
      apiClient.get<PageResponse>(`/content/pages/${slug}`, { skipAuth: true }),
    select: (res) => res.data,
    enabled: !!slug,
  });
}

export function useStoreSettings() {
  return useQuery({
    queryKey: ["content", "store-settings"],
    queryFn: () =>
      apiClient.get<StoreSettingsResponse>("/content/store-settings", { skipAuth: true }),
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  link?: string | null;
  position: string;
  sortOrder: number;
}

export function useBanners(position = "home_promo") {
  return useQuery({
    queryKey: ["content", "banners", position],
    queryFn: () =>
      apiClient.get<{ success: boolean; data: Banner[] }>(`/content/banners?position=${encodeURIComponent(position)}`, {
        skipAuth: true,
      }),
    select: (res) => res.data,
    staleTime: 60 * 1000,
  });
}

export interface ActiveDeal {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  bannerImage?: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | string;
  discountValue: number;
  startDate: string;
  endDate: string;
  productCount: number;
  previewProducts: { id: string; name: string; slug: string; price: number; compareAtPrice: number | null; image: string | null }[];
}

export function useActiveDeals() {
  return useQuery({
    queryKey: ["deals", "active"],
    queryFn: () => apiClient.get<{ success: boolean; data: ActiveDeal[] }>("/deals", { skipAuth: true }),
    select: (res) => res.data,
    staleTime: 60 * 1000,
  });
}

/** Store hours saved in Admin → Settings; days without hours are dropped. */
export function parseStoreHours(raw?: string): { day: string; time: string }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((h) => h && typeof h.day === "string" && typeof h.time === "string" && h.time.trim())
      : [];
  } catch {
    return [];
  }
}
