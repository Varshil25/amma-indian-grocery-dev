import { create } from "zustand";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AdminUser, token: string, refreshToken: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const token = localStorage.getItem("admin-token");
  const refreshToken = localStorage.getItem("admin-refresh-token");
  const userStr = localStorage.getItem("admin-user");
  const user = userStr ? JSON.parse(userStr) : null;

  return {
    user,
    token,
    refreshToken,
    isAuthenticated: !!token && !!user,
    setAuth: (user, token, refreshToken) => {
      localStorage.setItem("admin-token", token);
      localStorage.setItem("admin-refresh-token", refreshToken);
      localStorage.setItem("admin-user", JSON.stringify(user));
      set({ user, token, refreshToken, isAuthenticated: true });
    },
    setTokens: (token, refreshToken) => {
      localStorage.setItem("admin-token", token);
      localStorage.setItem("admin-refresh-token", refreshToken);
      set({ token, refreshToken });
    },
    logout: () => {
      localStorage.removeItem("admin-token");
      localStorage.removeItem("admin-refresh-token");
      localStorage.removeItem("admin-user");
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    },
  };
});
