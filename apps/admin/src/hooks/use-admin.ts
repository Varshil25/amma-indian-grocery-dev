import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Dashboard ───
export interface DashboardStats {
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    pendingOrders: number;
    lowStockProducts: number;
    monthRevenue: number;
    revenueChange: number;
    todayOrders: number;
    monthOrders: number;
    orderChange: number;
    unreadMessages: number;
  };
  daily: { date: string; orders: number; revenue: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    customerName: string;
    customerEmail: string;
    createdAt: string;
  }[];
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiClient.get("/admin/dashboard/stats"),
    // New orders show up without a manual reload (paused while the tab is in the background)
    refetchInterval: 30 * 1000,
  });
}

// ─── Products ───
export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  regularPrice: number;
  inDeal: boolean;
  category: string;
  categoryId: string;
  image: string | null;
  stock: number | null;
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  createdAt: string;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  shortDescription: string | null;
  categoryId: string;
  brand: string | null;
  unit: string;
  unitValue: number | null;
  price: number;
  compareAtPrice: number | null;
  livePrice: number;
  inDeal: boolean;
  deals: { id: string; name: string; isActive: boolean; endDate: string }[];
  costPrice: number | null;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  isPerishable: boolean;
  isTaxable: boolean;
  images: { id: string; url: string; altText: string | null; isPrimary: boolean }[];
  inventory: { stockQuantity: number; reservedQuantity: number; lowStockThreshold: number } | null;
  squareLinked: boolean;
}

export function useAdminProducts(page: number, search?: string, status?: string, limit = 20) {
  return useQuery<{ products: AdminProduct[]; pagination: Pagination }>({
    queryKey: ["admin", "products", page, search, status, limit],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      return apiClient.get(`/admin/products?${params}`);
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminProduct(id: string | null) {
  return useQuery<AdminProductDetail>({
    queryKey: ["admin", "product", id],
    queryFn: () => apiClient.get(`/admin/products/${id}`),
    enabled: !!id,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[][]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
}

export function useCreateProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post<AdminProductDetail>("/admin/products", data),
    onSuccess: () => invalidate(["admin", "products"], ["admin", "inventory"], ["admin", "dashboard"], ["admin", "categories"]),
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: unknown }) =>
      apiClient.put<AdminProductDetail>(`/admin/products/${id}`, body),
    onSuccess: (_d, vars) =>
      invalidate(["admin", "products"], ["admin", "product", vars.id], ["admin", "inventory"], ["admin", "dashboard"]),
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/products/${id}`),
    onSuccess: () => invalidate(["admin", "products"], ["admin", "inventory"], ["admin", "dashboard"]),
  });
}

// ─── Categories ───
export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  children?: AdminCategory[];
  _count?: { products: number };
}

export function useAdminCategories() {
  return useQuery<AdminCategory[]>({
    queryKey: ["admin", "categories"],
    queryFn: () => apiClient.get("/admin/categories"),
  });
}

export function useCreateCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post("/admin/categories", data),
    onSuccess: () => invalidate(["admin", "categories"]),
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: unknown }) => apiClient.put(`/admin/categories/${id}`, body),
    onSuccess: () => invalidate(["admin", "categories"], ["admin", "products"]),
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/categories/${id}`),
    onSuccess: () => invalidate(["admin", "categories"]),
  });
}

// ─── Orders ───
export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentType: string;
  totalAmount: number;
  itemCount: number;
  customerName: string;
  customerEmail: string;
  payment: { status: string; method: string } | null;
  createdAt: string;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentType: "DELIVERY" | "PICKUP";
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  rewardPointsUsed: number;
  rewardDiscount: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  cancelReason: string | null;
  nextStatuses: string[];
  customer: { id: string; name: string; email: string; phone: string | null };
  items: { id: string; productName: string; productSku: string; productImage: string | null; quantity: number; unitPrice: number; totalPrice: number }[];
  address: { firstName: string; lastName: string; addressLine1: string; addressLine2?: string | null; city: string; state: string; zipCode: string; phone?: string | null } | null;
  payment: { status: string; method: string; amount: number; paidAt: string | null } | null;
  statusHistory: { status: string; note: string | null; createdAt: string }[];
  coupon: { code: string } | null;
  refunds: { id: string; amount: number; reason: string | null; status: string; createdAt: string }[];
}

