import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { authRateLimit } from "./rate-limit.middleware";

function createTestApp() {
  const app = express();
  app.post("/test", authRateLimit, (_req, res) => {
    res.status(200).json({ success: true });
  });
  return app;
}

describe("authRateLimit", () => {
  it("allows requests under the limit", async () => {
    const app = createTestApp();
    const res = await request(app).post("/test");
    expect(res.status).toBe(200);
  });

  it("returns 429 after exceeding 10 requests from same IP", async () => {
    const app = createTestApp();

    for (let i = 0; i < 10; i++) {
      await request(app).post("/test");
    }

    const res = await request(app).post("/test");
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("RATE_LIMITED");
    expect(res.body.error.timestamp).toBeDefined();
  });

  it("429 response includes Retry-After and RateLimit standard headers", async () => {
    const app = createTestApp();

    for (let i = 0; i < 10; i++) {
      await request(app).post("/test");
    }

    const res = await request(app).post("/test");
    expect(res.status).toBe(429);
    // With standardHeaders enabled, express-rate-limit sends IETF RateLimit-* headers (draft-6)
    // and sets Retry-After on blocked requests.
    expect(res.headers["retry-after"]).toBeDefined();
    expect(res.headers["ratelimit-limit"]).toBeDefined();
    expect(res.headers["ratelimit-policy"]).toBeDefined();
  });
});
