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

import type { GameEvent } from "@jdrai/shared";

import { db } from "@/db";
import {
  adventureCharacters,
  adventures,
  characterClasses,
  messages,
  metaCharacters,
  milestones,
  races,
  users,
} from "@/db/schema";

import type { ParsedSignals } from "./game.service";
import { GameService } from "./game.service";
import { LLMService } from "./llm/index";

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

// ---------------------------------------------------------------------------
// processAction — narrative action metadata (Story 6.4b AC #7)
// ---------------------------------------------------------------------------

/** Injects a mock LLM service (stream) into a GameService instance. */
function injectStreamLLM(svc: GameService, chunks: string[]) {
  async function* mockStream() {
    for (const chunk of chunks) yield chunk;
  }
  const llm = {
    stream: vi.fn().mockReturnValue(mockStream()),
    // processAction can trigger async summary generation on completion signals.
    generate: vi.fn().mockResolvedValue("Résumé narratif de test."),
    generateResponse: vi.fn(),
  } as unknown as LLMService;
  // @ts-expect-error — private field injection for testing
  svc.llmService = llm;
}

describe("processAction() — narrative action produces no D20 metadata (AC #7)", () => {
  it("assistant message metadata has no roll/dc/bonus/outcome for a narrative action", async () => {
    const svc = new GameService();
    const llmResponse = "Tu regardes autour de toi et remarques une ancienne porte dissimulée.\n[CHOIX]\n1. Ouvrir la porte\n2. Examiner la porte\n[/CHOIX]";
    injectStreamLLM(svc, [llmResponse]);

    await svc.processAction({
      adventureId,
      userId: TEST_USER_ID,
      action: "Je regarde autour de moi",
    });

    const rows = await db
      .select({ role: messages.role, metadata: messages.metadata })
      .from(messages)
      .where(eq(messages.adventureId, adventureId));

    const assistantMsg = rows.find((r) => r.role === "assistant");
    expect(assistantMsg).toBeDefined();

    const meta = assistantMsg!.metadata as Record<string, unknown> | null ?? {};
    expect(meta).toEqual({});
  });

  it("does not call D20Service.resolve() for narrative actions (AC #3)", async () => {
    const svc = new GameService();
    injectStreamLLM(svc, ["Narration sans jet."]);

    const resolveSpy = vi.fn();
    // @ts-expect-error — private field injection for testing
    svc.d20 = { resolve: resolveSpy };

    await svc.processAction({
      adventureId,
      userId: TEST_USER_ID,
      action: "Je regarde autour de moi",
    });

    expect(resolveSpy).not.toHaveBeenCalled();
  });

  it("calls D20Service.resolve() for trivial actions but stores empty metadata (AC #4/#7)", async () => {
    const svc = new GameService();
    injectStreamLLM(svc, ["Tu ouvres la porte sans difficulté."]);

    const resolveSpy = vi.fn().mockReturnValue({
      roll: 14,
      actionType: "trivial",
      difficulty: "normal",
      baseDC: 5,
      difficultyModifier: 0,
      finalDC: 5,
      characterBonus: 0,
      totalScore: 14,
      outcome: "success",
    });
    // @ts-expect-error — private field injection for testing
    svc.d20 = { resolve: resolveSpy };

    await svc.processAction({
      adventureId,
      userId: TEST_USER_ID,
      action: "Je marche vers la porte",
    });

    expect(resolveSpy).toHaveBeenCalledOnce();
    expect(resolveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "trivial",
      }),
    );

    const rows = await db
      .select({ role: messages.role, metadata: messages.metadata })
      .from(messages)
      .where(eq(messages.adventureId, adventureId));

    const assistantMsg = rows.find((r) => r.role === "assistant");
    expect(assistantMsg).toBeDefined();

    const meta = assistantMsg!.metadata as Record<string, unknown> | null ?? {};
    expect(meta).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// processAction() — full turn + LLM signals (Story 6.3a Task 5)
// ---------------------------------------------------------------------------

describe("processAction() — full turn + signals", () => {
  it("returns messageId and inserts assistant message in DB for a valid action", async () => {
    const svc = new GameService();
    injectStreamLLM(svc, ["Vous avancez dans le couloir sombre."]);

    const result = await svc.processAction({
      adventureId,
      userId: TEST_USER_ID,
      action: "J'avance prudemment dans le couloir",
    });

    expect(result.messageId).toBeDefined();

    const rows = await db
      .select({ id: messages.id, role: messages.role })
      .from(messages)
      .where(eq(messages.adventureId, adventureId));

    const assistantMsg = rows.find((r) => r.role === "assistant");
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg!.id).toBe(result.messageId);
  });

  it("[HP_CHANGE:-5] → currentHp decremented in DB", async () => {
    const svc = new GameService();
    injectStreamLLM(svc, ["Vous recevez un coup. [HP_CHANGE:-5] Votre santé diminue."]);

    await svc.processAction({
      adventureId,
      userId: TEST_USER_ID,
      action: "J'attaque le garde",
    });

    const [char] = await db
      .select({ currentHp: adventureCharacters.currentHp })
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    expect(char!.currentHp).toBe(15); // 20 - 5
  });

  it("[HP_CHANGE] clamps HP at 0 when damage is fatal", async () => {
    const svc = new GameService();
    injectStreamLLM(svc, ["Coup fatal. [HP_CHANGE:-999]"]);

    await svc.processAction({
      adventureId,
      userId: TEST_USER_ID,
      action: "J'affronte l'ennemi",
    });

    const [char] = await db
      .select({ currentHp: adventureCharacters.currentHp })
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    expect(char!.currentHp).toBe(0);
  });

  it("[MILESTONE_COMPLETE] → active milestone set to completed, next set to active", async () => {
    const svc = new GameService();
    injectStreamLLM(svc, ["Le prologue s'achève. [MILESTONE_COMPLETE:Prologue]"]);

    await svc.processAction({
      adventureId,
      userId: TEST_USER_ID,
      action: "Je termine ma quête initiale",
    });

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
  });

  it("[GAME_OVER] → adventure.status = 'completed' in DB", async () => {
    const svc = new GameService();
    injectStreamLLM(svc, ["Vous êtes vaincu. Votre aventure s'arrête ici. [GAME_OVER]"]);

    await svc.processAction({
      adventureId,
      userId: TEST_USER_ID,
      action: "J'affronte le boss final",
    });

    const [adv] = await db
      .select({ status: adventures.status })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    expect(adv!.status).toBe("completed");
  });

  it("[ADVENTURE_COMPLETE] → adventure.status = 'completed' in DB", async () => {
    const svc = new GameService();
    injectStreamLLM(svc, ["Vous triomphez ! L'aventure se conclut en gloire. [ADVENTURE_COMPLETE]"]);

    await svc.processAction({
      adventureId,
      userId: TEST_USER_ID,
      action: "Je bats le boss final",
    });

    const [adv] = await db
      .select({ status: adventures.status })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    expect(adv!.status).toBe("completed");
  });
});

describe("processAction() — tutorial choices and completion (Story 8.1)", () => {
  it("captures tutorial race/class choices only when choiceId exists in lookup tables", async () => {
    const svc = new GameService();
    injectStreamLLM(svc, ["Le guide attend ta réponse."]);

    const [tutorialAdventure] = await db
      .insert(adventures)
      .values({
        userId: TEST_USER_ID,
        title: "Tutoriel choix",
        difficulty: "easy",
        estimatedDuration: "short",
        isTutorial: true,
        state: { worldState: {}, tutorialChoices: {}, tutorialPhase: "intro" },
      })
      .returning({ id: adventures.id });

    await db.insert(adventureCharacters).values({
      adventureId: tutorialAdventure!.id,
      raceId,
      classId,
      name: "Héros Tutoriel",
      currentHp: 20,
      maxHp: 20,
      stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
    });

    await db.insert(milestones).values([
      { adventureId: tutorialAdventure!.id, name: "L'Éveil", sortOrder: 1, status: "active" },
      { adventureId: tutorialAdventure!.id, name: "La Rencontre", sortOrder: 2, status: "pending" },
      { adventureId: tutorialAdventure!.id, name: "L'Épreuve", sortOrder: 3, status: "pending" },
    ]);

    await svc.processAction({
      adventureId: tutorialAdventure!.id,
      userId: TEST_USER_ID,
      action: "Je choisis ma race",
      choiceType: "race",
      choiceId: raceId,
    });

    await svc.processAction({
      adventureId: tutorialAdventure!.id,
      userId: TEST_USER_ID,
      action: "Je tente un choix invalide",
      choiceType: "class",
      choiceId: "00000000-0000-0000-0000-000000000999",
    });

    const [advRow] = await db
      .select({ state: adventures.state })
      .from(adventures)
      .where(eq(adventures.id, tutorialAdventure!.id))
      .limit(1);

    const state = (advRow!.state ?? {}) as Record<string, unknown>;
    const choices = (state["tutorialChoices"] ?? {}) as Record<string, string>;

    expect(choices["raceId"]).toBe(raceId);
    expect(choices["raceName"]).toBe("Humain (integ-game-svc)");
    expect(choices["classId"]).toBeUndefined();
    expect(choices["className"]).toBeUndefined();

    await db.delete(adventures).where(eq(adventures.id, tutorialAdventure!.id));
  });

  it("uses the same-turn captured choice for MetaCharacter creation and sets onboardingCompleted=true", async () => {
    const svc = new GameService();
    injectStreamLLM(
      svc,
      ["Ton choix est scellé. [MILESTONE_COMPLETE:L'Épreuve] [ADVENTURE_COMPLETE]"],
    );

    const [tutorialAdventure] = await db
      .insert(adventures)
      .values({
        userId: TEST_USER_ID,
        title: "Tutoriel completion",
        difficulty: "easy",
        estimatedDuration: "short",
        isTutorial: true,
        state: { worldState: {}, tutorialChoices: {}, tutorialPhase: "class_choice" },
      })
      .returning({ id: adventures.id });

    await db.insert(adventureCharacters).values({
      adventureId: tutorialAdventure!.id,
      raceId,
      classId,
      name: "Héros Tutoriel",
      currentHp: 20,
      maxHp: 20,
      stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
    });

    await db.insert(milestones).values([
      { adventureId: tutorialAdventure!.id, name: "L'Éveil", sortOrder: 1, status: "completed" },
      { adventureId: tutorialAdventure!.id, name: "La Rencontre", sortOrder: 2, status: "completed" },
      { adventureId: tutorialAdventure!.id, name: "L'Épreuve", sortOrder: 3, status: "active" },
    ]);

    await svc.processAction({
      adventureId: tutorialAdventure!.id,
      userId: TEST_USER_ID,
      action: "Je choisis ma classe",
      choiceType: "class",
      choiceId: classId,
    });

    await new Promise((r) => setTimeout(r, 50));

    const [metaRow] = await db
      .select({ userId: metaCharacters.userId, classId: metaCharacters.classId })
      .from(metaCharacters)
      .where(eq(metaCharacters.userId, TEST_USER_ID))
      .limit(1);

    const [userRow] = await db
      .select({ onboardingCompleted: users.onboardingCompleted })
      .from(users)
      .where(eq(users.id, TEST_USER_ID))
      .limit(1);

    expect(metaRow).toBeDefined();
    expect(metaRow!.classId).toBe(classId);
    expect(userRow!.onboardingCompleted).toBe(true);

    await db.delete(adventures).where(eq(adventures.id, tutorialAdventure!.id));
  });
});

// ---------------------------------------------------------------------------
// Story 7.1 — applySignals + handleAdventureEnd + generateNarrativeSummary
// ---------------------------------------------------------------------------

/** Injects a full LLM mock (stream + generate) into a GameService instance. */
function injectFullLLM(svc: GameService, streamChunks: string[], generateResult: string | Error) {
  async function* mockStream() {
    for (const chunk of streamChunks) yield chunk;
  }
  const generateFn =
    generateResult instanceof Error
      ? vi.fn().mockRejectedValue(generateResult)
      : vi.fn().mockResolvedValue(generateResult);

  const llm = {
    stream: vi.fn().mockReturnValue(mockStream()),
    generate: generateFn,
    generateResponse: generateFn,
  } as unknown as LLMService;
  // @ts-expect-error — private field injection for testing
  svc.llmService = llm;
}

describe("applySignals() — Story 7.1 (isGameOver column + narrative summary)", () => {
  it("[ADVENTURE_COMPLETE] → isGameOver=false in DB column + narrativeSummary generated (AC #2, #3)", async () => {
    const svc = new GameService();
    injectFullLLM(svc, [], "Tu as triomphé dans une aventure épique.");

    const signals: ParsedSignals = {
      adventureComplete: true,
      isGameOver: false,
      choices: [],
    };

    await svc.applySignals(signals, adventureId);

    // Allow fire-and-forget summary generation to complete
    await new Promise((r) => setTimeout(r, 100));

    const [row] = await db
      .select({ status: adventures.status, isGameOver: adventures.isGameOver, narrativeSummary: adventures.narrativeSummary })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    expect(row!.status).toBe("completed");
    expect(row!.isGameOver).toBe(false);
    expect(row!.narrativeSummary).toBe("Tu as triomphé dans une aventure épique.");
  });

  it("[GAME_OVER] → isGameOver=true in DB column + narrativeSummary generated with solemn tone (AC #2, #3)", async () => {
    const svc = new GameService();
    injectFullLLM(svc, [], "Ton héritage demeure gravé dans les annales du monde.");

    const signals: ParsedSignals = {
      adventureComplete: false,
      isGameOver: true,
      choices: [],
    };

    await svc.applySignals(signals, adventureId);

    await new Promise((r) => setTimeout(r, 100));

    const [row] = await db
      .select({ status: adventures.status, isGameOver: adventures.isGameOver, narrativeSummary: adventures.narrativeSummary })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    expect(row!.status).toBe("completed");
    expect(row!.isGameOver).toBe(true);
    expect(row!.narrativeSummary).toBe("Ton héritage demeure gravé dans les annales du monde.");
  });

  it("LLM summary generation fails → adventure still completed, narrativeSummary=null, no crash (AC #2)", async () => {
    const svc = new GameService();
    injectFullLLM(svc, [], new Error("LLM unavailable"));

    const signals: ParsedSignals = {
      adventureComplete: true,
      isGameOver: false,
      choices: [],
    };

    // Should not throw — error is swallowed in fire-and-forget
    await expect(svc.applySignals(signals, adventureId)).resolves.not.toThrow();

    await new Promise((r) => setTimeout(r, 100));

    const [row] = await db
      .select({ status: adventures.status, narrativeSummary: adventures.narrativeSummary })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    expect(row!.status).toBe("completed");
    expect(row!.narrativeSummary).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Group C / Phase 4 — processAction emits typed GameEvents (no Socket.io)
// ---------------------------------------------------------------------------

describe("processAction() — transport-agnostic event emission (Phase 4)", () => {
  it("invokes onEvent with response-start, chunks, state-update and response-complete", async () => {
    const svc = new GameService();
    injectStreamLLM(svc, [
      "Vous prenez un coup. ",
      "[HP_CHANGE:-3]",
      "\nQue faites-vous ?",
      "\n[CHOIX]\n1. Reculer\n2. Attaquer\n[/CHOIX]",
    ]);

    const events: GameEvent[] = [];
    const onEvent = (e: GameEvent) => {
      events.push(e);
    };

    const result = await svc.processAction({
      adventureId,
      userId: TEST_USER_ID,
      action: "J'attaque le garde",
      onEvent,
    });

    expect(result.messageId).toBeDefined();

    const types = events.map((e) => e.type);
    expect(types[0]).toBe("response-start");
    expect(types).toContain("chunk");
    expect(types).toContain("state-update");
    expect(types[types.length - 1]).toBe("response-complete");

    // Chunk events carry the streamed text
    const chunkEvents = events.filter((e): e is Extract<GameEvent, { type: "chunk" }> => e.type === "chunk");
    expect(chunkEvents.length).toBeGreaterThan(0);
    expect(chunkEvents.every((e) => e.adventureId === adventureId)).toBe(true);

    // state-update for hp_change
    const hpUpdate = events.find(
      (e): e is Extract<GameEvent, { type: "state-update"; subtype: "hp_change" }> =>
        e.type === "state-update" && e.subtype === "hp_change",
    );
    expect(hpUpdate).toBeDefined();
    expect(hpUpdate!.currentHp).toBe(17);
    expect(hpUpdate!.maxHp).toBe(20);

    // response-complete carries cleanText + choices + stateChanges
    const complete = events.find(
      (e): e is Extract<GameEvent, { type: "response-complete" }> => e.type === "response-complete",
    );
    expect(complete).toBeDefined();
    expect(complete!.cleanText).not.toContain("[HP_CHANGE");
    expect(complete!.choices.length).toBe(2);
    expect(complete!.stateChanges.hpChange).toBe(-3);
  });

  it("does not emit chunks when stream=false (sync mode)", async () => {
    const svc = new GameService();
    injectStreamLLM(svc, ["Tu réfléchis et avances."]);

    const events: GameEvent[] = [];
    const result = await svc.processAction({
      adventureId,
      userId: TEST_USER_ID,
      action: "J'avance",
      onEvent: (e) => events.push(e),
      stream: false,
    });

    // In sync mode no streaming events should fire — only state-update from applySignals (none here)
    expect(events.find((e) => e.type === "response-start")).toBeUndefined();
    expect(events.find((e) => e.type === "chunk")).toBeUndefined();
    expect(events.find((e) => e.type === "response-complete")).toBeUndefined();

    // The full response is returned synchronously
    expect(result.response).toBeDefined();
    expect(result.response!.cleanText).toContain("Tu réfléchis");
  });
});
