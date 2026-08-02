import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  sortOrder: number;
  isFeatured: boolean;
  children?: Category[];
  _count?: { products: number };
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

interface CategoryDetailResponse {
  success: boolean;
  data: {
    category: Category & { children: { id: string; name: string; slug: string; image?: string }[] };
    products: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters: {
      brands: string[];
      subcategories: { id: string; name: string; slug: string }[];
    };
  };
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      apiClient.get<CategoriesResponse>("/categories", { skipAuth: true }),
    select: (res) => res.data,
  });
}

export function useFeaturedCategories() {
  return useQuery({
    queryKey: ["categories", "featured"],
    queryFn: () =>
      apiClient.get<CategoriesResponse>("/categories/featured", { skipAuth: true }),
    select: (res) => res.data,
  });
}

export function useCategoryDetail(slug: string, params: { page?: number; sort?: string } = {}) {
  return useQuery({
    queryKey: ["category", slug, params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", String(params.page));
      if (params.sort) searchParams.set("sort", params.sort);
      const qs = searchParams.toString();
      return apiClient.get<CategoryDetailResponse>(
        `/categories/${slug}${qs ? `?${qs}` : ""}`,
        { skipAuth: true }
      );
    },
    select: (res) => res.data,
    enabled: !!slug,
  });
}
