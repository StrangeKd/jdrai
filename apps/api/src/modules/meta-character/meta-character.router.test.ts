import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { errorHandler } from "@/middleware/error.middleware";
import { AppError } from "@/utils/errors";

vi.mock("./meta-character.service", () => ({
  metaCharacterService: {
    getByUserId: vi.fn(),
  },
}));

import { metaCharacterRouter } from "./meta-character.router";
import { metaCharacterService } from "./meta-character.service";

describe("GET /api/v1/meta-character auth guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeApp() {
    const app = express();

    const fakeRequireAuth: express.RequestHandler = (req, _res, next) => {
      if (req.headers.authorization !== "Bearer test-token") {
        return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
      }
      req.user = {
        id: "user-1",
        email: "user-1@test.local",
        emailVerified: true,
        username: "user1",
        role: "user",
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
      };
      next();
    };

    app.use("/api/v1/meta-character", fakeRequireAuth, metaCharacterRouter);
    app.use(errorHandler);

    return app;
  }

  it("returns 401 when unauthenticated", async () => {
    const app = makeApp();

    const res = await request(app).get("/api/v1/meta-character");

    expect(res.status).toBe(401);
    expect(vi.mocked(metaCharacterService.getByUserId)).not.toHaveBeenCalled();
  });

  it("returns 200 when authenticated", async () => {
    vi.mocked(metaCharacterService.getByUserId).mockResolvedValueOnce(null);
    const app = makeApp();

    const res = await request(app)
      .get("/api/v1/meta-character")
      .set("authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: null });
  });
});
