import { afterEach, describe, expect, it, vi } from "vitest";

// Must mock the module to inject VITE_API_URL before module evaluation
vi.mock("@/services/api", async (importOriginal) => {
  // Patch import.meta.env before module runs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).env = { ...import.meta.env, VITE_API_URL: "http://localhost:3000" };
  return importOriginal<typeof import("@/services/api")>();
});

import { api, ApiError, rateLimitEmitter,RateLimitError } from "@/services/api";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (key: string) => headers[key.toLowerCase()] ?? null },
    json: () => Promise.resolve(body),
  };
}

describe("api service", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("api.get calls fetch with credentials:include", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { data: "ok" }));
    await api.get("/api/v1/test");
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.credentials).toBe("include");
  });

  it("api.get constructs URL from API_BASE + endpoint", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { data: "ok" }));
    await api.get("/api/v1/test");
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/test");
  });

  it("api.post calls fetch with POST method and JSON body", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { data: "ok" }));
    await api.post("/api/v1/test", { foo: "bar" });
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ foo: "bar" }));
  });

  it("returns 429 as RateLimitError with correct retryAfter", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(429, {}, { "retry-after": "30" }));
    try {
      await api.get("/test");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      expect((err as RateLimitError).retryAfter).toBe(30);
    }
  });

  it("429 emits rate-limited event on rateLimitEmitter", async () => {
    const listener = vi.fn();
    rateLimitEmitter.on("rate-limited", listener);

    mockFetch.mockResolvedValueOnce(makeResponse(429, {}, { "retry-after": "15" }));
    await api.get("/test").catch(() => {});

    expect(listener).toHaveBeenCalledWith({ retryAfter: 15 });
    rateLimitEmitter.off("rate-limited", listener);
  });

  it("non-429 HTTP errors throw ApiError with code from body", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(401, { error: { code: "UNAUTHORIZED", message: "Not authenticated" } }),
    );
    try {
      await api.get("/test");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe("UNAUTHORIZED");
    }
  });

  it("ApiError falls back to INTERNAL_ERROR when body is unparseable", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 500,
      ok: false,
      headers: { get: () => null },
      json: () => Promise.reject(new Error("parse error")),
    });
    try {
      await api.get("/test");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe("INTERNAL_ERROR");
    }
  });
});
