/**
 * GameService 6.3b integration tests — initializeMilestones, getState, getMessages (real DB)
 *
 * Covers AC #1-6 of Story 6.3b:
 *  - initializeMilestones() via LLM → validates and inserts milestones (or fallback)
 *  - getState() with 0 milestones → triggers initializeMilestones()
 *  - getState() → full GameStateDTO shape validated
 *  - getMessages(?milestoneId) → filtered or all, max 100
 *
 * Requires: jdrai-db Docker container running
 * Run via: pnpm test:integration
 */
import { and, eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import {
  adventureCharacters,
  adventures,
  characterClasses,
  messages,
  milestones,
  races,
  users,
} from "@/db/schema";

import { GameService } from "./game.service";
import { LLMService } from "./llm/index";

// ---------------------------------------------------------------------------
// Shared fixture IDs
// ---------------------------------------------------------------------------

const TEST_USER_ID = "integ-test-6-3b-user";
const OTHER_USER_ID = "integ-test-6-3b-other";
let raceId: string;
let classId: string;

// Per-test
let adventureId: string;

const gameService = new GameService();

// ---------------------------------------------------------------------------
// LLMService mock factory
// ---------------------------------------------------------------------------

function makeLLMMock(response: string) {
  return {
    generate: vi.fn().mockResolvedValue(response),
    stream: vi.fn(),
  } as unknown as LLMService;
}

// ---------------------------------------------------------------------------
// Fixture setup / teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  await db
    .insert(users)
    .values({
      id: TEST_USER_ID,
      name: "Test User (6-3b)",
      email: "integ-6-3b@test.local",
      emailVerified: false,
    })
    .onConflictDoNothing();

  await db
    .insert(users)
    .values({
      id: OTHER_USER_ID,
      name: "Other User (6-3b)",
      email: "integ-6-3b-other@test.local",
      emailVerified: false,
    })
    .onConflictDoNothing();

  const [raceRow] = await db
    .insert(races)
    .values({ name: "Humain (integ-6-3b)", isDefault: false })
    .returning({ id: races.id });
  raceId = raceRow!.id;

  const [classRow] = await db
    .insert(characterClasses)
    .values({ name: "Aventurier (integ-6-3b)", isDefault: false })
    .returning({ id: characterClasses.id });
  classId = classRow!.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, TEST_USER_ID));
  await db.delete(users).where(eq(users.id, OTHER_USER_ID));
  await db.delete(races).where(eq(races.id, raceId));
  await db.delete(characterClasses).where(eq(characterClasses.id, classId));
});

beforeEach(async () => {
  const [advRow] = await db
    .insert(adventures)
    .values({
      userId: TEST_USER_ID,
      title: "La Quête du Graal (6-3b)",
      difficulty: "normal",
      estimatedDuration: "medium",
    })
    .returning({ id: adventures.id });
  adventureId = advRow!.id;

  await db.insert(adventureCharacters).values({
    adventureId,
    raceId,
    classId,
    name: "Héros (6-3b)",
    currentHp: 20,
    maxHp: 20,
    stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
  });
});

