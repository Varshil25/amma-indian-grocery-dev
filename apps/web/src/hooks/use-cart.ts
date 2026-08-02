import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuthStore } from "../stores/auth-store";

interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string;
  unit: string;
  unitValue?: string;
  isActive: boolean;
  images: { url: string; altText?: string }[];
  inventory?: { stockQuantity: number; reservedQuantity: number };
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
  lineTotal: number;
  inStock: boolean;
  availableQty: number;
}

interface CartData {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  coupon?: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    description?: string;
  };
  discount?: number;
  total?: number;
}

interface CartResponse {
  success: boolean;
  data: CartData;
}

export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["cart"],
    queryFn: () => apiClient.get<CartResponse>("/cart"),
    enabled: isAuthenticated,
    select: (res) => res.data,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { productId: string; quantity?: number }) =>
      apiClient.post<CartResponse>("/cart/items", {
        productId: data.productId,
        quantity: data.quantity || 1,
      }),
    onSuccess: (res) => {
      queryClient.setQueryData(["cart"], res);
      toast.success("Added to cart");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to add to cart");
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { productId: string; quantity: number }) =>
      apiClient.put<CartResponse>(`/cart/items/${data.productId}`, {
        quantity: data.quantity,
      }),
    onSuccess: (res) => {
      queryClient.setQueryData(["cart"], res);
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to update cart");
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      apiClient.delete<CartResponse>(`/cart/items/${productId}`),
    onSuccess: (res) => {
      queryClient.setQueryData(["cart"], res);
      toast.success("Removed from cart");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to remove item");
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.delete<CartResponse>("/cart"),
    onSuccess: (res) => {
      queryClient.setQueryData(["cart"], res);
      toast.success("Cart cleared");
    },
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) =>
      apiClient.post<CartResponse>("/cart/apply-coupon", { code }),
    onSuccess: (res) => {
      queryClient.setQueryData(["cart"], res);
      toast.success("Coupon applied!");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Invalid coupon");
    },
  });
}