export function useAdminOrders(page: number, status?: string, search?: string) {
  return useQuery<{ orders: AdminOrder[]; pagination: Pagination }>({
    queryKey: ["admin", "orders", page, status, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      return apiClient.get(`/admin/orders?${params}`);
    },
    placeholderData: keepPreviousData,
    // New orders show up without a manual reload (paused while the tab is in the background)
    refetchInterval: 30 * 1000,
  });
}

export function useAdminOrder(id: string | null) {
  return useQuery<AdminOrderDetail>({
    queryKey: ["admin", "order", id],
    queryFn: () => apiClient.get(`/admin/orders/${id}`),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: { orderId: string; status: string; note?: string }) =>
      apiClient.put(`/admin/orders/${data.orderId}/status`, { status: data.status, note: data.note || undefined }),
    onSuccess: (_d, v) =>
      invalidate(["admin", "orders"], ["admin", "order", v.orderId], ["admin", "dashboard"], ["admin", "inventory"], ["admin", "products"]),
  });
}

export function useMarkOrderPaid() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (orderId: string) => apiClient.post(`/admin/orders/${orderId}/mark-paid`, {}),
    onSuccess: (_d, orderId) => invalidate(["admin", "orders"], ["admin", "order", orderId]),
  });
}

// ─── Customers ───
export interface AdminCustomer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  orderCount: number;
  createdAt: string;
}

export interface AdminCustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  totalSpent: number;
  rewards: { tier: string; availablePoints: number } | null;
  addresses: { id: string; label: string | null; addressLine1: string; city: string; state: string; zipCode: string; isDefault: boolean }[];
  orders: { id: string; orderNumber: string; status: string; totalAmount: number; createdAt: string }[];
}

export function useAdminCustomers(page: number, search?: string) {
  return useQuery<{ customers: AdminCustomer[]; pagination: Pagination }>({
    queryKey: ["admin", "customers", page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      return apiClient.get(`/admin/customers?${params}`);
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminCustomer(id: string | null) {
  return useQuery<AdminCustomerDetail>({
    queryKey: ["admin", "customer", id],
    queryFn: () => apiClient.get(`/admin/customers/${id}`),
    enabled: !!id,
  });
}

export function useUpdateCustomer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => apiClient.put(`/admin/customers/${id}`, { isActive }),
    onSuccess: (_d, v) => invalidate(["admin", "customers"], ["admin", "customer", v.id]),
  });
}

// ─── Inventory ───
export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  image: string | null;
  isActive: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  available: number;
  lowStockThreshold: number;
  reorderPoint: number;
  lastRestockedAt: string | null;
}

export function useAdminInventory(page: number, filter?: string, search?: string) {
  return useQuery<{ items: InventoryItem[]; pagination: Pagination }>({
    queryKey: ["admin", "inventory", page, filter, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter) params.set("filter", filter);
      if (search) params.set("search", search);
      return apiClient.get(`/admin/inventory?${params}`);
    },
    placeholderData: keepPreviousData,
  });
}

export function useInventoryHistory(productId: string | null) {
  return useQuery<{ id: string; type: string; quantity: number; previousQty: number; newQty: number; reason: string | null; createdAt: string }[]>({
    queryKey: ["admin", "inventory-history", productId],
    queryFn: () => apiClient.get(`/admin/inventory/${productId}/history`),
    enabled: !!productId,
  });
}

export function useAdjustInventory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: { productId: string; quantity: number; type: string; reason?: string }) =>
      apiClient.post(`/admin/inventory/${data.productId}/adjust`, {
        quantity: data.quantity,
        type: data.type,
        reason: data.reason || undefined,
      }),
    onSuccess: (_d, v) =>
      invalidate(["admin", "inventory"], ["admin", "inventory-history", v.productId], ["admin", "dashboard"], ["admin", "products"], ["admin", "reports"]),
  });
}

