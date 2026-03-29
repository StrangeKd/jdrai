/**
 * GameService — orchestrates a full game turn (Story 6.3a Task 2).
 * Processes player action: D20 → prompt build → LLM stream → signal parse → DB persist.
 */
/* eslint-disable simple-import-sort/imports */
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type {
  AdventureCharacterDTO,
  AdventureDTO,
  Difficulty,
  ErrorCode,
  GameMessageDTO,
  GameStateDTO,
  MilestoneDTO,
} from "@jdrai/shared";

import { db } from "@/db";
import { adventureCharacters, adventures, messages, milestones } from "@/db/schema";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/errors";

import { D20Service, type ActionType, type D20Result } from "./d20.service";
import {
  completeAdventure,
  getMilestones,
  insertMessage,
  transitionMilestone,
  updateAdventureState,
  updateCharacterHp,
  updateNarrativeSummary,
  type GameStateSnapshot,
} from "./game.repository";
import { LLMService, createLLMService } from "./llm/index";
import { PromptBuilder } from "./prompt-builder";
/* eslint-enable simple-import-sort/imports */

// ---------------------------------------------------------------------------
// Milestone initialization — schema, fallback, prompt builder
// ---------------------------------------------------------------------------

/** Zod schema for LLM milestone generation response (AC #3). */
const MilestoneInitResponseSchema = z.object({
  milestones: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().min(1).max(300),
      }),
    )
    .min(2)
    .max(8),
});

/** Fallback used when LLM milestone generation fails (AC #4). */
const FALLBACK_MILESTONES = [
  {
    name: "Prologue",
    description: "Le début de l'aventure — mise en place du contexte et des enjeux.",
  },
  {
    name: "Le Cœur de l'Aventure",
    description: "Le développement central — obstacles et révélations.",
  },
  {
    name: "Épilogue",
    description: "La résolution finale — climax et conclusion de l'histoire.",
  },
];

/** Maps EstimatedDuration to a human-readable label for the LLM prompt. */
function durationLabel(d: AdventureDTO["estimatedDuration"]): string {
  return { short: "courte", medium: "moyenne", long: "longue" }[d];
}

/** Builds the LLM prompt for milestone generation (AC #2). */
function buildMilestoneInitPrompt(adventure: AdventureDTO): string {
  return `Tu es un assistant de game design.
Génère la liste des milestones (jalons narratifs) pour une aventure de jeu de rôle fantasy.

Paramètres :
- Titre de l'aventure : ${adventure.title}
- Durée estimée : ${durationLabel(adventure.estimatedDuration)} (courte = 2-3 milestones, moyenne = 4-5, longue = 6+)

Réponds UNIQUEMENT avec un JSON valide, sans markdown, dans ce format exact :
{
  "milestones": [
    { "name": "Nom court du jalon", "description": "Objectif narratif en 1 phrase" },
    ...
  ]
}

Règles :
- Le premier milestone est le début de l'aventure (mise en place)
- Le dernier milestone est la résolution finale (climax + épilogue)
- Les noms sont courts (3-6 mots), évocateurs, en français
- Les descriptions sont orientées objectif narratif, pas action spécifique`;
}

