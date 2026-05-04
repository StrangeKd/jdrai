/**
 * GameService — orchestrates a full game turn (Story 6.3a Task 2).
 * Processes player action: D20 → prompt build → LLM stream → signal parse → DB persist.
 *
 * Transport-agnostic: emits typed `GameEvent`s via an optional `onEvent` callback
 * (Group C / Phase 4). The Socket.io handler and HTTP controller adapt these
 * events to their respective transports — the service no longer imports socket.io.
 */
/* eslint-disable simple-import-sort/imports */
import { z } from "zod";

import type {
  AdventureCharacterDTO,
  AdventureDTO,
  Difficulty,
  GameEvent,
  GameMessageDTO,
  GameStateDTO,
  MilestoneDTO,
} from "@jdrai/shared";

import { ADVENTURE_STATUS, LIMITS } from "@/config/enums";
import { db } from "@/db";
import { milestones } from "@/db/schema";
import { logger } from "@/utils/logger";
import { AppErrors } from "@/utils/errors";
import { getCurrentISOString } from "@/utils/http";

import { D20Service, type ActionType, type D20Result } from "./d20.service";
import { toAdventureCharacterDTO } from "./game.dto";
import {
  completeAdventure,
  getAdventureByIdOrThrow,
  getAdventureCharacter,
  getMessages,
  getMilestones,
  getRecentMessages,
  insertMessage,
  transitionMilestone,
  updateAdventureState,
  updateCharacterHp,
  updateNarrativeSummary,
  type AdventureCharacterRow,
  type AdventureRow,
  type GameStateSnapshot,
  type MessageRow,
} from "./game.repository";
import { LLMService, createLLMService } from "./llm/index";
import { PromptBuilder } from "./prompt-builder";
import { getRaceById, getClassById } from "@/modules/reference/reference.repository";
import { usersRepository } from "@/modules/users/users.repository";
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
  adventureRow: AdventureRow,
  characterRow: AdventureCharacterRow | null,
  currentMilestoneName: string | null = null,
): AdventureDTO {
  const characterDTO = toAdventureCharacterDTO(characterRow);

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
    isTutorial: adventureRow.isTutorial ?? false,
  };

  if (adventureRow.tone) dto.tone = adventureRow.tone as AdventureDTO["tone"];
  if (adventureRow.narrativeSummary) dto.narrativeSummary = adventureRow.narrativeSummary;

  return dto;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Transport-agnostic event sink. The HTTP controller passes a no-op for
 * non-streaming requests; the Socket.io handler forwards events to a room.
 *
 * Design note (Phase 4): we chose a synchronous callback (Option B) over
 * AsyncIterable because the LLM streaming loop already uses `for await` —
 * a callback integrates with zero plumbing and avoids buffering / back-pressure
 * concerns. Forwarding remains 1:1 with no ordering surprises.
 */
export type GameEventSink = (event: GameEvent) => void;

export interface ProcessActionParams {
  adventureId: string;
  userId: string;
  action: string;
  choiceId?: string | undefined;
  /** Distinguishes a tutorial preset selection (race/class) from a regular suggested choice. */
  choiceType?: "race" | "class" | undefined;
  /** Sink for streaming/state events. When omitted, processAction runs in sync mode. */
  onEvent?: GameEventSink | undefined;
  /** When true, processAction streams chunk events via onEvent (otherwise the full
   *  response is returned in the result). Default: derived from `Boolean(onEvent)`. */
  stream?: boolean | undefined;
  /** DEV only — bypasses LLM and returns hardcoded text to save tokens during manual testing. */
  mockLlm?: boolean | undefined;
  /** DEV only — routes to LLM_FREE_MODEL_KEY (OpenRouter free tier) instead of primary provider. */
  freeModels?: boolean | undefined;
}

export interface ProcessActionResult {
  messageId: string;
  response?: ProcessActionResponse;
}

export interface ProcessActionResponse {
  cleanText: string;
  choices: SuggestedAction[];
  presetSelector?: "race" | "class";
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
  /** Present when the LLM emitted [SHOW_PRESET_SELECTOR:race|class] in a tutorial adventure. */
  presetSelector?: "race" | "class";
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
  SHOW_PRESET_SELECTOR: /\[SHOW_PRESET_SELECTOR:(race|class)\]/,
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

  // Tutorial signal — [SHOW_PRESET_SELECTOR:race|class]
  const presetMatch = SIGNAL_PATTERNS.SHOW_PRESET_SELECTOR.exec(rawText);
  if (presetMatch) {
    signals.presetSelector = presetMatch[1] as "race" | "class";
  }

