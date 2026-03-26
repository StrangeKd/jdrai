import { EventEmitter } from "eventemitter3";

// Prefer same-origin (/api proxied) by default. Set VITE_API_URL only for explicit cross-origin setups.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

function buildUrl(endpoint: string) {
  if (!API_BASE) return endpoint;
  return `${API_BASE}${endpoint}`;
}

function parseRetryAfterHeader(headerValue: string | null): number {
  const FALLBACK_SECONDS = 5;
  if (!headerValue) return FALLBACK_SECONDS;

  // RFC 7231 allows either delta-seconds or an HTTP-date value.
  const parsedSeconds = Number.parseInt(headerValue, 10);
  if (Number.isFinite(parsedSeconds) && parsedSeconds >= 0) {
    return parsedSeconds;
  }

  const retryAtMs = Date.parse(headerValue);
  if (Number.isNaN(retryAtMs)) {
    return FALLBACK_SECONDS;
  }

  return Math.max(0, Math.ceil((retryAtMs - Date.now()) / 1000));
}

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
  const response = await fetch(buildUrl(endpoint), {
    ...options,
    credentials: "include", // Always send session cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 429) {
    const retryAfter = parseRetryAfterHeader(response.headers.get("Retry-After"));
    rateLimitEmitter.emit("rate-limited", { retryAfter });
    throw new RateLimitError(retryAfter);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
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