/** Builds an AdventureDTO from raw DB rows (used by getState). */
function buildAdventureDTO(
  adventureRow: typeof adventures.$inferSelect,
  characterRow: typeof adventureCharacters.$inferSelect | undefined,
  currentMilestoneName: string | null = null,
): AdventureDTO {
  const characterDTO: AdventureCharacterDTO = {
    id: characterRow?.id ?? "",
    name: characterRow?.name ?? "Aventurier",
    className: "Aventurier", // P1: always default
    raceName: "Humain", // P1: always default
    stats: (characterRow?.stats as AdventureCharacterDTO["stats"]) ?? {
      strength: 10,
      agility: 10,
      charisma: 10,
      karma: 10,
    },
    currentHp: characterRow?.currentHp ?? 20,
    maxHp: characterRow?.maxHp ?? 20,
  };

  const dto: AdventureDTO = {
    id: adventureRow.id,
    title: adventureRow.title,
    status: adventureRow.status,
    difficulty: adventureRow.difficulty as Difficulty,
    estimatedDuration: adventureRow.estimatedDuration as AdventureDTO["estimatedDuration"],
    startedAt: (adventureRow.startedAt ?? adventureRow.createdAt).toISOString(),
    lastPlayedAt: (adventureRow.lastPlayedAt ?? adventureRow.createdAt).toISOString(),
    currentMilestone: currentMilestoneName,
    character: characterDTO,
    isGameOver: adventureRow.isGameOver ?? false,
  };

  if (adventureRow.tone) dto.tone = adventureRow.tone as AdventureDTO["tone"];
  if (adventureRow.narrativeSummary) dto.narrativeSummary = adventureRow.narrativeSummary;

  return dto;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProcessActionParams {
  adventureId: string;
  userId: string;
  action: string;
  choiceId?: string | undefined;
  socketId?: string | undefined;
  io?: import("socket.io").Server | undefined;
  /** DEV only — bypasses LLM and returns hardcoded text to save tokens during manual testing. */
  mockLlm?: boolean | undefined;
}

export interface ProcessActionResult {
  messageId: string;
  response?: ProcessActionResponse;
}

export interface ProcessActionResponse {
  cleanText: string;
  choices: SuggestedAction[];
  stateChanges: {
    hpChange?: number;
    milestoneCompleted?: string | null;
    adventureComplete: boolean;
    isGameOver: boolean;
  };
}

export interface SuggestedAction {
  id: string;
  label: string;
  type: "suggested";
}

export interface ParsedSignals {
  milestoneCompleted?: string;
  hpChange?: number;
  adventureComplete: boolean;
  isGameOver: boolean;
  choices: SuggestedAction[];
}

interface GameMessageRow {
  role: "user" | "assistant" | "system";
  content: string;
  choices?: SuggestedAction[];
}

// ---------------------------------------------------------------------------
// Signal regex patterns (GDD §4.3 / Story 6.3a AC-4)
// ---------------------------------------------------------------------------

const SIGNAL_PATTERNS = {
  MILESTONE_COMPLETE: /\[MILESTONE_COMPLETE:([^\]]+)\]/g,
  HP_CHANGE: /\[HP_CHANGE:([+-]?\d+)\]/g,
  ADVENTURE_COMPLETE: /\[ADVENTURE_COMPLETE\]/g,
  GAME_OVER: /\[GAME_OVER\]/g,
  CHOICES: /\[CHOIX\]([\s\S]*?)\[\/CHOIX\]/g,
} as const;

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit tests)
// ---------------------------------------------------------------------------

/**
 * Classifies a player action into an ActionType using a P1 keyword heuristic.
 * P2 scope: lightweight LLM classification.
 */
export function classifyAction(action: string): ActionType {
  const lower = action.toLowerCase();
  if (
    /\blis\b|\blir|\bregard|observe|écoute|examine|\bsuiv|\bapproch|sui[st]|\bavanc|va vers|vais vers|se dirige vers/.test(
      lower,
    )
  )
    return "narrative";
  if (/enchant|magie|\bsort\b|spell|forcer|enfonc|désamorc/.test(lower)) return "very_hard";
  if (/attaqu|combat|intimid|piège|trap/.test(lower)) return "hard";
  if (/parle|discut|négoci/.test(lower)) return "easy";
  if (/ouvrir|ouvre|march|\bprendr|\bramass|\bsaisi|\brepose|\brepos\b/.test(lower)) return "trivial";
  return "medium";
}

/**
 * Strips LLM signals from raw text and parses their values.
 * Signals are extracted from the full accumulated response (not chunk-by-chunk).
 */
