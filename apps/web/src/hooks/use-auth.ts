import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuthStore } from "../stores/auth-store";

interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatar?: string | null;
      role: string;
      referralCode?: string | null;
    };
    accessToken: string;
    refreshToken: string;
  };
}

interface MessageResponse {
  success: boolean;
  data: { message: string };
}

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiClient.post<AuthResponse>("/auth/login", data, { skipAuth: true }),
    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate("/");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Login failed");
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      referralCode?: string;
    }) => apiClient.post<AuthResponse>("/auth/register", data, { skipAuth: true }),
    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      toast.success("Account created! Welcome to Amma Indian Grocery!");
      navigate("/");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Registration failed");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () =>
      apiClient.post("/auth/logout", { refreshToken }),
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate("/login");
      toast.success("Logged out successfully");
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: { email: string }) =>
      apiClient.post<MessageResponse>("/auth/forgot-password", data, { skipAuth: true }),
    onSuccess: () => {
      toast.success("If an account exists, a reset code has been sent to your email");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Something went wrong");
    },
  });
}

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: { email: string; code: string; newPassword: string }) =>
      apiClient.post<MessageResponse>("/auth/reset-password", data, { skipAuth: true }),
    onSuccess: () => {
      toast.success("Password reset successfully! Please log in.");
      navigate("/login");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Reset failed");
    },
  });
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => apiClient.get<{ success: boolean; data: any }>("/auth/me"),
    enabled: isAuthenticated,
    select: (res) => res.data,
  });
}
