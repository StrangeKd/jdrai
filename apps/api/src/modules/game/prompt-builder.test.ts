/**
 * PromptBuilder unit tests (Story 6.2 Task 2)
 * Pure logic — no mocks required.
 */
import { describe, expect, it } from "vitest";

import type { MilestoneDTO } from "@jdrai/shared";

import type { D20Result } from "./d20.service";
import type { ContextWindowParams, GameContext } from "./prompt-builder";
import { PromptBuilder } from "./prompt-builder";

const builder = new PromptBuilder();

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeD20Result(overrides: Partial<D20Result> = {}): D20Result {
  return {
    roll: 15,
    actionType: "medium",
    difficulty: "normal",
    baseDC: 12,
    difficultyModifier: 0,
    finalDC: 12,
    characterBonus: 0,
    totalScore: 15,
    outcome: "success",
    ...overrides,
  };
}

const milestones: MilestoneDTO[] = [
  { id: "m1", name: "Arrivée au village", sortOrder: 1, status: "completed" },
  { id: "m2", name: "Enquête au marché", sortOrder: 2, status: "active" },
  { id: "m3", name: "Affronter le coupable", sortOrder: 3, status: "pending" },
];

const currentMilestone: MilestoneDTO = {
  id: "m2",
  name: "Enquête au marché",
  sortOrder: 2,
  status: "active",
  description: "Trouver des indices sur le voleur.",
};

const character = {
  id: "c1",
  name: "Alya",
  className: "Aventurier",
  raceName: "Humain",
  stats: { strength: 10, agility: 11, charisma: 9, karma: 8 },
  currentHp: 18,
  maxHp: 20,
};

// ---------------------------------------------------------------------------
// buildSystemPrompt
// ---------------------------------------------------------------------------

describe("PromptBuilder.buildSystemPrompt()", () => {
  it("includes Le Chroniqueur persona in all difficulties", () => {
    for (const difficulty of ["easy", "normal", "hard", "nightmare"] as const) {
      const prompt = builder.buildSystemPrompt({ difficulty });
      expect(prompt).toContain("Tu es Le Chroniqueur");
      expect(prompt).toContain("Tutoie toujours le joueur");
      expect(prompt).toContain("Ne brise JAMAIS le 4e mur");
    }
  });

  it("does NOT contain [SYSTÈME — INVISIBLE AU JOUEUR] block (AC-4/Task-2)", () => {
    for (const difficulty of ["easy", "normal", "hard", "nightmare"] as const) {
      const prompt = builder.buildSystemPrompt({ difficulty });
      expect(prompt).not.toContain("[SYSTÈME — INVISIBLE AU JOUEUR]");
    }
  });

  it("adapts tone for Easy difficulty", () => {
    const prompt = builder.buildSystemPrompt({ difficulty: "easy" });
    expect(prompt).toContain("encourageant et bienveillant");
    expect(prompt).toContain("Les échecs sont doux");
  });

  it("adapts tone for Normal difficulty", () => {
    const prompt = builder.buildSystemPrompt({ difficulty: "normal" });
    expect(prompt).toContain("style Chroniqueur standard");
  });

  it("adapts tone for Hard difficulty", () => {
    const prompt = builder.buildSystemPrompt({ difficulty: "hard" });
    expect(prompt).toContain("austère et exigeant");
    expect(prompt).toContain("Les erreurs coûtent cher");
  });

  it("adapts tone for Nightmare difficulty", () => {
    const prompt = builder.buildSystemPrompt({ difficulty: "nightmare" });
    expect(prompt).toContain("menaçant et oppressant");
    expect(prompt).toContain("La mort est une issue possible");
  });

  it("adapts fail state rules for Easy/Normal: fail forward guaranteed", () => {
    for (const difficulty of ["easy", "normal"] as const) {
      const prompt = builder.buildSystemPrompt({ difficulty });
      expect(prompt).toContain("TOUJOURS trouver une issue narrative");
      expect(prompt).not.toContain("[GAME_OVER]");
    }
  });

  it("adapts fail state rules for Hard: one last chance before GAME_OVER", () => {
    const prompt = builder.buildSystemPrompt({ difficulty: "hard" });
    expect(prompt).toContain("UNE dernière chance narrative");
    expect(prompt).toContain("[GAME_OVER]");
  });

  it("adapts fail state rules for Nightmare: immediate GAME_OVER", () => {
    const prompt = builder.buildSystemPrompt({ difficulty: "nightmare" });
    expect(prompt).toContain("Les échecs sont définitifs");
    expect(prompt).toContain("[GAME_OVER] sans offrir de seconde chance");
  });

  it("includes suggested choices format in all difficulties", () => {
    const prompt = builder.buildSystemPrompt({ difficulty: "normal" });
    expect(prompt).toContain("[CHOIX]");
    expect(prompt).toContain("[/CHOIX]");
    expect(prompt).toContain("2 à 4 actions suggérées");
  });

  it("includes signal emission rules (Section 5 — MJ IA System Spec v1.2) in all difficulties", () => {
    for (const difficulty of ["easy", "normal", "hard", "nightmare"] as const) {
      const prompt = builder.buildSystemPrompt({ difficulty });
      expect(prompt).toContain("Règles d'émission des signaux");
      expect(prompt).toContain("place-le TOUJOURS sur sa propre ligne");
      expect(prompt).toContain("séparé du texte narratif par une ligne vide");
    }
  });
});