export function parseSignals(rawText: string): { cleanText: string; signals: ParsedSignals } {
  const signals: ParsedSignals = {
    adventureComplete: false,
    isGameOver: false,
    choices: [],
  };

  // Reset lastIndex before each exec (global regex reuse)
  SIGNAL_PATTERNS.MILESTONE_COMPLETE.lastIndex = 0;
  const milestoneMatch = SIGNAL_PATTERNS.MILESTONE_COMPLETE.exec(rawText);
  if (milestoneMatch) signals.milestoneCompleted = milestoneMatch[1]!.trim();

  SIGNAL_PATTERNS.HP_CHANGE.lastIndex = 0;
  const hpMatch = SIGNAL_PATTERNS.HP_CHANGE.exec(rawText);
  if (hpMatch) signals.hpChange = parseInt(hpMatch[1]!, 10);

  signals.adventureComplete = SIGNAL_PATTERNS.ADVENTURE_COMPLETE.test(rawText);
  signals.isGameOver = SIGNAL_PATTERNS.GAME_OVER.test(rawText);

  SIGNAL_PATTERNS.CHOICES.lastIndex = 0;
  const choicesMatch = SIGNAL_PATTERNS.CHOICES.exec(rawText);
  if (choicesMatch) {
    const lines = choicesMatch[1]!.trim().split("\n").filter(Boolean);
    signals.choices = lines.map((line, i) => ({
      id: `choice-${Date.now()}-${i}`,
      label: line.replace(/^\d+\.\s*/, "").trim(),
      type: "suggested" as const,
    }));
  }

  const cleanText = rawText
    .replace(/\[MILESTONE_COMPLETE:[^\]]+\]/g, "")
    .replace(/\[HP_CHANGE:[+-]?\d+\]/g, "")
    .replace(/\[ADVENTURE_COMPLETE\]/g, "")
    .replace(/\[GAME_OVER\]/g, "")
    .replace(/\[CHOIX\][\s\S]*?\[\/CHOIX\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { cleanText, signals };
}

/**
 * Computes the character bonus for a given action based on class, narrative favor,
 * and recent repetition.
 */
export function computeCharacterBonus(
  character: AdventureCharacterDTO,
  action: string,
  recentHistory: GameMessageRow[],
): number {
  let bonus = 0;
  const lower = action.toLowerCase();

  if (character.className === "Aventurier") {
    if (/explore|cherche|combat|attaqu|escalade|crochete/.test(lower)) bonus += 2;
  }

  const lastGmMessage = [...recentHistory].reverse().find((m) => m.role === "assistant");
  if (lastGmMessage?.choices?.some((c) => lower.includes(c.label.toLowerCase().slice(0, 10)))) {
    bonus += 1;
  }

  const recentUserActions = recentHistory
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content.toLowerCase());
  if (recentUserActions.some((prev) => prev.slice(0, 15) === lower.slice(0, 15))) {
    bonus -= 2;
  }

  return bonus;
}

// ---------------------------------------------------------------------------
// GameService
// ---------------------------------------------------------------------------

export class GameService {
  private d20 = new D20Service();
  private promptBuilder = new PromptBuilder();
  private llmService: LLMService | null = null;

  /** Lazily initialises the LLM service (reads env vars). */
  private async getLLMService(): Promise<LLMService> {
    if (!this.llmService) {
      this.llmService = await createLLMService();
    }
    return this.llmService;
  }

