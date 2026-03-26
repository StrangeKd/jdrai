/**
 * Adventures controller tests — covers AC-3, AC-4, AC-5, AC-6 (Story 5.1 Task 6)
 * Mocks the service layer to test HTTP routing and response formatting in isolation.
 */
import express, { type Express, type Request } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AdventureDTO, AdventureTemplateDTO, UserDTO } from "@jdrai/shared";

import { errorHandler } from "@/middleware/error.middleware";
import { AppError } from "@/utils/errors";

// Mock the service module
vi.mock("./adventures.service", () => ({
  createAdventureForUser: vi.fn(),
  getAdventuresForUser: vi.fn(),
  getAdventureById: vi.fn(),
  getTemplates: vi.fn(),
  updateAdventureForUser: vi.fn(),
  getAdventureMilestonesForUser: vi.fn(),
}));

import {
  createAdventureHandler,
  getAdventureHandler,
  getAdventureMilestonesHandler,
  listAdventuresHandler,
  listTemplatesHandler,
  updateAdventureHandler,
} from "./adventures.controller";
import {
  createAdventureForUser,
  getAdventureById,
  getAdventureMilestonesForUser,
  getAdventuresForUser,
  getTemplates,
  updateAdventureForUser,
} from "./adventures.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER_ID = "user-1";

const MOCK_USER: UserDTO = {
  id: MOCK_USER_ID,
  email: "test@example.com",
  emailVerified: true,
  username: "ryan",
  role: "user",
  onboardingCompleted: true,
  createdAt: "2026-02-26T00:00:00.000Z",
};

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
  isGameOver: false,
};

const MOCK_TEMPLATE: AdventureTemplateDTO = {
  id: "tpl-1",
  name: "La Forêt Maudite",
  description: "Une aventure en forêt sombre",
  genre: "heroic_fantasy",
  difficulty: "normal",
  estimatedDuration: "medium",
};

// ---------------------------------------------------------------------------
// App factory — injects a mock authenticated user
// ---------------------------------------------------------------------------

