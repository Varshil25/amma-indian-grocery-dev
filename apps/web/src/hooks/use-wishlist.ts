import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuthStore } from "../stores/auth-store";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string;
  unit: string;
  avgRating: string;
  reviewCount: number;
  isActive: boolean;
  images: { url: string; altText?: string }[];
  category: { id: string; name: string; slug: string };
  inventory?: { stockQuantity: number; reservedQuantity: number };
}

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
}

interface WishlistResponse {
  success: boolean;
  data: WishlistItem[];
}

export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["wishlist"],
    queryFn: () => apiClient.get<WishlistResponse>("/wishlist"),
    enabled: isAuthenticated,
    select: (res) => res.data,
  });
}

export function useWishlistIds() {
  const { data } = useWishlist();
  return data?.map((item) => item.productId) || [];
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useMutation({
    mutationFn: async ({ productId, isInWishlist }: { productId: string; isInWishlist: boolean }) => {
      if (!isAuthenticated) {
        throw new ApiError("Please login to save items", 401);
      }
      if (isInWishlist) {
        return apiClient.delete(`/wishlist/${productId}`);
      }
      return apiClient.post(`/wishlist/${productId}`);
    },
    onSuccess: (_, { isInWishlist }) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(isInWishlist ? "Removed from wishlist" : "Added to wishlist");
    },
    onError: (error: ApiError) => {
      if (error.status === 401) {
        toast.error("Please login to save items to your wishlist");
      } else {
        toast.error(error.message || "Failed to update wishlist");
      }
    },
  });
}