  /**
   * Full turn orchestration — see Dev Notes for exact execution order.
   */
  async processAction(params: ProcessActionParams): Promise<ProcessActionResult> {
    const { adventureId, userId, action, io } = params;
    // Stream whenever io is available — socketId is not needed since we emit to the room
    const shouldStream = Boolean(io);

    // 1. Load adventure + character + milestones + recent messages
    const [adventureRow] = await db
      .select()
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    if (!adventureRow) throw new AppError(404, "NOT_FOUND", "Adventure not found");
    if (adventureRow.userId !== userId) throw new AppError(403, "FORBIDDEN", "Not your adventure");
    if (adventureRow.status !== "active") {
      throw new AppError(
        400,
        "ADVENTURE_NOT_ACTIVE" as ErrorCode,
        "Cannot act on a completed adventure",
      );
    }

    const [characterRow] = await db
      .select()
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    if (!characterRow) throw new AppError(404, "NOT_FOUND", "Character not found");

    const character: AdventureCharacterDTO = {
      id: characterRow.id,
      name: characterRow.name,
      className: "Aventurier", // P1: always default
      raceName: "Humain",
      stats: characterRow.stats as AdventureCharacterDTO["stats"],
      currentHp: characterRow.currentHp,
      maxHp: characterRow.maxHp,
    };
    const worldState =
      (adventureRow.state as { worldState?: Record<string, unknown> } | null)?.worldState ?? {};

    const allMilestones = await getMilestones(adventureId);
    const activeMilestone = allMilestones.find((m) => m.status === "active") ?? null;

    const recentMessages = await db
      .select({ role: messages.role, content: messages.content, metadata: messages.metadata })
      .from(messages)
      .where(eq(messages.adventureId, adventureId))
      .orderBy(desc(messages.createdAt))
      .limit(20);
    recentMessages.reverse();

    const recentHistory: GameMessageRow[] = recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 2. Classify action + compute bonus
    const actionType = classifyAction(action);
    const characterBonus = computeCharacterBonus(character, action, recentHistory);

    // 3. D20 resolve — conditional on action type
    let d20Result: D20Result | null = null;
    let d20Block: string;

    if (actionType === "narrative") {
      // No dice roll for purely narrative actions
      d20Block = this.promptBuilder.buildSimpleInjectionBlock("narrative", action);
    } else if (actionType === "trivial") {
      // Roll computed but result not injected into prompt or stored in metadata
      this.d20.resolve({
        actionType,
        difficulty: adventureRow.difficulty as Difficulty,
        characterBonus,
      });
      d20Block = this.promptBuilder.buildSimpleInjectionBlock("trivial", action);
    } else {
      d20Result = this.d20.resolve({
        actionType,
        difficulty: adventureRow.difficulty as Difficulty,
        characterBonus,
      });
      d20Block = this.promptBuilder.buildD20InjectionBlock(d20Result, action);
    }

    // 4–6. Build prompt context
    const systemPrompt = this.promptBuilder.buildSystemPrompt({
      difficulty: adventureRow.difficulty as Difficulty,
    });
    const contextWindow = this.promptBuilder.buildContextWindow({
      systemPrompt,
      d20Block,
      playerAction: action,
      context: {
        character,
        milestones: allMilestones,
        currentMilestone: activeMilestone,
        recentHistory,
        worldState,
      },
    });

    // Separate system messages from conversation messages for LLMService
    const combinedSystemPrompt = contextWindow
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const conversationMessages = contextWindow.filter((m) => m.role !== "system");

    // 7. Insert player message
    await insertMessage({
      adventureId,
      milestoneId: activeMilestone?.id ?? null,
      role: "user",
      content: action,
      metadata: {},
    });

    // 8. Emit response-start
    const room = `adventure:${adventureId}`;
    if (shouldStream) {
      io!.to(room).emit("game:response-start", { adventureId });
    }

    // 9. Stream LLM response (or hardcoded mock in dev), emit chunks
    let fullResponse = "";

    const isMockMode = process.env["NODE_ENV"] !== "production" && params.mockLlm === true;

    if (isMockMode) {
      // DEV mock — stream hardcoded text in small chunks, no LLM call.
      const mockText =
        "[MODE MOCK] Le Chroniqueur fictif répond à votre action. " +
        "Ceci est une réponse simulée pour économiser des tokens LLM.\n\n" +
        "Vous avancez courageusement. L'aventure se poursuit...\n\n" +
        "Que souhaitez-vous faire ensuite ?";
      const chunkSize = 20;
      for (let i = 0; i < mockText.length; i += chunkSize) {
        const chunk = mockText.slice(i, i + chunkSize);
        if (shouldStream) {
          io!.to(room).emit("game:chunk", { adventureId, chunk });
        }
        fullResponse += chunk;
      }
    } else {
      const llm = await this.getLLMService();
      try {
        for await (const chunk of llm.stream({
          systemPrompt: combinedSystemPrompt,
          messages: conversationMessages,
        })) {
          if (shouldStream) {
            io!.to(room).emit("game:chunk", { adventureId, chunk });
          }
          fullResponse += chunk;
        }
      } catch (error) {
        logger.error("[GameService] LLM stream failed:", error);
        if (shouldStream) {
          io!.to(room).emit("game:error", {
            adventureId,
            error: "Le Chroniqueur est indisponible. Veuillez réessayer.",
          });
        }
        throw error;
      }
    }

    // 10. Parse signals
    const { cleanText, signals } = parseSignals(fullResponse);

    // 11. Insert assistant message
    // For narrative/trivial actions, metadata must remain empty (Story 6.4b AC #7).
    const assistantMetadata =
      d20Result === null
        ? {}
        : {
            roll: d20Result.roll,
            dc: d20Result.finalDC,
            bonus: d20Result.characterBonus,
            outcome: d20Result.outcome,
            ...(signals.milestoneCompleted && { milestoneCompleted: signals.milestoneCompleted }),
            ...(signals.hpChange !== undefined && { hpChange: signals.hpChange }),
            ...(signals.isGameOver && { isGameOver: true }),
            // Persisted for session restore on page reload (used by GET /state)
            ...(signals.choices.length > 0 && { choices: signals.choices }),
          };

    const assistantMessageId = await insertMessage({
      adventureId,
      milestoneId: activeMilestone?.id ?? null,
      role: "assistant",
      content: cleanText,
      metadata: assistantMetadata,
    });

    // 12. Apply signals (DB side effects)
    await this.applySignals(
      signals,
      adventureId,
      shouldStream
        ? ({ to: (r: string) => io!.to(r) } as unknown as import("socket.io").Server)
        : undefined,
    );

    // 13. Auto-save state
    const [updatedCharacter] = await db
      .select({ currentHp: adventureCharacters.currentHp })
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    await this.autoSave(adventureId, {
      lastPlayerAction: action,
      currentHp: updatedCharacter?.currentHp ?? character.currentHp,
      activeMilestoneId: activeMilestone?.id ?? null,
      worldState,
      updatedAt: new Date().toISOString(),
    });

    // 14. Emit response-complete
    const stateChanges = {
      ...(signals.hpChange !== undefined ? { hpChange: signals.hpChange } : {}),
      milestoneCompleted: signals.milestoneCompleted ?? null,
      adventureComplete: signals.adventureComplete,
      isGameOver: signals.isGameOver,
    };

    if (shouldStream) {
      io!.to(room).emit("game:response-complete", {
        adventureId,
        messageId: assistantMessageId,
        cleanText,
        choices: signals.choices,
        stateChanges,
      });
    }

    return shouldStream
      ? { messageId: assistantMessageId }
      : {
          messageId: assistantMessageId,
          response: { cleanText, choices: signals.choices, stateChanges },
        };
  }

