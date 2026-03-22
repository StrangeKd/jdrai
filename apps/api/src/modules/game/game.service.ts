/**
 * GameService — orchestrates a full game turn (Story 6.3a Task 2).
 * Processes player action: D20 → prompt build → LLM stream → signal parse → DB persist.
 */
/* eslint-disable simple-import-sort/imports */
import { and, desc, eq } from "drizzle-orm";

import type { AdventureCharacterDTO, Difficulty, ErrorCode } from "@jdrai/shared";

import { db } from "@/db";
import { adventureCharacters, adventures, messages } from "@/db/schema";
import { AppError } from "@/utils/errors";

import { D20Service, type ActionType } from "./d20.service";
import {
  completeAdventure,
  getActiveMilestone,
  getMilestones,
  insertMessage,
  transitionMilestone,
  updateAdventureState,
  updateCharacterHp,
  type GameStateSnapshot,
} from "./game.repository";
import { LLMService, createLLMService } from "./llm/index";
import { PromptBuilder } from "./prompt-builder";
/* eslint-enable simple-import-sort/imports */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProcessActionParams {
  adventureId: string;
  userId: string;
  action: string;
  choiceId?: string;
  socketId?: string;
  io?: import("socket.io").Server;
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
  if (/enchant|magie|sort |spell|forcer|enfonc|désamorc/.test(lower)) return "very_hard";
  if (/attaqu|combat|intimid|piège|trap/.test(lower)) return "hard";
  if (/parle|discut|négoci|regard|observ|examin/.test(lower)) return "easy";
  if (/ouvrir|march|vais|aller vers|se dirig/.test(lower)) return "trivial";
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
    const { adventureId, userId, action, io, socketId } = params;
    const shouldStream = Boolean(io && socketId);

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

    // 3. D20 resolve
    const d20Result = this.d20.resolve({
      actionType,
      difficulty: adventureRow.difficulty as Difficulty,
      characterBonus,
    });

    // 4–6. Build prompt context
    const systemPrompt = this.promptBuilder.buildSystemPrompt({
      difficulty: adventureRow.difficulty as Difficulty,
    });
    const d20Block = this.promptBuilder.buildD20InjectionBlock(d20Result, action);
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

    // 9. Stream LLM response, emit chunks
    const llm = await this.getLLMService();
    let fullResponse = "";
    for await (const chunk of llm.stream({
      systemPrompt: combinedSystemPrompt,
      messages: conversationMessages,
    })) {
      if (shouldStream) {
        io!.to(room).emit("game:chunk", { adventureId, chunk });
      }
      fullResponse += chunk;
    }

    // 10. Parse signals
    const { cleanText, signals } = parseSignals(fullResponse);

    // 11. Insert assistant message
    const assistantMessageId = await insertMessage({
      adventureId,
      milestoneId: activeMilestone?.id ?? null,
      role: "assistant",
      content: cleanText,
      metadata: {
        roll: d20Result.roll,
        dc: d20Result.finalDC,
        bonus: d20Result.characterBonus,
        outcome: d20Result.outcome,
        ...(signals.milestoneCompleted && { milestoneCompleted: signals.milestoneCompleted }),
        ...(signals.hpChange !== undefined && { hpChange: signals.hpChange }),
        ...(signals.isGameOver && { isGameOver: true }),
      },
    });

    // 12. Apply signals (DB side effects)
    await this.applySignals(
      signals,
      adventureId,
      shouldStream ? ({ to: (r: string) => io!.to(r) } as unknown as import("socket.io").Server) : undefined,
    );

    // 13. Auto-save state
    const [updatedCharacter] = await db
      .select({ currentHp: adventureCharacters.currentHp })
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    const updatedActiveMilestone = await getActiveMilestone(adventureId);

    await this.autoSave(adventureId, {
      lastPlayerAction: action,
      currentHp: updatedCharacter?.currentHp ?? character.currentHp,
      activeMilestoneId: updatedActiveMilestone?.id ?? null,
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
      await completeAdventure(adventureId, signals.isGameOver);
      io?.to(room).emit("game:state-update", {
        adventureId,
        type: signals.isGameOver ? "game_over" : "adventure_complete",
      });
    }
  }

  /** Updates Adventure.state JSONB snapshot after each turn. */
  async autoSave(adventureId: string, state: GameStateSnapshot): Promise<void> {
    await updateAdventureState(adventureId, state);
  }

  /**
   * Returns the current game state for a given adventure.
   * Used by game:resync (Story 6.8 placeholder).
   */
  async getState(adventureId: string, userId: string) {
    const [adventureRow] = await db
      .select()
      .from(adventures)
      .where(and(eq(adventures.id, adventureId), eq(adventures.userId, userId)))
      .limit(1);

    if (!adventureRow) throw new AppError(404, "NOT_FOUND", "Adventure not found");

    const activeMilestone = await getActiveMilestone(adventureId);
    const [characterRow] = await db
      .select({ currentHp: adventureCharacters.currentHp, maxHp: adventureCharacters.maxHp })
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    return {
      adventureId,
      status: adventureRow.status,
      activeMilestone,
      currentHp: characterRow?.currentHp ?? 20,
      maxHp: characterRow?.maxHp ?? 20,
      state: adventureRow.state,
    };
  }
}

export const gameService = new GameService();