afterEach(async () => {
  await db.delete(adventures).where(eq(adventures.id, adventureId));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Injects a mock LLM service into the GameService instance. */
function injectLLM(svc: GameService, llm: LLMService) {
  // @ts-expect-error — private field injection for testing
  svc.llmService = llm;
}

// ---------------------------------------------------------------------------
// initializeMilestones — AC #1, #2, #3
// ---------------------------------------------------------------------------

describe("initializeMilestones() — LLM success path (AC #1-3)", () => {
  it("inserts milestones with correct sortOrder and first status=active", async () => {
    const llmResponse = JSON.stringify({
      milestones: [
        { name: "L'Appel à l'Aventure", description: "Le héros reçoit une mission périlleuse." },
        { name: "La Traversée", description: "Les obstacles s'accumulent sur le chemin." },
        { name: "Le Dénouement", description: "Le climax final et la résolution de l'histoire." },
      ],
    });

    injectLLM(gameService, makeLLMMock(llmResponse));

    const [advRow] = await db
      .select()
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    const result = await gameService.initializeMilestones({
      id: adventureId,
      title: advRow!.title,
      status: "active",
      difficulty: "normal",
      estimatedDuration: "medium",
      startedAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
      currentMilestone: null,
      character: {
        id: "",
        name: "Héros",
        className: "Aventurier",
        raceName: "Humain",
        stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
        currentHp: 20,
        maxHp: 20,
      },
    });

    expect(result).toHaveLength(3);
    expect(result[0]!.status).toBe("active");
    expect(result[0]!.sortOrder).toBe(0);
    expect(result[1]!.status).toBe("pending");
    expect(result[2]!.status).toBe("pending");
    expect(result[0]!.name).toBe("L'Appel à l'Aventure");

    // Verify DB state
    const rows = await db
      .select()
      .from(milestones)
      .where(eq(milestones.adventureId, adventureId));
    expect(rows).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// initializeMilestones — AC #4 (fallback)
// ---------------------------------------------------------------------------

describe("initializeMilestones() — LLM failure fallback (AC #4)", () => {
  it("inserts 3 generic milestones when LLM throws", async () => {
    injectLLM(
      gameService,
      { generate: vi.fn().mockRejectedValue(new Error("LLM unavailable")) } as unknown as LLMService,
    );

    const [advRow] = await db
      .select()
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    const result = await gameService.initializeMilestones({
      id: adventureId,
      title: advRow!.title,
      status: "active",
      difficulty: "normal",
      estimatedDuration: "short",
      startedAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
      currentMilestone: null,
      character: {
        id: "",
        name: "Héros",
        className: "Aventurier",
        raceName: "Humain",
        stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
        currentHp: 20,
        maxHp: 20,
      },
    });

    expect(result).toHaveLength(3);
    expect(result[0]!.name).toBe("Prologue");
    expect(result[0]!.status).toBe("active");
    expect(result[1]!.name).toBe("Le Cœur de l'Aventure");
    expect(result[2]!.name).toBe("Épilogue");
  });

  it("inserts 3 generic milestones when LLM returns invalid JSON", async () => {
    injectLLM(gameService, makeLLMMock("not-valid-json{{"));

    const [advRow] = await db
      .select()
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    const result = await gameService.initializeMilestones({
      id: adventureId,
      title: advRow!.title,
      status: "active",
      difficulty: "normal",
      estimatedDuration: "short",
      startedAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
      currentMilestone: null,
      character: {
        id: "",
        name: "Héros",
        className: "Aventurier",
        raceName: "Humain",
        stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
        currentHp: 20,
        maxHp: 20,
      },
    });

    expect(result).toHaveLength(3);
    expect(result[0]!.name).toBe("Prologue");
  });

  it("inserts fallback when Zod validation fails (milestones.length < 2)", async () => {
    injectLLM(
      gameService,
      makeLLMMock(JSON.stringify({ milestones: [{ name: "Solo", description: "Seul milestone." }] })),
    );

    const [advRow] = await db
      .select()
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    const result = await gameService.initializeMilestones({
      id: adventureId,
      title: advRow!.title,
      status: "active",
      difficulty: "normal",
      estimatedDuration: "short",
      startedAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
      currentMilestone: null,
      character: {
        id: "",
        name: "Héros",
        className: "Aventurier",
        raceName: "Humain",
        stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
        currentHp: 20,
        maxHp: 20,
      },
    });

    expect(result).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// getState — AC #5
// ---------------------------------------------------------------------------

describe("getState() — AC #5", () => {
  it("triggers initializeMilestones when milestones are empty", async () => {
    const llmResponse = JSON.stringify({
      milestones: [
        { name: "Début", description: "La mise en place." },
        { name: "Développement", description: "Les enjeux." },
        { name: "Fin", description: "La résolution." },
      ],
    });
    injectLLM(gameService, makeLLMMock(llmResponse));

    const state = await gameService.getState(adventureId, TEST_USER_ID);

    expect(state.milestones).toHaveLength(3);
    expect(state.milestones[0]!.status).toBe("active");

    // Subsequent call should NOT re-initialize (milestones exist)
    const state2 = await gameService.getState(adventureId, TEST_USER_ID);
    expect(state2.milestones).toHaveLength(3);
  });

  it("returns full GameStateDTO shape", async () => {
    // Pre-seed milestones to skip LLM call
    await db.insert(milestones).values([
      { adventureId, name: "Prologue", sortOrder: 0, status: "active" },
    ]);

    const state = await gameService.getState(adventureId, TEST_USER_ID);

    expect(state.isStreaming).toBe(false);
    expect(state.adventure.id).toBe(adventureId);
    expect(state.adventure.character).toBeDefined();
    expect(state.adventure.currentMilestone).toBe("Prologue");
    expect(state.messages).toBeInstanceOf(Array);
    expect(state.milestones).toHaveLength(1);
  });

  it("returns 404 when adventure does not exist", async () => {
    await expect(gameService.getState("00000000-0000-0000-0000-000000000000", TEST_USER_ID))
      .rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });

  it("returns 403 when user does not own the adventure", async () => {
    await expect(gameService.getState(adventureId, OTHER_USER_ID))
      .rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
  });

  it("limits messages to last 50 ordered createdAt ASC", async () => {
    // Pre-seed milestones
    await db.insert(milestones).values([
      { adventureId, name: "Prologue", sortOrder: 0, status: "active" },
    ]);

    // Insert 60 messages
    for (let i = 0; i < 60; i++) {
      await db.insert(messages).values({
        adventureId,
        milestoneId: null,
        role: "user",
        content: `Message ${i}`,
        metadata: {},
      });
    }

    const state = await gameService.getState(adventureId, TEST_USER_ID);

    expect(state.messages).toHaveLength(50);
    // Ordered ASC — first message content should be lower-numbered
    const firstContent = state.messages[0]!.content;
    const lastContent = state.messages[49]!.content;
    const firstNum = parseInt(firstContent.replace("Message ", ""), 10);
    const lastNum = parseInt(lastContent.replace("Message ", ""), 10);
    expect(firstNum).toBeLessThan(lastNum);
  });
});

// ---------------------------------------------------------------------------
// getMessages — AC #6
// ---------------------------------------------------------------------------

describe("getMessages() — AC #6", () => {
  let milestoneId: string;

  beforeEach(async () => {
    const [m] = await db
      .insert(milestones)
      .values({ adventureId, name: "Prologue", sortOrder: 0, status: "active" })
      .returning({ id: milestones.id });
    milestoneId = m!.id;
  });

  it("returns all messages (no milestoneId filter), limit 100, ordered ASC", async () => {
    await db.insert(messages).values([
      { adventureId, milestoneId, role: "user", content: "Action A", metadata: {} },
      { adventureId, milestoneId: null, role: "assistant", content: "Réponse A", metadata: {} },
    ]);

    const result = await gameService.getMessages(adventureId, TEST_USER_ID);

    expect(result.total).toBe(2);
    expect(result.messages[0]!.content).toBe("Action A");
    expect(result.messages[1]!.content).toBe("Réponse A");
  });

  it("filters messages by milestoneId", async () => {
    const [m2] = await db
      .insert(milestones)
      .values({ adventureId, name: "Climax", sortOrder: 1, status: "pending" })
      .returning({ id: milestones.id });
    const milestone2Id = m2!.id;

    await db.insert(messages).values([
      { adventureId, milestoneId, role: "user", content: "Message Prologue", metadata: {} },
      { adventureId, milestoneId: milestone2Id, role: "user", content: "Message Climax", metadata: {} },
    ]);

    const result = await gameService.getMessages(adventureId, TEST_USER_ID, milestoneId);

    expect(result.total).toBe(1);
    expect(result.messages[0]!.content).toBe("Message Prologue");
    expect(result.messages[0]!.milestoneId).toBe(milestoneId);
  });

  it("limits to 100 messages maximum", async () => {
    // Insert 110 messages
    const vals = Array.from({ length: 110 }, (_, i) => ({
      adventureId,
      milestoneId: null as string | null,
      role: "user" as const,
      content: `Msg ${i}`,
      metadata: {} as Record<string, unknown>,
    }));
    await db.insert(messages).values(vals);

    const result = await gameService.getMessages(adventureId, TEST_USER_ID);

    expect(result.total).toBe(100);
    expect(result.messages).toHaveLength(100);
  });

  it("GameMessageDTO does not include metadata (D20 data excluded P1)", async () => {
    await db.insert(messages).values({
      adventureId,
      milestoneId: null,
      role: "assistant",
      content: "Texte narration",
      metadata: { roll: 15, dc: 12, bonus: 2, outcome: "success" },
    });

    const result = await gameService.getMessages(adventureId, TEST_USER_ID);

    expect(result.messages[0]).not.toHaveProperty("metadata");
    expect(result.messages[0]).toHaveProperty("id");
    expect(result.messages[0]).toHaveProperty("role");
    expect(result.messages[0]).toHaveProperty("content");
    expect(result.messages[0]).toHaveProperty("milestoneId");
    expect(result.messages[0]).toHaveProperty("createdAt");
  });

  it("returns 404 when adventure does not exist", async () => {
    await expect(
      gameService.getMessages("00000000-0000-0000-0000-000000000000", TEST_USER_ID),
    ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });

  it("returns 403 when user does not own the adventure", async () => {
    await expect(gameService.getMessages(adventureId, OTHER_USER_ID))
      .rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
  });
});