  /**
   * Applies DB side effects for all 4 signal types and emits state-update events.
   */
  async applySignals(
    signals: ParsedSignals,
    adventureId: string,
    io?: Pick<import("socket.io").Server, "to">,
  ): Promise<void> {
    const room = `adventure:${adventureId}`;

    // 1. HP change
    if (signals.hpChange !== undefined) {
      const { currentHp, maxHp } = await updateCharacterHp(adventureId, signals.hpChange);
      io?.to(room).emit("game:state-update", { adventureId, type: "hp_change", currentHp, maxHp });
    }

    // 2. Milestone transition
    if (signals.milestoneCompleted) {
      const allMilestones = await getMilestones(adventureId);
      const active = allMilestones.find((m) => m.status === "active");
      const next = allMilestones.find(
        (m) => m.status === "pending" && m.sortOrder > (active?.sortOrder ?? 0),
      );
      if (active) {
        await transitionMilestone(active.id, next?.id);
        io?.to(room).emit("game:state-update", {
          adventureId,
          type: "milestone_complete",
          completedMilestone: active.name,
          nextMilestone: next?.name ?? null,
        });
      }
    }

    // 3. Adventure completion — AFTER other signals
    if (signals.adventureComplete || signals.isGameOver) {
      await this.handleAdventureEnd(adventureId, signals.isGameOver);
      io?.to(room).emit("game:state-update", {
        adventureId,
        type: signals.isGameOver ? "game_over" : "adventure_complete",
      });
    }
  }