function makeApp(userId: string = MOCK_USER_ID): Express {
  const app = express();
  app.use(express.json());

  // Simulate requireAuth by injecting req.user
  app.use((req: Request, _res, next) => {
    req.user = { ...MOCK_USER, id: userId };
    next();
  });

  app.post("/adventures", createAdventureHandler);
  app.get("/adventures", listAdventuresHandler);
  app.get("/adventures/:id/milestones", getAdventureMilestonesHandler);
  app.get("/adventures/:id", getAdventureHandler);
  app.patch("/adventures/:id", updateAdventureHandler);
  app.get("/templates", listTemplatesHandler);

  app.use(errorHandler);

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

  it("6.5c — ?status=abandoned passes filter to service (Story 7.1 AC #5)", async () => {
    vi.mocked(getAdventuresForUser).mockResolvedValueOnce([]);

    await request(makeApp()).get("/adventures?status=abandoned");
    expect(getAdventuresForUser).toHaveBeenCalledWith(MOCK_USER_ID, "abandoned");
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

describe("PATCH /adventures/:id (AC-5 Story 5.2)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("valid { status: 'abandoned' } → 200 with updated AdventureDTO", async () => {
    const abandoned = { ...MOCK_ADVENTURE, status: "abandoned" as const };
    vi.mocked(updateAdventureForUser).mockResolvedValueOnce(abandoned);

    const res = await request(makeApp())
      .patch("/adventures/adv-1")
      .send({ status: "abandoned" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("abandoned");
    expect(updateAdventureForUser).toHaveBeenCalledWith(MOCK_USER_ID, "adv-1", "abandoned");
  });

  it("invalid status value → 400 VALIDATION_ERROR", async () => {
    const res = await request(makeApp())
      .patch("/adventures/adv-1")
      .send({ status: "paused" }); // "paused" is not a valid status

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(updateAdventureForUser).not.toHaveBeenCalled();
  });

  it("adventure not found → 404 NOT_FOUND", async () => {
    vi.mocked(updateAdventureForUser).mockRejectedValueOnce(
      new AppError(404, "NOT_FOUND", "Adventure not found"),
    );

    const res = await request(makeApp())
      .patch("/adventures/adv-unknown")
      .send({ status: "abandoned" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("missing status body → 400 VALIDATION_ERROR", async () => {
    const res = await request(makeApp()).patch("/adventures/adv-1").send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ---------------------------------------------------------------------------
// Story 7.1 — PATCH /adventures/:id — transition validation (AC #1)
// ---------------------------------------------------------------------------

import type { MilestoneDTO } from "@jdrai/shared";

describe("PATCH /adventures/:id (Story 7.1 AC #1)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("{ status: 'abandoned' } → 200 with updated DTO (AC #1)", async () => {
    const abandoned: AdventureDTO = { ...MOCK_ADVENTURE, status: "abandoned" };
    vi.mocked(updateAdventureForUser).mockResolvedValueOnce(abandoned);

    const res = await request(makeApp())
      .patch("/adventures/adv-1")
      .send({ status: "abandoned" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("abandoned");
    expect(updateAdventureForUser).toHaveBeenCalledWith(MOCK_USER_ID, "adv-1", "abandoned");
  });

  it("{ status: 'completed' } → 200 with completedAt set (AC #1)", async () => {
    const completed: AdventureDTO = { ...MOCK_ADVENTURE, status: "completed" };
    vi.mocked(updateAdventureForUser).mockResolvedValueOnce(completed);

    const res = await request(makeApp())
      .patch("/adventures/adv-1")
      .send({ status: "completed" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("completed");
    expect(updateAdventureForUser).toHaveBeenCalledWith(MOCK_USER_ID, "adv-1", "completed");
  });

  it("already-completed adventure → 400 INVALID_TRANSITION (AC #1)", async () => {
    vi.mocked(updateAdventureForUser).mockRejectedValueOnce(
      new AppError(400, "INVALID_TRANSITION", 'Cannot transition from "completed" to "abandoned"'),
    );

    const res = await request(makeApp())
      .patch("/adventures/adv-completed")
      .send({ status: "abandoned" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_TRANSITION");
  });

  it("another user's adventure → 404 NOT_FOUND (AC #1)", async () => {
    vi.mocked(updateAdventureForUser).mockRejectedValueOnce(
      new AppError(404, "NOT_FOUND", "Adventure not found"),
    );

    const res = await request(makeApp())
      .patch("/adventures/adv-other")
      .send({ status: "abandoned" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("invalid body → 400 VALIDATION_ERROR (AC #1)", async () => {
    const res = await request(makeApp())
      .patch("/adventures/adv-1")
      .send({ status: "active" }); // "active" not a valid target

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(updateAdventureForUser).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Story 7.1 — GET /adventures/:id/milestones (AC #4)
// ---------------------------------------------------------------------------

describe("GET /adventures/:id/milestones (Story 7.1 AC #4)", () => {
  beforeEach(() => vi.clearAllMocks());

  const MOCK_MILESTONES: MilestoneDTO[] = [
    { id: "m-1", name: "Prologue", sortOrder: 0, status: "completed" },
    { id: "m-2", name: "Acte I", sortOrder: 1, status: "active" },
    { id: "m-3", name: "Épilogue", sortOrder: 2, status: "pending" },
  ];

  it("returns MilestoneDTO[] ordered by sortOrder (AC #4)", async () => {
    vi.mocked(getAdventureMilestonesForUser).mockResolvedValueOnce(MOCK_MILESTONES);

    const res = await request(makeApp()).get("/adventures/adv-1/milestones");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].sortOrder).toBe(0);
    expect(res.body.data[1].sortOrder).toBe(1);
    expect(getAdventureMilestonesForUser).toHaveBeenCalledWith(MOCK_USER_ID, "adv-1");
  });

  it("another user's adventure → 404 NOT_FOUND (AC #4)", async () => {
    vi.mocked(getAdventureMilestonesForUser).mockRejectedValueOnce(
      new AppError(404, "NOT_FOUND", "Adventure not found"),
    );

    const res = await request(makeApp()).get("/adventures/adv-other/milestones");

    expect(res.status).toBe(404);
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
