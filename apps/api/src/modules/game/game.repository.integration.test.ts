/**
 * game.repository integration tests (Story 6.3a Task 5 — real DB)
 *
 * Covers:
 *  - updateCharacterHp: clamp ≥ 0, clamp ≤ maxHp, normal delta
 *  - transitionMilestone: atomicity — completed + next activated in one tx
 *  - insertMessage: row persisted with correct fields
 *  - completeAdventure: status → "completed", isGameOver flag written to state
 *
 * Requires: jdrai-db Docker container running
 * Run via: pnpm test:integration
 */
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
import { AppError } from "@/utils/errors";

import {
  completeAdventure,
  getAdventureById,
  getAdventureByIdOrThrow,
  getAdventureCharacter,
  getMessages,
  getMilestones,
  getRecentMessages,
  insertMessage,
  transitionMilestone,
  updateCharacterHp,
  verifyAdventureOwnership,
} from "./game.repository";

// ---------------------------------------------------------------------------
// Shared fixture IDs (stable across all tests in this file)
// ---------------------------------------------------------------------------

const TEST_USER_ID = "integ-test-game-repo-user";
let raceId: string;
let classId: string;

// Per-test fixtures (recreated each test via beforeEach)
let adventureId: string;
let characterId: string;
let milestone1Id: string;
let milestone2Id: string;
let milestone3Id: string;

// ---------------------------------------------------------------------------
// Fixture setup / teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Insert a stable user (text PK — Better Auth style)
  await db.insert(users).values({
    id: TEST_USER_ID,
    name: "Test User (game.repository integration)",
    email: "integ-game-repo@test.local",
    emailVerified: false,
  }).onConflictDoNothing();

  // Insert race + class (uuid PKs auto-generated)
  const [raceRow] = await db
    .insert(races)
    .values({ name: "Humain (integ-game-repo)", isDefault: false })
    .returning({ id: races.id });
  raceId = raceRow!.id;

  const [classRow] = await db
    .insert(characterClasses)
    .values({ name: "Aventurier (integ-game-repo)", isDefault: false })
    .returning({ id: characterClasses.id });
  classId = classRow!.id;
});

afterAll(async () => {
  // Cascade via userId deletes all adventures; clean up shared fixtures
  await db.delete(users).where(eq(users.id, TEST_USER_ID));
  await db.delete(races).where(eq(races.id, raceId));
  await db.delete(characterClasses).where(eq(characterClasses.id, classId));
});

beforeEach(async () => {
  // Fresh adventure per test
  const [advRow] = await db
    .insert(adventures)
    .values({
      userId: TEST_USER_ID,
      title: "Aventure intégration",
      difficulty: "normal",
      estimatedDuration: "short",
    })
    .returning({ id: adventures.id });
  adventureId = advRow!.id;

  // Character starting at 20/20 HP
  const [charRow] = await db
    .insert(adventureCharacters)
    .values({
      adventureId,
      raceId,
      classId,
      name: "Héros Test",
      currentHp: 20,
      maxHp: 20,
      stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
    })
    .returning({ id: adventureCharacters.id });
  characterId = charRow!.id;

  // 3 milestones: M1=active, M2=pending, M3=pending
  const [m1, m2, m3] = await db
    .insert(milestones)
    .values([
      { adventureId, name: "Acte I", sortOrder: 1, status: "active" },
      { adventureId, name: "Acte II", sortOrder: 2, status: "pending" },
      { adventureId, name: "Acte III", sortOrder: 3, status: "pending" },
    ])
    .returning({ id: milestones.id });
  milestone1Id = m1!.id;
  milestone2Id = m2!.id;
  milestone3Id = m3!.id;
});

afterEach(async () => {
  // Cascade: deleting adventure removes characters, milestones, messages
  await db.delete(adventures).where(eq(adventures.id, adventureId));
});

// ---------------------------------------------------------------------------
// updateCharacterHp — HP clamp
// ---------------------------------------------------------------------------

