import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  process.env["DATABASE_URL"] = "postgres://user:pass@localhost:5432/jdrai_test";
  process.env["BETTER_AUTH_SECRET"] = "x".repeat(32);
  process.env["BETTER_AUTH_URL"] = "http://localhost:3000";
  process.env["FRONTEND_URL"] = "http://localhost:5173";
  process.env["API_PORT"] = "3000";
  process.env["API_URL"] = "http://localhost:3000";
  process.env["NODE_ENV"] = "test";
});

vi.mock("better-auth/node", () => ({
  toNodeHandler: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("./routes/api.router", async () => {
  const { Router } = await import("express");
  return { apiRouter: Router() };
});

describe("health endpoints", () => {
  it("GET /health returns ok", async () => {
    const { app } = await import("./app");
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("security headers", () => {
  it("GET /health includes security headers from helmet", async () => {
    const { app } = await import("./app");
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBeDefined();
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  it("GET /health with matching Origin includes CORS headers", async () => {
    const { app } = await import("./app");
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:5173");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("GET /health does NOT set wildcard CORS origin", async () => {
    // CORS with a specific origin string always echoes that origin (browser enforces the restriction).
    // We verify it's never a wildcard * which would allow any origin.
    const { app } = await import("./app");
    const res = await request(app).get("/health");
    expect(res.headers["access-control-allow-origin"]).not.toBe("*");
  });
});
