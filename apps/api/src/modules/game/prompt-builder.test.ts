/**
 * PromptBuilder unit tests (Story 6.2 Task 2)
 * Pure logic — no mocks required.
 */
import { describe, expect, it } from "vitest";

import type { MilestoneDTO } from "@jdrai/shared";

import type { D20Result } from "./d20.service";
import type { ContextWindowParams, GameContext, SystemPromptParams } from "./prompt-builder";
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

  it("includes DC breakdown", () => {
    const result = makeD20Result({ baseDC: 12, difficultyModifier: 0, finalDC: 12 });
    const block = builder.buildD20InjectionBlock(result, "attack");
    expect(block).toContain("DC contextuel");
    expect(block).toContain("12");
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
        milestones,
        currentMilestone,
        recentHistory: [],
        ...contextOverrides,
      },
    };
  }

  it("first message is the system prompt (role: system)", () => {
    const messages = builder.buildContextWindow(makeParams());
    expect(messages[0]?.role).toBe("system");
    expect(messages[0]?.content).toContain("Tu es Le Chroniqueur");
  });

  it("second message is the milestone context (role: system)", () => {
    const messages = builder.buildContextWindow(makeParams());
    expect(messages[1]?.role).toBe("system");
    expect(messages[1]?.content).toContain("Milestones");
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
    // messages: [system, system, assistant, user, user(final)]
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

    // Total: 2 system + 20 history + 1 final user = 23
    expect(messages).toHaveLength(23);
    // First history message should be message 10 (30 - 20 = offset 10)
    expect(messages[2]?.content).toBe("Message 10");
  });

  it("works with empty history", () => {
    const messages = builder.buildContextWindow(makeParams({ recentHistory: [] }));
    // 2 system + 0 history + 1 final user = 3
    expect(messages).toHaveLength(3);
  });

  it("milestone context marks active milestone with ● and completed with ✓", () => {
    const messages = builder.buildContextWindow(makeParams());
    const milestoneMsg = messages[1]?.content ?? "";
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

describe("PromptBuilder.compressWorldState()", () => {
  it("serialises an object to JSON string", () => {
    const state = { location: "forest", weather: "rain", npcMet: ["gardes", "sorcière"] };
    const result = builder.compressWorldState(state);
    expect(result).toBe(JSON.stringify(state));
  });

  it("handles empty object", () => {
    expect(builder.compressWorldState({})).toBe("{}");
  });
});