describe("updateCharacterHp()", () => {
  it("applies a negative delta correctly (20 - 5 = 15)", async () => {
    const { currentHp, maxHp } = await updateCharacterHp(adventureId, -5);
    expect(currentHp).toBe(15);
    expect(maxHp).toBe(20);
  });

  it("clamps at 0 when damage exceeds current HP (20 - 100 → 0)", async () => {
    const { currentHp } = await updateCharacterHp(adventureId, -100);
    expect(currentHp).toBe(0);
  });

  it("clamps at maxHp when heal exceeds remaining HP (20/20 + 5 → 20)", async () => {
    const { currentHp, maxHp } = await updateCharacterHp(adventureId, 5);
    expect(currentHp).toBe(maxHp);
    expect(currentHp).toBe(20);
  });

  it("applies a positive delta when there is room (15/20 + 3 → 18)", async () => {
    // First drop HP to 15
    await updateCharacterHp(adventureId, -5);
    const { currentHp } = await updateCharacterHp(adventureId, 3);
    expect(currentHp).toBe(18);
  });

  it("persists the updated value in DB", async () => {
    await updateCharacterHp(adventureId, -7);

    const [row] = await db
      .select({ currentHp: adventureCharacters.currentHp })
      .from(adventureCharacters)
      .where(eq(adventureCharacters.id, characterId))
      .limit(1);

    expect(row!.currentHp).toBe(13);
  });
});

// ---------------------------------------------------------------------------
// transitionMilestone — atomicity + status transitions
// ---------------------------------------------------------------------------

describe("transitionMilestone()", () => {
  it("marks completed milestone as 'completed' and sets completedAt", async () => {
    await transitionMilestone(milestone1Id, milestone2Id);

    const [row] = await db
      .select({ status: milestones.status, completedAt: milestones.completedAt })
      .from(milestones)
      .where(eq(milestones.id, milestone1Id))
      .limit(1);

    expect(row!.status).toBe("completed");
    expect(row!.completedAt).not.toBeNull();
  });

  it("activates the next milestone and sets startedAt", async () => {
    await transitionMilestone(milestone1Id, milestone2Id);

    const [row] = await db
      .select({ status: milestones.status, startedAt: milestones.startedAt })
      .from(milestones)
      .where(eq(milestones.id, milestone2Id))
      .limit(1);

    expect(row!.status).toBe("active");
    expect(row!.startedAt).not.toBeNull();
  });

  it("does not affect an uninvolved milestone", async () => {
    await transitionMilestone(milestone1Id, milestone2Id);

    const [row] = await db
      .select({ status: milestones.status })
      .from(milestones)
      .where(eq(milestones.id, milestone3Id))
      .limit(1);

    expect(row!.status).toBe("pending");
  });

  it("completes without error when no nextId is provided (last milestone)", async () => {
    await expect(transitionMilestone(milestone1Id)).resolves.toBeUndefined();

    const [row] = await db
      .select({ status: milestones.status })
      .from(milestones)
      .where(eq(milestones.id, milestone1Id))
      .limit(1);

    expect(row!.status).toBe("completed");
  });

  it("getMilestones reflects the new statuses after transition", async () => {
    await transitionMilestone(milestone1Id, milestone2Id);

    const all = await getMilestones(adventureId);
    const m1 = all.find((m) => m.id === milestone1Id);
    const m2 = all.find((m) => m.id === milestone2Id);

    expect(m1!.status).toBe("completed");
    expect(m2!.status).toBe("active");
  });
});

// ---------------------------------------------------------------------------
// insertMessage
// ---------------------------------------------------------------------------

describe("insertMessage()", () => {
  it("inserts a user message and returns a valid UUID", async () => {
    const id = await insertMessage({
      adventureId,
      milestoneId: milestone1Id,
      role: "user",
      content: "Je franchis la porte.",
    });

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("persists content and role in DB", async () => {
    const id = await insertMessage({
      adventureId,
      milestoneId: null,
      role: "assistant",
      content: "La porte grince et s'ouvre lentement.",
    });

    const [row] = await db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.id, id))
      .limit(1);

    expect(row!.role).toBe("assistant");
    expect(row!.content).toBe("La porte grince et s'ouvre lentement.");
  });
});

// ---------------------------------------------------------------------------
// completeAdventure — status + isGameOver flag
// ---------------------------------------------------------------------------

