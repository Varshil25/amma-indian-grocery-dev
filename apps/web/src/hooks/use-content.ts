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
