const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("admin-refresh-token");
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    const { accessToken, refreshToken: newRefreshToken } = data.data;

    localStorage.setItem("admin-token", accessToken);
    localStorage.setItem("admin-refresh-token", newRefreshToken);

    // Update zustand store (import dynamically to avoid circular deps)
    const { useAuthStore } = await import("../stores/auth-store");
    useAuthStore.getState().setTokens(accessToken, newRefreshToken);

    return true;
  } catch {
    return false;
  }
}

async function refreshIfNeeded(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = tryRefreshToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

function forceLogout() {
  localStorage.removeItem("admin-token");
  localStorage.removeItem("admin-refresh-token");
  localStorage.removeItem("admin-user");
  window.location.href = `${import.meta.env.BASE_URL}login`;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("admin-token");

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  // A 401 from login itself means bad credentials, not an expired session
  if (res.status === 401 && !endpoint.startsWith("/auth/")) {
    const refreshed = await refreshIfNeeded();

    if (refreshed) {
      // Retry the original request with the new token
      const newToken = localStorage.getItem("admin-token");
      const retryRes = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(newToken && { Authorization: `Bearer ${newToken}` }),
          ...options.headers,
        },
      });

      const retryData = await retryRes.json().catch(() => null);

      if (!retryRes.ok) {
        throw new ApiError(
          retryData?.error?.message || `Request failed (${retryRes.status})`,
          retryRes.status
        );
      }

      return retryData as T;
    }

    // Refresh failed — force logout
    forceLogout();
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      data?.error?.message || (res.status === 429 ? "Too many requests — wait a moment and try again" : `Request failed (${res.status})`),
      res.status
    );
  }

  return data as T;
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
