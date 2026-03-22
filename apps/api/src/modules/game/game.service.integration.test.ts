/**
 * GameService.applySignals integration tests (Story 6.3a Task 5 — real DB)
 *
 * Covers end-to-end signal side effects:
 *  - HP_CHANGE signal → DB clamped, io event emitted
 *  - MILESTONE_COMPLETE signal → active→completed, next→active
 *  - ADVENTURE_COMPLETE signal → adventure status = completed, io event emitted
 *  - GAME_OVER signal → adventure status = completed, state.completion.isGameOver = true
 *  - Combined signals applied in correct order
 *
 * Requires: jdrai-db Docker container running
 * Run via: pnpm test:integration
 */
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import {
  adventureCharacters,
  adventures,
  characterClasses,
  milestones,
  races,
  users,
} from "@/db/schema";

import type { ParsedSignals } from "./game.service";
import { GameService } from "./game.service";

// ---------------------------------------------------------------------------
// Shared fixture IDs
// ---------------------------------------------------------------------------

const TEST_USER_ID = "integ-test-game-service-user";
let raceId: string;
let classId: string;

// Per-test
let adventureId: string;
let milestone1Id: string;
let milestone2Id: string;

const gameService = new GameService();

// ---------------------------------------------------------------------------
// io spy helper
// ---------------------------------------------------------------------------

function makeIoSpy() {
  const emitted: Array<{ event: string; data: unknown }> = [];
  const toSpy = vi.fn().mockReturnValue({
    emit: (event: string, data: unknown) => {
      emitted.push({ event, data });
    },
  });
  return {
    to: toSpy,
    emitted,
  } as unknown as Pick<import("socket.io").Server, "to"> & { emitted: typeof emitted };
}

// ---------------------------------------------------------------------------
// Fixture setup / teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  await db.insert(users).values({
    id: TEST_USER_ID,
    name: "Test User (game.service integration)",
    email: "integ-game-service@test.local",
    emailVerified: false,
  }).onConflictDoNothing();

  const [raceRow] = await db
    .insert(races)
    .values({ name: "Humain (integ-game-svc)", isDefault: false })
    .returning({ id: races.id });
  raceId = raceRow!.id;

  const [classRow] = await db
    .insert(characterClasses)
    .values({ name: "Aventurier (integ-game-svc)", isDefault: false })
    .returning({ id: characterClasses.id });
  classId = classRow!.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, TEST_USER_ID));
  await db.delete(races).where(eq(races.id, raceId));
  await db.delete(characterClasses).where(eq(characterClasses.id, classId));
});

beforeEach(async () => {
  const [advRow] = await db
    .insert(adventures)
    .values({
      userId: TEST_USER_ID,
      title: "Aventure applySignals",
      difficulty: "normal",
      estimatedDuration: "short",
    })
    .returning({ id: adventures.id });
  adventureId = advRow!.id;

  await db.insert(adventureCharacters).values({
    adventureId,
    raceId,
    classId,
    name: "Héros Signal",
    currentHp: 20,
    maxHp: 20,
    stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
  });

  const [m1, m2] = await db
    .insert(milestones)
    .values([
      { adventureId, name: "Prologue", sortOrder: 1, status: "active" },
      { adventureId, name: "Climax", sortOrder: 2, status: "pending" },
    ])
    .returning({ id: milestones.id });
  milestone1Id = m1!.id;
  milestone2Id = m2!.id;
});

afterEach(async () => {
  await db.delete(adventures).where(eq(adventures.id, adventureId));
});

// ---------------------------------------------------------------------------
// applySignals — HP_CHANGE
// ---------------------------------------------------------------------------

