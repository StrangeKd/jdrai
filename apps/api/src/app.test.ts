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