  /**
   * Handles adventure end: marks as completed in DB and fires async narrative summary generation.
   * The summary generation is fire-and-forget — the websocket event is emitted immediately.
   */
  private async handleAdventureEnd(adventureId: string, isGameOver: boolean): Promise<void> {
    await completeAdventure(adventureId, isGameOver);

    // Non-blocking: narrative summary generated async after status is updated
    this.generateNarrativeSummary(adventureId, isGameOver).catch((err: unknown) => {
      logger.error({ err, adventureId }, "Narrative summary generation failed — non-fatal");
    });
  }

  /**
   * Generates a 2–4 sentence narrative summary via a non-streaming LLM call.
   * Tone is triumphal for success, solemn-epic for game over (GDD §6.3 — never humiliating).
   */
  private async generateNarrativeSummary(adventureId: string, isGameOver: boolean): Promise<void> {
    // Load character + milestones for prompt context
    const [characterRow] = await db
      .select()
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    const allMilestones = await getMilestones(adventureId);

    const characterName = characterRow?.name ?? "Aventurier";
    const completedMilestoneNames = allMilestones
      .filter((m) => m.status === "completed")
      .map((m) => m.name)
      .join(", ");

    const tone = isGameOver ? "solennel et épique" : "triomphant et immersif";
    const perspective = isGameOver ? "votre héritage" : "votre aventure accomplie";

    const prompt = `Tu es Le Chroniqueur. Résume ${perspective} en 2-4 phrases, sur un ton ${tone}.
Le personnage : ${characterName} (Aventurier, Humain).
Milestones accomplis : ${completedMilestoneNames || "aucun"}.
Règles : jamais humiliant, toujours épique, en français, à la 2ème personne du singulier (tutoiement), jamais de mécaniques de jeu explicites.`;

    const llm = await this.getLLMService();
    const summary = await llm.generate({
      systemPrompt: "",
      messages: [{ role: "user", content: prompt }],
      maxAttempts: 2,
    });

    await updateNarrativeSummary(adventureId, summary);
  }

  /** Updates Adventure.state JSONB snapshot after each turn. */
  async autoSave(adventureId: string, state: GameStateSnapshot): Promise<void> {
    await updateAdventureState(adventureId, state);
  }

  /**
   * Initializes milestones for an adventure via a one-shot LLM call (AC #1-4).
   * Falls back to 3 generic milestones if LLM fails — never blocks the player.
   */
  async initializeMilestones(adventure: AdventureDTO): Promise<MilestoneDTO[]> {
    const prompt = buildMilestoneInitPrompt(adventure);

    let milestoneData: Array<{ name: string; description: string }>;

    try {
      const llm = await this.getLLMService();
      const response = await llm.generateResponse({
        systemPrompt: "",
        messages: [{ role: "user", content: prompt }],
        maxAttempts: 2,
      });
      const parsed: unknown = JSON.parse(response);
      const { milestones: validated } = MilestoneInitResponseSchema.parse(parsed);
      milestoneData = validated;
    } catch (error) {
      logger.error("[GameService] initializeMilestones LLM/parse failed, using fallback:", error);
      milestoneData = FALLBACK_MILESTONES;
    }

    const rows = await db
      .insert(milestones)
      .values(
        milestoneData.map((m, i) => ({
          adventureId: adventure.id,
          name: m.name,
          description: m.description,
          sortOrder: i,
          status: (i === 0 ? "active" : "pending") as "active" | "pending",
        })),
      )
      .returning();

    return rows.map((r) => {
      const dto: MilestoneDTO = {
        id: r.id,
        name: r.name,
        sortOrder: r.sortOrder,
        status: r.status,
      };
      if (r.description) dto.description = r.description;
      return dto;
    });
  }

