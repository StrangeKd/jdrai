/**
 * GameController tests (Story 6.3a Task 5 — AC-8)
 * Mocks the service layer to test HTTP routing and response formatting.
 */
import express, { type Express, type Request } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserDTO } from "@jdrai/shared";

import { errorHandler } from "@/middleware/error.middleware";
import { AppError } from "@/utils/errors";

vi.mock("./game.service", () => ({
  gameService: {
    processAction: vi.fn(),
  },
}));

import { postActionHandler } from "./game.controller";
import { gameService } from "./game.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER: UserDTO = {
  id: "user-1",
  email: "test@example.com",
  emailVerified: true,
  username: "ryan",
  role: "user",
  onboardingCompleted: true,
  createdAt: "2026-03-01T00:00:00.000Z",
};

function makeApp(): Express {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res, next) => {
    req.user = MOCK_USER;
    next();
  });
  app.post("/adventures/:id/action", postActionHandler);
  app.use(errorHandler);
  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /adventures/:id/action (AC-8)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("valid action → 200 with messageId", async () => {
    vi.mocked(gameService.processAction).mockResolvedValueOnce({ messageId: "msg-abc" });

    const res = await request(makeApp())
      .post("/adventures/adv-1/action")
      .send({ action: "Je cherche des indices dans la pièce." });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messageId).toBe("msg-abc");
    expect(gameService.processAction).toHaveBeenCalledWith(
      expect.objectContaining({
        adventureId: "adv-1",
        userId: "user-1",
        action: "Je cherche des indices dans la pièce.",
      }),
    );
  });

  it("missing action → 400 VALIDATION_ERROR", async () => {
    const res = await request(makeApp())
      .post("/adventures/adv-1/action")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(gameService.processAction).not.toHaveBeenCalled();
  });

  it("empty action string → 400 VALIDATION_ERROR", async () => {
    const res = await request(makeApp())
      .post("/adventures/adv-1/action")
      .send({ action: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("action > 2000 chars → 400 VALIDATION_ERROR", async () => {
    const res = await request(makeApp())
      .post("/adventures/adv-1/action")
      .send({ action: "a".repeat(2001) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("adventure not found → 404 NOT_FOUND", async () => {
    vi.mocked(gameService.processAction).mockRejectedValueOnce(
      new AppError(404, "NOT_FOUND", "Adventure not found"),
    );

    const res = await request(makeApp())
      .post("/adventures/unknown/action")
      .send({ action: "Je regarde." });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("wrong owner → 403 FORBIDDEN", async () => {
    vi.mocked(gameService.processAction).mockRejectedValueOnce(
      new AppError(403, "FORBIDDEN", "Not your adventure"),
    );

    const res = await request(makeApp())
      .post("/adventures/adv-other/action")
      .send({ action: "Je regarde." });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("completed adventure → 400 ADVENTURE_NOT_ACTIVE", async () => {
    vi.mocked(gameService.processAction).mockRejectedValueOnce(
      new AppError(400, "ADVENTURE_NOT_ACTIVE", "Cannot act on a completed adventure"),
    );

    const res = await request(makeApp())
      .post("/adventures/adv-done/action")
      .send({ action: "Je regarde." });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("ADVENTURE_NOT_ACTIVE");
  });

  it("LLM failure → 503 LLM_ERROR", async () => {
    vi.mocked(gameService.processAction).mockRejectedValueOnce(
      new AppError(503, "LLM_ERROR", "LLM provider failed after retries"),
    );

    const res = await request(makeApp())
      .post("/adventures/adv-1/action")
      .send({ action: "Je regarde." });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("LLM_ERROR");
  });

  it("passes optional choiceId to processAction", async () => {
    vi.mocked(gameService.processAction).mockResolvedValue({ messageId: "msg-xyz" });

    await request(makeApp())
      .post("/adventures/adv-1/action")
      .send({ action: "Attaquer", choiceId: "choice-123" });

    expect(gameService.processAction).toHaveBeenCalledWith(
      expect.objectContaining({ choiceId: "choice-123" }),
    );
  });
});
