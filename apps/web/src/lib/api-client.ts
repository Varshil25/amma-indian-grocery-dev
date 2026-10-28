const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAccessToken(): string | null {
    try {
      const stored = localStorage.getItem("auth-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.state?.accessToken || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const stored = localStorage.getItem("auth-storage");
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      const refreshToken = parsed?.state?.refreshToken;
      if (!refreshToken) return null;

      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // Refresh failed — clear auth state
        localStorage.removeItem("auth-storage");
        window.location.href = `${import.meta.env.BASE_URL}login`;
        return null;
      }

      const data = await res.json();
      const newState = {
        ...parsed,
        state: {
          ...parsed.state,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          user: data.data.user,
        },
      };
      localStorage.setItem("auth-storage", JSON.stringify(newState));
      return data.data.accessToken;
    } catch {
      localStorage.removeItem("auth-storage");
      window.location.href = `${import.meta.env.BASE_URL}login`;
      return null;
    }
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { skipAuth = false, headers: customHeaders, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(customHeaders as Record<string, string>),
    };

    if (!skipAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    let res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // If 401, try token refresh once
    if (res.status === 401 && !skipAuth) {
      const newToken = await this.refreshToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(`${this.baseUrl}${endpoint}`, {
          ...fetchOptions,
          headers,
        });
      }
    }

    const data = await res.json();

    if (!res.ok) {
      throw new ApiError(data.message || "Request failed", res.status, data.details);
    }

    return data;
  }

  get<T>(endpoint: string, options?: ApiOptions) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: ApiOptions) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
