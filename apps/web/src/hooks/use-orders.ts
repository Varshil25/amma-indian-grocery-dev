import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuthStore } from "../stores/auth-store";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage?: string;
  productSlug?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderPayment {
  id: string;
  status: string;
  method: string;
  amount: number;
  paidAt?: string;
  receiptUrl?: string;
}

interface OrderAddress {
  id: string;
  label?: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
}

interface StatusHistoryEntry {
  status: string;
  note?: string;
  createdAt: string;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentType: string;
  totalAmount: number;
  itemCount: number;
  items: OrderItem[];
  payment?: { status: string; method: string; paidAt?: string } | null;
  createdAt: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
}

export interface OrderDetail {
  id: string;
  canCancel?: boolean;
  orderNumber: string;
  status: string;
  fulfillmentType: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  rewardPointsUsed: number;
  rewardDiscount: number;
  totalAmount: number;
  notes?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  items: OrderItem[];
  address?: OrderAddress | null;
  payment?: OrderPayment | null;
  statusHistory: StatusHistoryEntry[];
  coupon?: { code: string; discountType: string; discountValue: number } | null;
  refunds: { id: string; amount: number; reason?: string; status: string; createdAt: string }[];
}

interface OrderListResponse {
  success: boolean;
  data: {
    orders: OrderListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface OrderDetailResponse {
  success: boolean;
  data: OrderDetail;
}

interface CreateOrderResponse {
  success: boolean;
  data: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    paymentMethod: "PAY_ON_DELIVERY" | "CARD";
  };
}

export interface OrderPreview {
  subtotal: number;
  discountAmount: number;
  coupon: { code: string; description?: string | null; discountType: string; discountValue: number } | null;
  couponError: string | null;
  rewardPointsUsed: number;
  rewardDiscount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxRate: number;
  freeDeliveryThreshold: number;
  deliveryFee: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  payOnDeliveryEnabled: boolean;
  onlinePaymentsEnabled: boolean;
  itemCount: number;
}

/** Server-calculated totals for the current cart (tax, delivery, coupon) */
export function useOrderPreview(input: { fulfillmentType: "DELIVERY" | "PICKUP"; couponCode?: string | null }, enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["order-preview", input.fulfillmentType, input.couponCode || null],
    queryFn: () =>
      apiClient.post<{ success: boolean; data: OrderPreview }>("/orders/preview", {
        fulfillmentType: input.fulfillmentType,
        couponCode: input.couponCode || undefined,
      }),
    enabled: isAuthenticated && enabled,
    select: (res) => res.data,
    staleTime: 0,
  });
}

interface PaymentIntentResponse {
  success: boolean;
  data: {
    clientSecret: string;
    paymentId: string;
  };
}

export function useOrders(page = 1, status?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const params = new URLSearchParams({ page: String(page), limit: "10" });
  if (status) params.set("status", status);

  return useQuery({
    queryKey: ["orders", page, status],
    queryFn: () =>
      apiClient.get<OrderListResponse>(`/orders?${params.toString()}`),
    enabled: isAuthenticated,
    select: (res) => res.data,
  });
}

export function useOrderDetail(orderId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () =>
      apiClient.get<OrderDetailResponse>(`/orders/${orderId}`),
    enabled: isAuthenticated && !!orderId,
    select: (res) => res.data,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      fulfillmentType: string;
      addressId?: string;
      notes?: string;
      couponCode?: string;
      rewardPointsToRedeem?: number;
      paymentMethod?: "PAY_ON_DELIVERY" | "CARD";
    }) => apiClient.post<CreateOrderResponse>("/orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to create order");
    },
  });
}

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (orderId: string) =>
      apiClient.post<PaymentIntentResponse>("/payments/create-intent", {
        orderId,
      }),
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to initiate payment");
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      apiClient.post<{ success: boolean; data: { status: string } }>(
        "/payments/confirm",
        { orderId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Payment confirmation failed");
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      apiClient.put(`/orders/${orderId}/cancel`, { reason }),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", v.orderId] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast.success("Order cancelled successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to cancel order");
    },
  });
}
