/**
 * GameController tests (Story 6.3a Task 5 — AC-8 / Story 6.3b Task 3 — AC-5,6)
 * Mocks the service layer to test HTTP routing and response formatting.
 */
import express, { type Express, type Request } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameStateDTO, MilestoneDTO, UserDTO } from "@jdrai/shared";

import { errorHandler } from "@/middleware/error.middleware";
import { AppError } from "@/utils/errors";

vi.mock("./game.service", () => ({
  gameService: {
    processAction: vi.fn(),
    getState: vi.fn(),
    getMessages: vi.fn(),
    autoSave: vi.fn(),
    saveAdventure: vi.fn(),
  },
}));

import { getMessagesHandler, getStateHandler, postActionHandler, postSaveHandler } from "./game.controller";
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
  app.get("/adventures/:id/state", getStateHandler);
  app.get("/adventures/:id/messages", getMessagesHandler);
  app.post("/adventures/:id/save", postSaveHandler);
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

// ---------------------------------------------------------------------------
// GET /adventures/:id/state (AC-5)
// ---------------------------------------------------------------------------

const MOCK_MILESTONE: MilestoneDTO = {
  id: "m-1",
  name: "Prologue",
  sortOrder: 0,
  status: "active",
};

const MOCK_GAME_STATE: GameStateDTO = {
  adventure: {
    id: "adv-1",
    title: "La Quête du Graal",
    status: "active",
    difficulty: "normal",
    estimatedDuration: "medium",
    startedAt: "2026-03-01T00:00:00.000Z",
    lastPlayedAt: "2026-03-01T00:00:00.000Z",
    currentMilestone: "Prologue",
    isGameOver: false,
    isTutorial: false,
    character: {
      id: "char-1",
      name: "Héros",
      className: "Aventurier",
      raceName: "Humain",
      stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
      currentHp: 20,
      maxHp: 20,
    },
  },
  messages: [],
  milestones: [MOCK_MILESTONE],
  isStreaming: false,
};

describe("GET /adventures/:id/state (AC-5)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("valid request → 200 with GameStateDTO", async () => {
    vi.mocked(gameService.getState).mockResolvedValueOnce(MOCK_GAME_STATE);

    const res = await request(makeApp()).get("/adventures/adv-1/state");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isStreaming).toBe(false);
    expect(res.body.data.milestones).toHaveLength(1);
    expect(gameService.getState).toHaveBeenCalledWith("adv-1", "user-1", false);
  });

  it("adventure not found → 404 NOT_FOUND", async () => {
    vi.mocked(gameService.getState).mockRejectedValueOnce(
      new AppError(404, "NOT_FOUND", "Adventure not found"),
    );

    const res = await request(makeApp()).get("/adventures/unknown/state");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("wrong owner → 403 FORBIDDEN", async () => {
    vi.mocked(gameService.getState).mockRejectedValueOnce(
      new AppError(403, "FORBIDDEN", "Not your adventure"),
    );

    const res = await request(makeApp()).get("/adventures/adv-other/state");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});

// ---------------------------------------------------------------------------
// GET /adventures/:id/messages (AC-6)
// ---------------------------------------------------------------------------

describe("GET /adventures/:id/messages (AC-6)", () => {
  // resetAllMocks clears the once queue too, preventing bleed-through between tests
  beforeEach(() => vi.resetAllMocks());

  it("no milestoneId → 200 with all messages", async () => {
    vi.mocked(gameService.getMessages).mockResolvedValueOnce({ messages: [], total: 0 });

    const res = await request(makeApp()).get("/adventures/adv-1/messages");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messages).toEqual([]);
    expect(res.body.data.total).toBe(0);
    expect(gameService.getMessages).toHaveBeenCalledWith("adv-1", "user-1", undefined);
  });

  it("with valid milestoneId → passes UUID to service", async () => {
    // Use a valid RFC 4122 UUID (version bit must be 1-5 for Zod v4 strict validation)
    const mid = "123e4567-e89b-12d3-a456-426614174000";
    vi.mocked(gameService.getMessages).mockResolvedValueOnce({ messages: [], total: 0 });

    const res = await request(makeApp()).get(`/adventures/adv-1/messages?milestoneId=${mid}`);

    expect(res.status).toBe(200);
    expect(gameService.getMessages).toHaveBeenCalledWith("adv-1", "user-1", mid);
  });

  it("invalid milestoneId (not UUID) → 400 VALIDATION_ERROR", async () => {
    const res = await request(makeApp()).get("/adventures/adv-1/messages?milestoneId=not-a-uuid");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(gameService.getMessages).not.toHaveBeenCalled();
  });

  it("adventure not found → 404 NOT_FOUND", async () => {
    vi.mocked(gameService.getMessages).mockRejectedValueOnce(
      new AppError(404, "NOT_FOUND", "Adventure not found"),
    );

    const res = await request(makeApp()).get("/adventures/unknown/messages");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("wrong owner → 403 FORBIDDEN", async () => {
    vi.mocked(gameService.getMessages).mockRejectedValueOnce(
      new AppError(403, "FORBIDDEN", "Not your adventure"),
    );

    const res = await request(makeApp()).get("/adventures/adv-other/messages");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});

// ---------------------------------------------------------------------------
// POST /adventures/:id/save (Story 6.5 AC-5)
// ---------------------------------------------------------------------------

describe("POST /adventures/:id/save (AC-5)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("active adventure + correct owner → 200 with savedAt", async () => {
    const savedAt = new Date("2026-03-01T00:00:00.000Z").toISOString();
    vi.mocked(gameService.saveAdventure).mockResolvedValueOnce({ savedAt });

    const res = await request(makeApp()).post("/adventures/adv-1/save").send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.savedAt).toBe(savedAt);
    expect(gameService.saveAdventure).toHaveBeenCalledWith("adv-1", "user-1");
  });

  it("adventure not found → 404 NOT_FOUND", async () => {
    vi.mocked(gameService.saveAdventure).mockRejectedValueOnce(
      new AppError(404, "NOT_FOUND", "Adventure not found"),
    );

    const res = await request(makeApp()).post("/adventures/unknown/save").send({});

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("wrong owner → 403 FORBIDDEN", async () => {
    vi.mocked(gameService.saveAdventure).mockRejectedValueOnce(
      new AppError(403, "FORBIDDEN", "Not your adventure"),
    );

    const res = await request(makeApp()).post("/adventures/adv-1/save").send({});

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("adventure not active → 400 ADVENTURE_NOT_ACTIVE", async () => {
    vi.mocked(gameService.saveAdventure).mockRejectedValueOnce(
      new AppError(400, "ADVENTURE_NOT_ACTIVE", "Cannot act on a completed adventure"),
    );

    const res = await request(makeApp()).post("/adventures/adv-1/save").send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("ADVENTURE_NOT_ACTIVE");
  });
});
