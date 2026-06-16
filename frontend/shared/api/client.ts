import { API_BASE_PATH, type ApiClientConfig } from "./config";
import { ApiError } from "./errors/api-error";
import { normalizeApiError } from "./errors/normalize-api-error";
import { tokenStore } from "@/services/auth/token-store";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

export class ApiClient {
  private readonly config: ApiClientConfig;

  constructor(config: ApiClientConfig = {}) {
    this.config = config;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const token = await this.config.getAccessToken?.();
    const headers = new Headers(options.headers);

    headers.set("Accept", "application/json");

    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let response: Response;

    try {
      response = await fetch(this.resolveUrl(path), {
        method: options.method ?? "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        cache: options.cache,
        next: options.next
      });
    } catch {
      throw new ApiError({
        message: "Network request failed",
        status: 0,
        code: "network"
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    if (!response.ok) {
      const error = await normalizeApiError(response);
      if (error.status === 401) {
        await this.config.onUnauthorized?.();
      }
      throw error;
    }

    return (await response.json()) as T;
  }

  private resolveUrl(path: string): string {
    const baseUrl = this.config.baseUrl ?? API_BASE_PATH;
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }
}

export const apiClient = new ApiClient({
  getAccessToken: () => tokenStore.getAccessToken(),
  onUnauthorized: () => {
    tokenStore.clear();
    if (typeof window !== "undefined") {
      document.cookie = "mb_auth=; path=/; max-age=0; SameSite=Lax";
      window.location.href = "/auth/login";
    }
  },
});