// ---------------------------------------------------------------------------
// buildD20InjectionBlock
// ---------------------------------------------------------------------------

describe("PromptBuilder.buildD20InjectionBlock()", () => {
  it("contains [SYSTÈME — INVISIBLE AU JOUEUR] header", () => {
    const block = builder.buildD20InjectionBlock(makeD20Result(), "Je tente de forcer la porte.");
    expect(block).toContain("[SYSTÈME — INVISIBLE AU JOUEUR]");
  });

  it("includes the player action in the block", () => {
    const action = "Je tente de convaincre le garde.";
    const block = builder.buildD20InjectionBlock(makeD20Result(), action);
    expect(block).toContain(`Action du joueur : "${action}"`);
  });

  it("includes the roll value", () => {
    const block = builder.buildD20InjectionBlock(makeD20Result({ roll: 17 }), "attack");
    expect(block).toContain("Lancer D20 : 17");
  });

  it("includes DC breakdown with exact spec format", () => {
    const result = makeD20Result({
      actionType: "medium",
      difficulty: "normal",
      baseDC: 12,
      difficultyModifier: 0,
      finalDC: 12,
    });
    const block = builder.buildD20InjectionBlock(result, "attack");
    expect(block).toContain("DC contextuel : 12 (action moyenne) +0 (difficulté normal) = 12");
  });

  it("shows negative modifier sign for Easy difficulty without extra plus sign", () => {
    const result = makeD20Result({
      actionType: "trivial",
      difficulty: "easy",
      baseDC: 5,
      difficultyModifier: -3,
      finalDC: 2,
    });
    const block = builder.buildD20InjectionBlock(result, "walk");
    expect(block).toContain("DC contextuel : 5 (action triviale) -3 (difficulté easy) = 2");
  });

  it("shows SUCCÈS CRITIQUE label for critical_success outcome", () => {
    const block = builder.buildD20InjectionBlock(
      makeD20Result({ roll: 20, outcome: "critical_success" }),
      "attack",
    );
    expect(block).toContain("SUCCÈS CRITIQUE");
  });

  it("shows ÉCHEC CRITIQUE label for critical_failure outcome", () => {
    const block = builder.buildD20InjectionBlock(
      makeD20Result({ roll: 1, outcome: "critical_failure" }),
      "flee",
    );
    expect(block).toContain("ÉCHEC CRITIQUE");
  });

  it("shows SUCCÈS PARTIEL label for partial_success outcome", () => {
    const block = builder.buildD20InjectionBlock(
      makeD20Result({ outcome: "partial_success" }),
      "negotiate",
    );
    expect(block).toContain("SUCCÈS PARTIEL");
  });

  it("includes narrative consigne instruction", () => {
    const block = builder.buildD20InjectionBlock(makeD20Result(), "action");
    expect(block).toContain("Consigne :");
    expect(block).toContain("Ne pas mentionner le dé ni le score.");
  });

  it("shows + sign for positive character bonus", () => {
    const block = builder.buildD20InjectionBlock(makeD20Result({ characterBonus: 2 }), "action");
    expect(block).toContain("Bonus personnage : +2");
  });

  it("shows - sign for negative character bonus (no extra plus)", () => {
    const block = builder.buildD20InjectionBlock(makeD20Result({ characterBonus: -2 }), "action");
    expect(block).toContain("Bonus personnage : -2");
  });

  it("shows +0 for zero character bonus", () => {
    const block = builder.buildD20InjectionBlock(makeD20Result({ characterBonus: 0 }), "action");
    expect(block).toContain("Bonus personnage : +0");
  });

  it("is NOT present in buildSystemPrompt output (isolation check)", () => {
    const systemPrompt = builder.buildSystemPrompt({ difficulty: "normal" });
    expect(systemPrompt).not.toContain("[SYSTÈME — INVISIBLE AU JOUEUR]");
  });
});

// ---------------------------------------------------------------------------
// buildContextWindow
// ---------------------------------------------------------------------------

