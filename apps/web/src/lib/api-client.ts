import { useAuthStore } from "../stores/auth-store";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private refreshing: Promise<string | null> | null = null;

  private getAccessToken(): string | null {
    return useAuthStore.getState().accessToken;
  }

  /**
   * One refresh at a time. The server rotates refresh tokens, so when several requests hit an
   * expired session together, separate refreshes would all present the same token and every one
   * after the first would be rejected — signing the shopper out.
   */
  private refreshAccessToken(): Promise<string | null> {
    if (!this.refreshing) {
      this.refreshing = this.doRefresh().finally(() => {
        this.refreshing = null;
      });
    }
    return this.refreshing;
  }

  private async doRefresh(): Promise<string | null> {
    const used = useAuthStore.getState().refreshToken;
    if (!used) return null;

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: used }),
      });
    } catch {
      return null; // offline: keep the session; the request reports the connection problem
    }

    if (res.ok) {
      const { data } = await res.json();
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken, data.user);
      return data.accessToken;
    }

    // Another tab may have refreshed first, rotating the token we sent — use its tokens
    await useAuthStore.persist.rehydrate();
    const latest = useAuthStore.getState();
    if (latest.refreshToken && latest.refreshToken !== used && latest.accessToken) return latest.accessToken;

    // The session really ended (expired, revoked, account blocked)
    latest.logout();
    window.location.href = `${import.meta.env.BASE_URL}login`;
    return null;
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

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
      });
    } catch {
      throw new ApiError("Can't reach the store right now. Check your connection and try again.", 0);
    }

    // Expired session: refresh once and retry. If another request already refreshed while
    // this one was in flight, just retry with the new token.
    const sentToken = headers["Authorization"]?.slice(7);
    if (res.status === 401 && !skipAuth && sentToken) {
      const current = this.getAccessToken();
      const newToken = current && current !== sentToken ? current : await this.refreshAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(`${this.baseUrl}${endpoint}`, {
          ...fetchOptions,
          headers,
        });
      }
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        (res.status === 429 ? "Too many requests — please wait a moment and try again" : `Request failed (${res.status})`);
      throw new ApiError(message, res.status, data?.error?.details ?? data?.details);
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
