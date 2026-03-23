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

import {
  completeAdventure,
  getMilestones,
  insertMessage,
  transitionMilestone,
  updateCharacterHp,
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
