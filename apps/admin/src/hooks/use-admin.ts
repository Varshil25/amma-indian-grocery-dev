import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";

// Types
interface DashboardStats {
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
  };
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

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  image: string | null;
  stock: number | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

interface AdminOrder {
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

interface AdminCustomer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  orderCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Dashboard
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiClient.get("/admin/dashboard/stats"),
  });
}

// Products
export function useAdminProducts(page: number, search?: string) {
  return useQuery<{ products: AdminProduct[]; pagination: Pagination }>({
    queryKey: ["admin", "products", page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      return apiClient.get(`/admin/products?${params}`);
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post("/admin/products", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) => {
      const { id, ...body } = data;
      return apiClient.put(`/admin/products/${id}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });
}

// Categories
interface AdminCategory {
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post("/admin/categories", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) => {
      const { id, ...body } = data;
      return apiClient.put(`/admin/categories/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

// Orders
export function useAdminOrders(page: number, status?: string, search?: string) {
  return useQuery<{ orders: AdminOrder[]; pagination: Pagination }>({
    queryKey: ["admin", "orders", page, status, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      return apiClient.get(`/admin/orders?${params}`);
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { orderId: string; status: string; note?: string }) =>
      apiClient.put(`/admin/orders/${data.orderId}/status`, {
        status: data.status,
        note: data.note,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

// Customers
export function useAdminCustomers(page: number, search?: string) {
  return useQuery<{ customers: AdminCustomer[]; pagination: Pagination }>({
    queryKey: ["admin", "customers", page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      return apiClient.get(`/admin/customers?${params}`);
    },
  });
}

// Inventory
interface InventoryItem {
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
}

export function useAdminInventory(page: number, filter?: string) {
  return useQuery<{ items: InventoryItem[]; pagination: Pagination }>({
    queryKey: ["admin", "inventory", page, filter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter) params.set("filter", filter);
      return apiClient.get(`/admin/inventory?${params}`);
    },
  });
}

export function useAdjustInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: string; quantity: number; type: string; reason?: string }) =>
      apiClient.post(`/admin/inventory/${data.productId}/adjust`, {
        quantity: data.quantity,
        type: data.type,
        reason: data.reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

// Coupons
interface AdminCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minimumOrder: number | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
}

export function useAdminCoupons(page: number) {
  return useQuery<{ coupons: AdminCoupon[]; pagination: Pagination }>({
    queryKey: ["admin", "coupons", page],
    queryFn: () => apiClient.get(`/admin/coupons?page=${page}&limit=20`),
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post("/admin/coupons", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/coupons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

// Deals
interface AdminDeal {
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post("/admin/deals", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "deals"] }),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) => {
      const { id, ...body } = data;
      return apiClient.put(`/admin/deals/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "deals"] }),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/deals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "deals"] }),
  });
}

// Reports
interface SalesReport {
  totalOrders: number;
  totalRevenue: number;
  totalTax: number;
  totalShipping: number;
  totalDiscount: number;
  avgOrderValue: number;
}

interface InventoryReport {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export function useSalesReport(startDate: string, endDate: string) {
  return useQuery<SalesReport>({
    queryKey: ["admin", "reports", "sales", startDate, endDate],
    queryFn: () => apiClient.get(`/admin/reports/sales?startDate=${startDate}&endDate=${endDate}`),
    enabled: !!startDate && !!endDate,
  });
}

export function useInventoryReport() {
  return useQuery<InventoryReport>({
    queryKey: ["admin", "reports", "inventory"],
    queryFn: () => apiClient.get("/admin/reports/inventory"),
  });
}