export function useUpdateInventorySettings() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: { productId: string; lowStockThreshold: number }) =>
      apiClient.put(`/admin/inventory/${data.productId}`, { lowStockThreshold: data.lowStockThreshold }),
    onSuccess: () => invalidate(["admin", "inventory"], ["admin", "dashboard"]),
  });
}

// ─── Coupons ───
export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  discountValue: number;
  minimumOrder: number | null;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export function useAdminCoupons(page: number) {
  return useQuery<{ coupons: AdminCoupon[]; pagination: Pagination }>({
    queryKey: ["admin", "coupons", page],
    queryFn: () => apiClient.get(`/admin/coupons?page=${page}&limit=20`),
  });
}

export function useCreateCoupon() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post("/admin/coupons", data),
    onSuccess: () => invalidate(["admin", "coupons"]),
  });
}

export function useUpdateCoupon() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: unknown }) => apiClient.put(`/admin/coupons/${id}`, body),
    onSuccess: () => invalidate(["admin", "coupons"]),
  });
}

export function useDeleteCoupon() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<{ message: string }>(`/admin/coupons/${id}`),
    onSuccess: () => invalidate(["admin", "coupons"]),
  });
}

// ─── Deals ───
export interface AdminDeal {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bannerImage: string | null;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  productCount: number;
  productIds: string[];
  createdAt: string;
}

export function useAdminDeals(page: number) {
  return useQuery<{ deals: AdminDeal[]; pagination: Pagination }>({
    queryKey: ["admin", "deals", page],
    queryFn: () => apiClient.get(`/admin/deals?page=${page}&limit=20`),
  });
}

export function useCreateDeal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post("/admin/deals", data),
    onSuccess: () => invalidate(["admin", "deals"], ["admin", "products"]),
  });
}

export function useUpdateDeal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: unknown }) => apiClient.put(`/admin/deals/${id}`, body),
    onSuccess: () => invalidate(["admin", "deals"], ["admin", "products"]),
  });
}

export function useDeleteDeal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/deals/${id}`),
    onSuccess: () => invalidate(["admin", "deals"], ["admin", "products"]),
  });
}

// ─── Banners ───
export interface AdminBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
}

export function useAdminBanners() {
  return useQuery<AdminBanner[]>({
    queryKey: ["admin", "banners"],
    queryFn: () => apiClient.get("/admin/banners"),
  });
}

export function useSaveBanner() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...body }: { id?: string; [key: string]: unknown }) =>
      id ? apiClient.put(`/admin/banners/${id}`, body) : apiClient.post("/admin/banners", body),
    onSuccess: () => invalidate(["admin", "banners"]),
  });
}

export function useDeleteBanner() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/banners/${id}`),
    onSuccess: () => invalidate(["admin", "banners"]),
  });
}

// ─── Reports ───
export interface SalesReport {
  totalOrders: number;
  totalRevenue: number;
  totalTax: number;
  totalShipping: number;
  totalDiscount: number;
  avgOrderValue: number;
  daily: { date: string; orders: number; revenue: number }[];
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
}

export interface InventoryReport {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export function useSalesReport(startDate: string, endDate: string) {
  return useQuery<SalesReport>({
    queryKey: ["admin", "reports", "sales", startDate, endDate],
    queryFn: () =>
      apiClient.get(
        `/admin/reports/sales?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      ),
    enabled: !!startDate && !!endDate,
  });
}

export function useInventoryReport() {
  return useQuery<InventoryReport>({
    queryKey: ["admin", "reports", "inventory"],
    queryFn: () => apiClient.get("/admin/reports/inventory"),
  });
}

export function useCustomerReport(startDate: string, endDate: string) {
  return useQuery<{ newCustomers: number; totalCustomers: number; topCustomers: { id: string; name: string; email: string; orderCount: number }[] }>({
    queryKey: ["admin", "reports", "customers", startDate, endDate],
    queryFn: () =>
      apiClient.get(
        `/admin/reports/customers?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      ),
    enabled: !!startDate && !!endDate,
  });
}
