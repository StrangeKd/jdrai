import { EventEmitter } from "eventemitter3";

const API_BASE = import.meta.env.VITE_API_URL as string;

// Emitter for rate-limiting events — consumed by game UI (Story 6.8)
export const rateLimitEmitter = new EventEmitter<{
  "rate-limited": [{ retryAfter: number }];
}>();

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class RateLimitError extends Error {
  constructor(public retryAfter: number) {
    super(`Rate limited. Retry after ${retryAfter}s`);
    this.name = "RateLimitError";
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include", // Always send session cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") ?? "5", 10);
    rateLimitEmitter.emit("rate-limited", { retryAfter });
    throw new RateLimitError(retryAfter);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as {
      error?: { code?: string; message?: string; details?: Record<string, unknown> };
    };
    throw new ApiError(
      body?.error?.code ?? "INTERNAL_ERROR",
      body?.error?.message ?? "Unknown error",
      body?.error?.details,
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: "DELETE" }),
};
