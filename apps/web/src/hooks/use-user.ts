import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuthStore } from "../stores/auth-store";

interface Address {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface ProfileData {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  emailVerified: boolean;
  referralCode?: string;
  createdAt: string;
  rewards?: {
    totalPoints: number;
    availablePoints: number;
    tier: string;
    lifetimeSpend: number;
  };
}

export function useProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      apiClient.get<{ success: boolean; data: ProfileData }>("/users/profile"),
    enabled: isAuthenticated,
    select: (res) => res.data,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; phone?: string }) =>
      apiClient.put<{ success: boolean; data: any }>("/users/profile", data),
    onSuccess: (res) => {
      updateUser(res.data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiClient.put("/users/change-password", data),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to change password");
    },
  });
}

export function useAddresses() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["addresses"],
    queryFn: () =>
      apiClient.get<{ success: boolean; data: Address[] }>("/users/addresses"),
    enabled: isAuthenticated,
    select: (res) => res.data,
  });
}

export function useAddAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Address, "id" | "isDefault"> & { isDefault?: boolean }) =>
      apiClient.post("/users/addresses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address added successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to add address");
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Address> & { id: string }) =>
      apiClient.put(`/users/addresses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address updated successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to update address");
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address deleted");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to delete address");
    },
  });
}