describe("applySignals() — HP_CHANGE", () => {
  it("applies hpChange to DB and emits game:state-update", async () => {
    const io = makeIoSpy();
    const signals: ParsedSignals = {
      hpChange: -5,
      adventureComplete: false,
      isGameOver: false,
      choices: [],
    };

    await gameService.applySignals(signals, adventureId, io);

    const [row] = await db
      .select({ currentHp: adventureCharacters.currentHp })
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    expect(row!.currentHp).toBe(15);
    expect(io.emitted.some((e) => e.event === "game:state-update")).toBe(true);
  });

  it("clamps HP at 0 when damage is fatal", async () => {
    const signals: ParsedSignals = {
      hpChange: -999,
      adventureComplete: false,
      isGameOver: false,
      choices: [],
    };

    await gameService.applySignals(signals, adventureId);

    const [row] = await db
      .select({ currentHp: adventureCharacters.currentHp })
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    expect(row!.currentHp).toBe(0);
  });

  it("does not emit game:state-update when io is not provided", async () => {
    const signals: ParsedSignals = {
      hpChange: -3,
      adventureComplete: false,
      isGameOver: false,
      choices: [],
    };

    // Should not throw even without io
    await expect(gameService.applySignals(signals, adventureId)).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// applySignals — MILESTONE_COMPLETE
// ---------------------------------------------------------------------------

describe("applySignals() — MILESTONE_COMPLETE", () => {
  it("transitions active milestone to completed and activates next", async () => {
    const io = makeIoSpy();
    const signals: ParsedSignals = {
      milestoneCompleted: "Prologue",
      adventureComplete: false,
      isGameOver: false,
      choices: [],
    };

    await gameService.applySignals(signals, adventureId, io);

    const [m1] = await db
      .select({ status: milestones.status })
      .from(milestones)
      .where(eq(milestones.id, milestone1Id))
      .limit(1);

    const [m2] = await db
      .select({ status: milestones.status })
      .from(milestones)
      .where(eq(milestones.id, milestone2Id))
      .limit(1);

    expect(m1!.status).toBe("completed");
    expect(m2!.status).toBe("active");

    const milestoneEvent = io.emitted.find(
      (e) => e.event === "game:state-update" && (e.data as { type: string }).type === "milestone_complete",
    );
    expect(milestoneEvent).toBeDefined();
  });

  it("emits milestone_complete event with correct milestone names", async () => {
    const io = makeIoSpy();
    const signals: ParsedSignals = {
      milestoneCompleted: "Prologue",
      adventureComplete: false,
      isGameOver: false,
      choices: [],
    };

    await gameService.applySignals(signals, adventureId, io);

    const event = io.emitted.find(
      (e) => e.event === "game:state-update",
    )?.data as { completedMilestone?: string; nextMilestone?: string };

    expect(event?.completedMilestone).toBe("Prologue");
    expect(event?.nextMilestone).toBe("Climax");
  });
});

// ---------------------------------------------------------------------------
// applySignals — ADVENTURE_COMPLETE
// ---------------------------------------------------------------------------

describe("applySignals() — ADVENTURE_COMPLETE", () => {
  it("sets adventure status to completed", async () => {
    const signals: ParsedSignals = {
      adventureComplete: true,
      isGameOver: false,
      choices: [],
    };

    await gameService.applySignals(signals, adventureId);

    const [row] = await db
      .select({ status: adventures.status })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    expect(row!.status).toBe("completed");
  });

  it("emits adventure_complete event", async () => {
    const io = makeIoSpy();
    const signals: ParsedSignals = {
      adventureComplete: true,
      isGameOver: false,
      choices: [],
    };

    await gameService.applySignals(signals, adventureId, io);

    const event = io.emitted.find(
      (e) => e.event === "game:state-update" && (e.data as { type: string }).type === "adventure_complete",
    );
    expect(event).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// applySignals — GAME_OVER
// ---------------------------------------------------------------------------

describe("applySignals() — GAME_OVER", () => {
  it("sets adventure status to completed with isGameOver=true in state", async () => {
    const signals: ParsedSignals = {
      adventureComplete: false,
      isGameOver: true,
      choices: [],
    };

    await gameService.applySignals(signals, adventureId);

    const [row] = await db
      .select({ status: adventures.status, state: adventures.state })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    expect(row!.status).toBe("completed");

    const state = row!.state as { completion?: { isGameOver: boolean } };
    expect(state.completion?.isGameOver).toBe(true);
  });

  it("emits game_over event", async () => {
    const io = makeIoSpy();
    const signals: ParsedSignals = {
      adventureComplete: false,
      isGameOver: true,
      choices: [],
    };

    await gameService.applySignals(signals, adventureId, io);

    const event = io.emitted.find(
      (e) => e.event === "game:state-update" && (e.data as { type: string }).type === "game_over",
    );
    expect(event).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// applySignals — combined signals
// ---------------------------------------------------------------------------

describe("applySignals() — combined signals", () => {
  it("applies HP change AND milestone transition in the same call", async () => {
    const signals: ParsedSignals = {
      hpChange: -3,
      milestoneCompleted: "Prologue",
      adventureComplete: false,
      isGameOver: false,
      choices: [],
    };

    await gameService.applySignals(signals, adventureId);

    const [charRow] = await db
      .select({ currentHp: adventureCharacters.currentHp })
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    const [m1Row] = await db
      .select({ status: milestones.status })
      .from(milestones)
      .where(eq(milestones.id, milestone1Id))
      .limit(1);

    expect(charRow!.currentHp).toBe(17);
    expect(m1Row!.status).toBe("completed");
  });

  it("applies HP change AND adventure complete together", async () => {
    const signals: ParsedSignals = {
      hpChange: -2,
      adventureComplete: true,
      isGameOver: false,
      choices: [],
    };

    await gameService.applySignals(signals, adventureId);

    const [charRow] = await db
      .select({ currentHp: adventureCharacters.currentHp })
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    const [advRow] = await db
      .select({ status: adventures.status })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    expect(charRow!.currentHp).toBe(18);
    expect(advRow!.status).toBe("completed");
  });
});