describe("completeAdventure()", () => {
  it("sets adventure status to 'completed'", async () => {
    await completeAdventure(adventureId, false);

    const [row] = await db
      .select({ status: adventures.status, completedAt: adventures.completedAt })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    expect(row!.status).toBe("completed");
    expect(row!.completedAt).not.toBeNull();
  });

  it("writes isGameOver=false into state.completion for a normal victory", async () => {
    await completeAdventure(adventureId, false);

    const [row] = await db
      .select({ state: adventures.state })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    const state = row!.state as { completion?: { isGameOver: boolean } };
    expect(state.completion?.isGameOver).toBe(false);
  });

  it("writes isGameOver=true into state.completion for a game over", async () => {
    await completeAdventure(adventureId, true);

    const [row] = await db
      .select({ state: adventures.state })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    const state = row!.state as { completion?: { isGameOver: boolean } };
    expect(state.completion?.isGameOver).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Group C / Phase 3 — adventure / character / messages reads + ownership
// ---------------------------------------------------------------------------

describe("getAdventureById()", () => {
  it("returns the adventure row when it exists", async () => {
    const row = await getAdventureById(adventureId);
    expect(row).not.toBeNull();
    expect(row!.id).toBe(adventureId);
  });

  it("returns null for a missing id", async () => {
    const row = await getAdventureById("00000000-0000-0000-0000-000000000000");
    expect(row).toBeNull();
  });
});

describe("getAdventureByIdOrThrow()", () => {
  it("returns the adventure when owned by the user", async () => {
    const row = await getAdventureByIdOrThrow(adventureId, TEST_USER_ID);
    expect(row.id).toBe(adventureId);
  });

  it("throws 404 NOT_FOUND when the adventure does not exist", async () => {
    await expect(
      getAdventureByIdOrThrow("00000000-0000-0000-0000-000000000000", TEST_USER_ID),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    } satisfies Partial<AppError>);
  });

  it("throws 403 FORBIDDEN when the adventure is owned by another user", async () => {
    await expect(
      getAdventureByIdOrThrow(adventureId, "some-other-user"),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    } satisfies Partial<AppError>);
  });
});

describe("verifyAdventureOwnership()", () => {
  it("returns true when the user owns the adventure", async () => {
    expect(await verifyAdventureOwnership(adventureId, TEST_USER_ID)).toBe(true);
  });

  it("returns false for a different user", async () => {
    expect(await verifyAdventureOwnership(adventureId, "another-user")).toBe(false);
  });

  it("returns false for an unknown adventure id", async () => {
    expect(
      await verifyAdventureOwnership("00000000-0000-0000-0000-000000000000", TEST_USER_ID),
    ).toBe(false);
  });
});

describe("getAdventureCharacter()", () => {
  it("returns the character row for the given adventure", async () => {
    const row = await getAdventureCharacter(adventureId);
    expect(row).not.toBeNull();
    expect(row!.id).toBe(characterId);
  });

  it("returns null when no character exists for the adventure", async () => {
    // Empty adventure (no character)
    const [bareAdv] = await db
      .insert(adventures)
      .values({
        userId: TEST_USER_ID,
        title: "Bare adventure",
        difficulty: "normal",
        estimatedDuration: "short",
      })
      .returning({ id: adventures.id });

    const row = await getAdventureCharacter(bareAdv!.id);
    expect(row).toBeNull();

    await db.delete(adventures).where(eq(adventures.id, bareAdv!.id));
  });
});

describe("getMessages() / getRecentMessages()", () => {
  beforeEach(async () => {
    // Seed 5 messages with predictable content + small async gaps so createdAt is monotonic
    for (let i = 0; i < 5; i++) {
      await insertMessage({
        adventureId,
        milestoneId: milestone1Id,
        role: i % 2 === 0 ? "user" : "assistant",
        content: `msg-${i}`,
      });
      await new Promise((r) => setTimeout(r, 5));
    }
  });

  it("returns messages in ASC order by default", async () => {
    const rows = await getMessages(adventureId);
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.content)).toEqual(["msg-0", "msg-1", "msg-2", "msg-3", "msg-4"]);
  });

  it("respects limit option", async () => {
    const rows = await getMessages(adventureId, { limit: 2, order: "desc" });
    expect(rows).toHaveLength(2);
    expect(rows[0]!.content).toBe("msg-4");
  });

  it("filters by milestoneId", async () => {
    // Insert one message tied to a different milestone
    await insertMessage({
      adventureId,
      milestoneId: milestone2Id,
      role: "user",
      content: "other-milestone",
    });

    const rows = await getMessages(adventureId, { milestoneId: milestone1Id });
    expect(rows.every((r) => r.milestoneId === milestone1Id)).toBe(true);
    expect(rows).toHaveLength(5);
  });

  it("getRecentMessages returns the N most recent messages in chronological order", async () => {
    const rows = await getRecentMessages(adventureId, 3);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.content)).toEqual(["msg-2", "msg-3", "msg-4"]);
  });
});