  /**
   * Returns the full game state for GET /api/adventures/:id/state (AC #5).
   * Triggers initializeMilestones() if no milestones exist yet.
   */
  async getState(adventureId: string, userId: string): Promise<GameStateDTO> {
    // 1. Load adventure — 404/403 guards
    const [adventureRow] = await db
      .select()
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    if (!adventureRow) throw new AppError(404, "NOT_FOUND", "Adventure not found");
    if (adventureRow.userId !== userId) throw new AppError(403, "FORBIDDEN", "Not your adventure");

    // 2. Load character
    const [characterRow] = await db
      .select()
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    // 3. Load last 50 messages ordered createdAt ASC
    const messageRows = await db
      .select()
      .from(messages)
      .where(eq(messages.adventureId, adventureId))
      .orderBy(desc(messages.createdAt))
      .limit(50);
    messageRows.reverse();

    // 4. Load milestones — initialize if empty
    let allMilestones = await getMilestones(adventureId);

    if (allMilestones.length === 0) {
      const adventureDTO = buildAdventureDTO(adventureRow, characterRow);
      allMilestones = await this.initializeMilestones(adventureDTO);
    }

    // 5. Build response DTOs
    const activeMilestone = allMilestones.find((m) => m.status === "active") ?? null;
    const adventureDTO = buildAdventureDTO(
      adventureRow,
      characterRow,
      activeMilestone?.name ?? null,
    );

    const gameMessages: GameMessageDTO[] = messageRows.map((m) => {
      const meta = m.metadata as Record<string, unknown> | null;
      const dto: GameMessageDTO = {
        id: m.id,
        role: m.role,
        content: m.content,
        milestoneId: m.milestoneId ?? null,
        createdAt: m.createdAt.toISOString(),
      };
      if (Array.isArray(meta?.choices) && meta.choices.length > 0) {
        dto.choices = meta.choices as SuggestedAction[];
      }
      return dto;
    });

    return {
      adventure: adventureDTO,
      messages: gameMessages,
      milestones: allMilestones,
      isStreaming: false,
    };
  }

  /**
   * Returns messages for GET /api/adventures/:id/messages (AC #6).
   * Optionally filtered by milestoneId; limit 100, ordered createdAt ASC.
   */
  async getMessages(
    adventureId: string,
    userId: string,
    milestoneId?: string,
  ): Promise<{ messages: GameMessageDTO[]; total: number }> {
    // Single query — applicative 404/403 check (mirrors processAction pattern)
    const [adventureRow] = await db
      .select({ id: adventures.id, userId: adventures.userId })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    if (!adventureRow) throw new AppError(404, "NOT_FOUND", "Adventure not found");
    if (adventureRow.userId !== userId) throw new AppError(403, "FORBIDDEN", "Not your adventure");

    const rows = await db
      .select()
      .from(messages)
      .where(
        milestoneId
          ? and(eq(messages.adventureId, adventureId), eq(messages.milestoneId, milestoneId))
          : eq(messages.adventureId, adventureId),
      )
      .orderBy(asc(messages.createdAt))
      .limit(100);

    const gameMsgs: GameMessageDTO[] = rows.map((m) => {
      const meta = m.metadata as Record<string, unknown> | null;
      const dto: GameMessageDTO = {
        id: m.id,
        role: m.role,
        content: m.content,
        milestoneId: m.milestoneId ?? null,
        createdAt: m.createdAt.toISOString(),
      };
      if (Array.isArray(meta?.choices) && meta.choices.length > 0) {
        dto.choices = meta.choices as SuggestedAction[];
      }
      return dto;
    });

    return { messages: gameMsgs, total: gameMsgs.length };
  }
}

export const gameService = new GameService();
