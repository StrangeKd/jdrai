/**
 * Adventures controller tests — covers AC-3, AC-4, AC-5, AC-6 (Story 5.1 Task 6)
 * Mocks the service layer to test HTTP routing and response formatting in isolation.
 */
import express, { type Express } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/utils/errors";

import type { AdventureDTO, AdventureTemplateDTO } from "@jdrai/shared";

// Mock the service module
vi.mock("./adventures.service", () => ({
  createAdventureForUser: vi.fn(),
  getAdventuresForUser: vi.fn(),
  getAdventureById: vi.fn(),
  getTemplates: vi.fn(),
}));

import {
  createAdventureForUser,
  getAdventureById,
  getAdventuresForUser,
  getTemplates,
} from "./adventures.service";
import {
  createAdventureHandler,
  getAdventureHandler,
  listAdventuresHandler,
  listTemplatesHandler,
} from "./adventures.controller";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER_ID = "user-1";

const MOCK_CHARACTER: AdventureDTO["character"] = {
  id: "char-1",
  name: "Aventurier",
  className: "Aventurier",
  raceName: "Humain",
  stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
  currentHp: 20,
  maxHp: 20,
};

const MOCK_ADVENTURE: AdventureDTO = {
  id: "adv-1",
  title: "Aventure sans nom",
  status: "active",
  difficulty: "normal",
  estimatedDuration: "medium",
  startedAt: "2026-02-26T00:00:00.000Z",
  lastPlayedAt: "2026-02-26T00:00:00.000Z",
  character: MOCK_CHARACTER,
};

const MOCK_TEMPLATE: AdventureTemplateDTO = {
  id: "tpl-1",
  name: "La Forêt Maudite",
  description: "Une aventure en forêt sombre",
  genre: "heroic_fantasy",
  estimatedDuration: "medium",
};

// ---------------------------------------------------------------------------
// App factory — injects a mock authenticated user
// ---------------------------------------------------------------------------

function makeApp(userId: string = MOCK_USER_ID): Express {
  const app = express();
  app.use(express.json());

  // Simulate requireAuth by injecting req.user
  app.use((req, _res, next) => {
    // biome-ignore lint/suspicious/noExplicitAny: test helper
    (req as any).user = { id: userId };
    next();
  });

  app.post("/adventures", createAdventureHandler);
  app.get("/adventures", listAdventuresHandler);
  app.get("/adventures/:id", getAdventureHandler);
  app.get("/templates", listTemplatesHandler);

  // Simple error handler matching the real one
  // biome-ignore lint/suspicious/noExplicitAny: test helper
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.code, message: err.message, timestamp: new Date().toISOString() },
      });
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR" } });
  });

  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /adventures (AC-3)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("6.1 — valid body → 201 with AdventureDTO and auto-created character (AC-3)", async () => {
    vi.mocked(createAdventureForUser).mockResolvedValueOnce(MOCK_ADVENTURE);

    const res = await request(makeApp())
      .post("/adventures")
      .send({ difficulty: "normal", estimatedDuration: "medium" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("adv-1");
    expect(res.body.data.character.className).toBe("Aventurier");
    expect(res.body.data.character.raceName).toBe("Humain");
    expect(createAdventureForUser).toHaveBeenCalledWith(MOCK_USER_ID, {
      difficulty: "normal",
      estimatedDuration: "medium",
    });
  });

  it("6.2 — 5 active adventures → 409 MAX_ACTIVE_ADVENTURES (AC-3)", async () => {
    vi.mocked(createAdventureForUser).mockRejectedValueOnce(
      new AppError(409, "MAX_ACTIVE_ADVENTURES", "Maximum active adventures reached"),
    );

    const res = await request(makeApp())
      .post("/adventures")
      .send({ difficulty: "normal", estimatedDuration: "medium" });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MAX_ACTIVE_ADVENTURES");
  });

  it("6.3 — missing difficulty → 400 VALIDATION_ERROR (AC-3)", async () => {
    const res = await request(makeApp())
      .post("/adventures")
      .send({ estimatedDuration: "medium" }); // missing difficulty

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(createAdventureForUser).not.toHaveBeenCalled();
  });

  it("6.3b — invalid difficulty value → 400 VALIDATION_ERROR (AC-3)", async () => {
    const res = await request(makeApp())
      .post("/adventures")
      .send({ difficulty: "godmode", estimatedDuration: "medium" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("6.3c — missing estimatedDuration → 400 VALIDATION_ERROR (AC-3)", async () => {
    const res = await request(makeApp())
      .post("/adventures")
      .send({ difficulty: "normal" }); // missing estimatedDuration

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /adventures (AC-4)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("6.4 — returns list ordered by lastPlayedAt DESC with currentMilestone (AC-4)", async () => {
    const adventures = [
      { ...MOCK_ADVENTURE, id: "adv-2", currentMilestone: "L'Entrée de la Forêt" },
      { ...MOCK_ADVENTURE, id: "adv-1" },
    ];
    vi.mocked(getAdventuresForUser).mockResolvedValueOnce(adventures);

    const res = await request(makeApp()).get("/adventures");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].id).toBe("adv-2");
    expect(res.body.data[0].currentMilestone).toBe("L'Entrée de la Forêt");
    expect(getAdventuresForUser).toHaveBeenCalledWith(MOCK_USER_ID, undefined);
  });

  it("6.5 — ?status=active passes filter to service (AC-4)", async () => {
    vi.mocked(getAdventuresForUser).mockResolvedValueOnce([MOCK_ADVENTURE]);

    const res = await request(makeApp()).get("/adventures?status=active");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(getAdventuresForUser).toHaveBeenCalledWith(MOCK_USER_ID, "active");
  });

  it("6.5b — ?status=completed passes filter to service (AC-4)", async () => {
    vi.mocked(getAdventuresForUser).mockResolvedValueOnce([]);

    await request(makeApp()).get("/adventures?status=completed");
    expect(getAdventuresForUser).toHaveBeenCalledWith(MOCK_USER_ID, "completed");
  });
});

describe("GET /adventures/:id (AC-5)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("6.6 — returns correct AdventureDTO with character and currentMilestone (AC-5)", async () => {
    const adventure = { ...MOCK_ADVENTURE, currentMilestone: "Chapitre 1" };
    vi.mocked(getAdventureById).mockResolvedValueOnce(adventure);

    const res = await request(makeApp()).get("/adventures/adv-1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("adv-1");
    expect(res.body.data.currentMilestone).toBe("Chapitre 1");
    expect(res.body.data.character.className).toBe("Aventurier");
    expect(getAdventureById).toHaveBeenCalledWith("adv-1", MOCK_USER_ID);
  });

  it("6.7 — other user's adventure → 404 NOT_FOUND (AC-5)", async () => {
    vi.mocked(getAdventureById).mockRejectedValueOnce(
      new AppError(404, "NOT_FOUND", "Adventure not found"),
    );

    const res = await request(makeApp()).get("/adventures/adv-other");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("GET /templates (AC-6)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("6.8 — returns seeded templates without auth (AC-6)", async () => {
    vi.mocked(getTemplates).mockResolvedValueOnce([MOCK_TEMPLATE]);

    const res = await request(makeApp()).get("/templates");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe("tpl-1");
    expect(res.body.data[0].genre).toBe("heroic_fantasy");
    // systemPrompt must NOT be in the response
    expect(res.body.data[0].systemPrompt).toBeUndefined();
  });
});
