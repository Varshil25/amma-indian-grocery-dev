import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";

interface ProductImage {
  url: string;
  altText?: string;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductInventory {
  stockQuantity: number;
  reservedQuantity: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  sku: string;
  brand?: string;
  unit: string;
  unitValue?: string;
  price: string;
  compareAtPrice?: string;
  isOnSale: boolean;
  isFeatured: boolean;
  avgRating: string;
  reviewCount: number;
  tags: string[];
  images: ProductImage[];
  category: ProductCategory;
  inventory?: ProductInventory;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductListResponse {
  success: boolean;
  data: {
    products: ProductListItem[];
    pagination: PaginationMeta;
    filters: {
      brands: string[];
    };
  };
}

interface ProductDetailResponse {
  success: boolean;
  data: {
    product: any;
    relatedProducts: ProductListItem[];
  };
}

interface FeaturedResponse {
  success: boolean;
  data: ProductListItem[];
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: { url: string }[];
  category: { name: string; slug: string };
}

interface SearchResponse {
  success: boolean;
  data: SearchResult[];
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  rating?: string;
  sort?: string;
  search?: string;
  inStock?: string;
  featured?: string;
  onSale?: string;
}

function buildQueryString(params: ProductQueryParams): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      searchParams.set(key, String(val));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export function useProducts(params: ProductQueryParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () =>
      apiClient.get<ProductListResponse>(`/products${buildQueryString(params)}`, { skipAuth: true }),
    select: (res) => res.data,
  });
}

export function useProductDetail(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () =>
      apiClient.get<ProductDetailResponse>(`/products/${slug}`, { skipAuth: true }),
    select: (res) => res.data,
    enabled: !!slug,
  });
}

export function useFeaturedProducts(limit = 12) {
  return useQuery({
    queryKey: ["products", "featured", limit],
    queryFn: () =>
      apiClient.get<FeaturedResponse>(`/products/featured?limit=${limit}`, { skipAuth: true }),
    select: (res) => res.data,
  });
}

export function useBestSellers(limit = 12) {
  return useQuery({
    queryKey: ["products", "best-sellers", limit],
    queryFn: () =>
      apiClient.get<FeaturedResponse>(`/products/best-sellers?limit=${limit}`, { skipAuth: true }),
    select: (res) => res.data,
  });
}

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ["products", "search", query],
    queryFn: () =>
      apiClient.get<SearchResponse>(`/products/search?q=${encodeURIComponent(query)}&limit=8`, { skipAuth: true }),
    select: (res) => res.data,
    enabled: query.length >= 2,
  });
}

export function useProductReviews(productId: string, page = 1) {
  return useQuery({
    queryKey: ["reviews", productId, page],
    queryFn: () =>
      apiClient.get<any>(`/products/${productId}/reviews?page=${page}`, { skipAuth: true }),
    select: (res) => res.data,
    enabled: !!productId,
  });
}