describe("PromptBuilder.buildContextWindow()", () => {
  function makeParams(contextOverrides: Partial<GameContext> = {}): ContextWindowParams {
    return {
      systemPrompt: builder.buildSystemPrompt({ difficulty: "normal" }),
      d20Block: builder.buildD20InjectionBlock(makeD20Result(), "Je fouille la pièce."),
      playerAction: "Je fouille la pièce.",
      context: {
        character,
        milestones,
        currentMilestone,
        recentHistory: [],
        worldState: {},
        ...contextOverrides,
      },
    };
  }

  it("first message is the system prompt (role: system)", () => {
    const messages = builder.buildContextWindow(makeParams());
    expect(messages[0]?.role).toBe("system");
    expect(messages[0]?.content).toContain("Tu es Le Chroniqueur");
  });

  it("fourth message is the milestone context (role: system)", () => {
    const messages = builder.buildContextWindow(makeParams());
    expect(messages[3]?.role).toBe("system");
    expect(messages[3]?.content).toContain("Milestones");
  });

  it("last message contains D20 block and player action (role: user)", () => {
    const params = makeParams();
    const messages = builder.buildContextWindow(params);
    const last = messages[messages.length - 1];
    expect(last?.role).toBe("user");
    expect(last?.content).toContain("[SYSTÈME — INVISIBLE AU JOUEUR]");
    expect(last?.content).toContain(`Action : ${params.playerAction}`);
  });

  it("includes recent history messages between milestone context and final user message", () => {
    const history = [
      { role: "assistant", content: "Vous entrez dans la taverne." },
      { role: "user", content: "Je parle au barman." },
    ];
    const messages = builder.buildContextWindow(makeParams({ recentHistory: history }));
    // messages: [system, system, system, system, assistant, user, user(final)]
    const assistantMsg = messages.find((m) => m.content === "Vous entrez dans la taverne.");
    expect(assistantMsg?.role).toBe("assistant");
    const userMsg = messages.find((m) => m.content === "Je parle au barman.");
    expect(userMsg?.role).toBe("user");
  });

  it("limits history to 20 messages (MAX_HISTORY_MESSAGES)", () => {
    // Create 30 messages
    const history = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message ${i}`,
    }));
    const messages = builder.buildContextWindow(makeParams({ recentHistory: history }));

    // Total: 4 system + 20 history + 1 final user = 25
    expect(messages).toHaveLength(25);
    // First history message should be message 10 (30 - 20 = offset 10)
    expect(messages[4]?.content).toBe("Message 10");
  });

  it("works with empty history", () => {
    const messages = builder.buildContextWindow(makeParams({ recentHistory: [] }));
    // 4 system + 0 history + 1 final user = 5
    expect(messages).toHaveLength(5);
  });

  it("returns CW-002 fallback when milestones list is empty", () => {
    const params: ContextWindowParams = {
      systemPrompt: builder.buildSystemPrompt({ difficulty: "normal" }),
      d20Block: builder.buildD20InjectionBlock(makeD20Result(), "action"),
      playerAction: "action",
      context: { character, milestones: [], currentMilestone: null, recentHistory: [], worldState: {} },
    };
    const messages = builder.buildContextWindow(params);
    expect(messages[3]?.content).toBe(
      "Contexte de l'aventure : En attente d'initialisation des milestones.",
    );
  });

  it("returns CW-002 fallback when currentMilestone is null (no active milestone)", () => {
    const completedMilestones = milestones.map((m) => ({ ...m, status: "completed" as const }));
    const params: ContextWindowParams = {
      systemPrompt: builder.buildSystemPrompt({ difficulty: "normal" }),
      d20Block: builder.buildD20InjectionBlock(makeD20Result(), "action"),
      playerAction: "action",
      context: {
        character,
        milestones: completedMilestones,
        currentMilestone: null,
        recentHistory: [],
        worldState: {},
      },
    };
    const messages = builder.buildContextWindow(params);
    expect(messages[3]?.content).toBe(
      "Contexte de l'aventure : En attente d'initialisation des milestones.",
    );
  });

  it("milestone context marks active milestone with ● and completed with ✓", () => {
    const messages = builder.buildContextWindow(makeParams());
    const milestoneMsg = messages[3]?.content ?? "";
    expect(milestoneMsg).toContain("✓ Arrivée au village");
    expect(milestoneMsg).toContain("● Enquête au marché");
    expect(milestoneMsg).toContain("○ Affronter le coupable");
  });

  it("all messages have role of type user | assistant | system", () => {
    const history = [
      { role: "user", content: "action" },
      { role: "assistant", content: "narration" },
      { role: "unknown_role", content: "should be cast to user" },
    ];
    const messages = builder.buildContextWindow(makeParams({ recentHistory: history }));
    for (const msg of messages) {
      expect(["user", "assistant", "system"]).toContain(msg.role);
    }
  });
});

// ---------------------------------------------------------------------------
// compressWorldState
// ---------------------------------------------------------------------------

describe("PromptBuilder.compressNarrativeContext()", () => {
  it("serialises an object to JSON string", () => {
    const state = { location: "forest", weather: "rain", npcMet: ["gardes", "sorcière"] };
    const result = builder.compressNarrativeContext(state);
    expect(result).toBe(JSON.stringify(state));
  });

  it("handles empty object", () => {
    expect(builder.compressNarrativeContext({})).toBe("{}");
  });
});