  const cleanText = rawText
    .replace(/\[MILESTONE_COMPLETE:[^\]]+\]/g, "")
    .replace(/\[HP_CHANGE:[+-]?\d+\]/g, "")
    .replace(/\[ADVENTURE_COMPLETE\]/g, "")
    .replace(/\[GAME_OVER\]/g, "")
    .replace(/\[CHOIX\][\s\S]*?\[\/CHOIX\]/g, "")
    .replace(/\[SHOW_PRESET_SELECTOR:[^\]]+\]/g, "")
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
   * Lightweight check used by Socket.io game:join.
   * Returns true iff the user owns the adventure.
   */
  async canUserJoinAdventure(adventureId: string, userId: string): Promise<boolean> {
    // Imported here to keep the call cheap (no JOIN, no full row).
    const { verifyAdventureOwnership } = await import("./game.repository");
    return verifyAdventureOwnership(adventureId, userId);
  }

  /**
   * Validates ownership + status for the save endpoint, then calls autoSave().
   * Centralises the logic previously inlined in postSaveHandler.
   */
  async saveAdventure(adventureId: string, userId: string): Promise<{ savedAt: string }> {
    const adventure = await getAdventureByIdOrThrow(adventureId, userId);
    if (adventure.status !== ADVENTURE_STATUS.ACTIVE) {
      throw AppErrors.adventureNotActive();
    }

    const character = await getAdventureCharacter(adventureId);

    const previousState = (adventure.state ?? {}) as Record<string, unknown>;
    const worldState =
      typeof previousState["worldState"] === "object" &&
      previousState["worldState"] !== null &&
      !Array.isArray(previousState["worldState"])
        ? (previousState["worldState"] as Record<string, unknown>)
        : {};

    await this.autoSave(adventureId, {
      lastPlayerAction:
        typeof previousState["lastPlayerAction"] === "string"
          ? previousState["lastPlayerAction"]
          : "",
      currentHp:
        character?.currentHp ??
        (typeof previousState["currentHp"] === "number" ? previousState["currentHp"] : 0),
      activeMilestoneId:
        typeof previousState["activeMilestoneId"] === "string"
          ? previousState["activeMilestoneId"]
          : null,
      worldState,
      updatedAt: getCurrentISOString(),
    });

    return { savedAt: getCurrentISOString() };
  }

  /**
   * Full turn orchestration — see Dev Notes for exact execution order.
   * Emits typed GameEvents via params.onEvent (no Socket.io coupling).
   */
  async processAction(params: ProcessActionParams): Promise<ProcessActionResult> {
    const { adventureId, userId, action, onEvent, choiceType, choiceId } = params;
    const shouldStream = params.stream ?? Boolean(onEvent);
    const emit: GameEventSink = onEvent ?? (() => {});

    // 1. Load adventure + character + milestones + recent messages
    const adventureRow = await getAdventureByIdOrThrow(adventureId, userId);
    if (adventureRow.status !== ADVENTURE_STATUS.ACTIVE) {
      throw AppErrors.adventureNotActive();
    }

    const characterRow = await getAdventureCharacter(adventureId);
    if (!characterRow) throw AppErrors.characterNotFound();

    const character: AdventureCharacterDTO = {
      id: characterRow.id,
      name: characterRow.name,
      className: "Aventurier", // P1: always default
      raceName: "Humain",
      stats: characterRow.stats as AdventureCharacterDTO["stats"],
      currentHp: characterRow.currentHp,
      maxHp: characterRow.maxHp,
    };
    let latestState = (adventureRow.state ?? {}) as Record<string, unknown>;
    const worldState = (latestState["worldState"] as Record<string, unknown> | undefined) ?? {};

    const allMilestones = await getMilestones(adventureId);
    const activeMilestone = allMilestones.find((m) => m.status === "active") ?? null;

    const recentMessageRows = await getRecentMessages(adventureId);
    const recentHistory: GameMessageRow[] = recentMessageRows.map((m) => ({
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

    // Handle tutorial preset choice capture (race/class) BEFORE building the prompt
    if (adventureRow.isTutorial && choiceType && choiceId) {
      latestState = await this.captureTutorialPresetChoice(
        adventureRow.id,
        latestState,
        choiceType,
        choiceId,
      );
    }

    // 4–6. Build prompt context — tutorial uses a dedicated system prompt
    const systemPrompt = adventureRow.isTutorial
      ? this.promptBuilder.buildTutorialSystemPrompt()
      : this.promptBuilder.buildSystemPrompt({ difficulty: adventureRow.difficulty as Difficulty });
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
    if (shouldStream) {
      emit({ type: "response-start", adventureId });
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
          emit({ type: "chunk", adventureId, chunk });
        }
        fullResponse += chunk;
      }
    } else {
      const llm = await this.getLLMService();
      const freeModelKey =
        process.env["NODE_ENV"] !== "production" && params.freeModels
          ? (process.env["LLM_FREE_MODEL_KEY"] ?? undefined)
          : undefined;
      try {
        for await (const chunk of llm.stream({
          systemPrompt: combinedSystemPrompt,
          messages: conversationMessages,
          ...(freeModelKey ? { modelKey: freeModelKey } : {}),
        })) {
          if (shouldStream) {
            emit({ type: "chunk", adventureId, chunk });
          }
          fullResponse += chunk;
        }
      } catch (error) {
        logger.error("[GameService] LLM stream failed:", error);
        if (shouldStream) {
          emit({
            type: "error",
            adventureId,
            message: "Le Chroniqueur est indisponible. Veuillez réessayer.",
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

    // 12. Apply signals (DB side effects + emit state-update events)
    await this.applySignals(signals, adventureId, emit);

    // 12b. Tutorial completion — create MetaCharacter when [ADVENTURE_COMPLETE] on a tutorial
    if (adventureRow.isTutorial && signals.adventureComplete) {
      const choices = (latestState["tutorialChoices"] ?? {}) as Record<string, string>;

      const userRow = await usersRepository.findById(userId);

      const { metaCharacterService } = await import("@/modules/meta-character/meta-character.service");
      await metaCharacterService.createFromTutorial({
        userId,
        username: userRow?.username ?? "Aventurier",
        raceId: choices["raceId"],
        classId: choices["classId"],
      });

      // Set user onboarding as completed
      await usersRepository.updateOnboardingStatus(userId, true);
    }

    // 13. Auto-save state
    const updatedCharacter = await getAdventureCharacter(adventureId);

    await this.autoSave(adventureId, {
      lastPlayerAction: action,
      currentHp: updatedCharacter?.currentHp ?? character.currentHp,
      activeMilestoneId: activeMilestone?.id ?? null,
      worldState,
      updatedAt: getCurrentISOString(),
    });

    // 14. Emit response-complete
    const stateChanges = {
      ...(signals.hpChange !== undefined ? { hpChange: signals.hpChange } : {}),
      milestoneCompleted: signals.milestoneCompleted ?? null,
      adventureComplete: signals.adventureComplete,
      isGameOver: signals.isGameOver,
    };

    if (shouldStream) {
      emit({
        type: "response-complete",
        adventureId,
        messageId: assistantMessageId,
        cleanText,
        choices: signals.choices,
        ...(signals.presetSelector ? { presetSelector: signals.presetSelector } : {}),
        stateChanges,
      });
    }

    return shouldStream
      ? { messageId: assistantMessageId }
      : {
          messageId: assistantMessageId,
          response: {
            cleanText,
            choices: signals.choices,
            ...(signals.presetSelector ? { presetSelector: signals.presetSelector } : {}),
            stateChanges,
          },
        };
  }

  /**
   * Applies DB side effects for all 4 signal types and emits state-update events.
   *
   * The third parameter accepts either:
   *  - a `GameEventSink` callback (preferred, decoupled), or
   *  - a Socket.io-shaped object `{ to: (room) => { emit: ... } }` for backwards compatibility
   *    with `dev.router.ts` and existing integration tests.
   */
  async applySignals(
    signals: ParsedSignals,
    adventureId: string,
    sinkOrIo?:
      | GameEventSink
      | Pick<import("socket.io").Server, "to">
      | undefined,
  ): Promise<void> {
    const emit = toEventSink(sinkOrIo, adventureId);

    // 1. HP change
    if (signals.hpChange !== undefined) {
      const { currentHp, maxHp } = await updateCharacterHp(adventureId, signals.hpChange);
      emit({
        type: "state-update",
        adventureId,
        subtype: "hp_change",
        currentHp,
        maxHp,
      });
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
        emit({
          type: "state-update",
          adventureId,
          subtype: "milestone_complete",
          completedMilestone: active.name,
          nextMilestone: next?.name ?? null,
        });
      }
    }

    // 3. Adventure completion — AFTER other signals
    if (signals.adventureComplete || signals.isGameOver) {
      await this.handleAdventureEnd(adventureId, signals.isGameOver);
      emit({
        type: "state-update",
        adventureId,
        subtype: signals.isGameOver ? "game_over" : "adventure_complete",
      });
    }
  }

  /**
   * Captures a tutorial preset choice (race or class) into Adventure.state.tutorialChoices.
   * Called before the LLM turn when PlayerActionInput includes choiceType + choiceId.
   */
  private async captureTutorialPresetChoice(
    adventureId: string,
    currentState: Record<string, unknown>,
    choiceType: "race" | "class",
    choiceId: string,
  ): Promise<Record<string, unknown>> {
    const tutorialChoices = (currentState["tutorialChoices"] ?? {}) as Record<string, string>;

    if (choiceType === "race") {
      const race = await getRaceById(choiceId);
      if (!race) return currentState;
      tutorialChoices["raceId"] = choiceId;
      tutorialChoices["raceName"] = race.name;
    } else {
      const cls = await getClassById(choiceId);
      if (!cls) return currentState;
      tutorialChoices["classId"] = choiceId;
      tutorialChoices["className"] = cls.name;
    }

    const nextState = { ...currentState, tutorialChoices };

    await updateAdventureState(adventureId, nextState, { patch: true });

    return nextState;
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
    const characterRow = await getAdventureCharacter(adventureId);
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
  async initializeMilestones(adventure: AdventureDTO, mockLlm = false): Promise<MilestoneDTO[]> {
    let milestoneData: Array<{ name: string; description: string }>;

    if (process.env["NODE_ENV"] !== "production" && mockLlm) {
      // DEV mock — use fallback milestones directly, no LLM call.
      milestoneData = FALLBACK_MILESTONES;
    } else {
      const prompt = buildMilestoneInitPrompt(adventure);
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
    }

    // Insertion stays inline here — adventure-scoped seed, not reused elsewhere.
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
  async getState(adventureId: string, userId: string, mockLlm = false): Promise<GameStateDTO> {
    // 1. Load adventure — 404/403 guards
    const adventureRow = await getAdventureByIdOrThrow(adventureId, userId);

    // 2. Load character
    const characterRow = await getAdventureCharacter(adventureId);

    // 3. Load last 50 messages ordered createdAt ASC (DESC + reverse for index usage)
    const messageRowsDesc = await getMessages(adventureId, {
      limit: LIMITS.STATE_RESYNC_MESSAGE_COUNT,
      order: "desc",
    });
    const messageRows = [...messageRowsDesc].reverse();

    // 4. Load milestones — initialize if empty (tutorial milestones are pre-seeded; skip LLM)
    let allMilestones = await getMilestones(adventureId);

    if (allMilestones.length === 0 && !adventureRow.isTutorial) {
      const adventureDTO = buildAdventureDTO(adventureRow, characterRow);
      allMilestones = await this.initializeMilestones(adventureDTO, mockLlm);
    }

    // 5. Build response DTOs
    const activeMilestone = allMilestones.find((m) => m.status === "active") ?? null;
    const adventureDTO = buildAdventureDTO(
      adventureRow,
      characterRow,
      activeMilestone?.name ?? null,
    );

    return {
      adventure: adventureDTO,
      messages: messageRows.map(messageRowToDTO),
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
    await getAdventureByIdOrThrow(adventureId, userId);

    const rows = await getMessages(adventureId, {
      ...(milestoneId ? { milestoneId } : {}),
      limit: LIMITS.GET_MESSAGES_PAGE_SIZE,
      order: "asc",
    });

    const gameMsgs = rows.map(messageRowToDTO);
    return { messages: gameMsgs, total: gameMsgs.length };
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Adapts the legacy `Pick<Server, "to">` shape used by integration tests and
 * dev.router.ts into a `GameEventSink`. When the caller already provides a
 * sink, returns it unchanged. When undefined, returns a no-op.
 *
 * State-update events are mapped to `game:state-update` Socket.io events with
 * a `type` field equal to the event subtype (preserves wire format).
 */
function toEventSink(
  sinkOrIo: GameEventSink | Pick<import("socket.io").Server, "to"> | undefined,
  adventureId: string,
): GameEventSink {
  if (!sinkOrIo) return () => {};
  if (typeof sinkOrIo === "function") return sinkOrIo;

  const room = `adventure:${adventureId}`;
  return (event: GameEvent) => {
    if (event.type === "state-update") {
      // Preserve historical wire format: { type: <subtype>, ...payload }
      const { type: _t, subtype, adventureId: aid, ...rest } = event;
      sinkOrIo.to(room).emit("game:state-update", {
        adventureId: aid,
        type: subtype,
        ...rest,
      });
      return;
    }
    if (event.type === "response-start") {
      sinkOrIo.to(room).emit("game:response-start", { adventureId: event.adventureId });
      return;
    }
    if (event.type === "chunk") {
      sinkOrIo.to(room).emit("game:chunk", { adventureId: event.adventureId, chunk: event.chunk });
      return;
    }
    if (event.type === "response-complete") {
      const { type: _t2, ...payload } = event;
      sinkOrIo.to(room).emit("game:response-complete", payload);
      return;
    }
    if (event.type === "error") {
      sinkOrIo.to(room).emit("game:error", {
        adventureId: event.adventureId,
        error: event.message,
      });
      return;
    }
  };
}

/** Maps a message row to a GameMessageDTO; preserves the persisted `choices` array. */
function messageRowToDTO(m: MessageRow): GameMessageDTO {
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
}

export const gameService = new GameService();
