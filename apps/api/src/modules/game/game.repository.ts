/**
 * game.repository.ts — DB queries for the game module (Story 6.3a Task 3).
 * All queries are narrow, single-responsibility functions.
 */
import { and, asc, desc, eq, sql } from "drizzle-orm";

import type { MilestoneDTO } from "@jdrai/shared";

import { LIMITS, MILESTONE_STATUS } from "@/config/enums";
import { db } from "@/db";
import {
  adventureCharacters,
  adventures,
  messages,
  milestones,
} from "@/db/schema";
import { AppErrors } from "@/utils/errors";

import { toMilestoneDTO } from "./game.dto";

// ---------------------------------------------------------------------------
// Row types (inferred from schema)
// ---------------------------------------------------------------------------

export type AdventureRow = typeof adventures.$inferSelect;
export type AdventureCharacterRow = typeof adventureCharacters.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InsertMessageData {
  adventureId: string;
  milestoneId: string | null;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
}

export interface GameStateSnapshot {
  lastPlayerAction: string;
  currentHp: number;
  activeMilestoneId: string | null;
  worldState: Record<string, unknown>;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Milestone queries
// ---------------------------------------------------------------------------

/** Returns all milestones for an adventure ordered by sortOrder ASC. */
export async function getMilestones(adventureId: string): Promise<MilestoneDTO[]> {
  const rows = await db
    .select()
    .from(milestones)
    .where(eq(milestones.adventureId, adventureId))
    .orderBy(asc(milestones.sortOrder));

  return rows.map(toMilestoneDTO);
}

/** Returns the active milestone for an adventure, or null if none. */
export async function getActiveMilestone(adventureId: string): Promise<MilestoneDTO | null> {
  const [row] = await db
    .select()
    .from(milestones)
    .where(
      and(
        eq(milestones.adventureId, adventureId),
        eq(milestones.status, MILESTONE_STATUS.ACTIVE),
      ),
    )
    .limit(1);

  if (!row) return null;
  return toMilestoneDTO(row);
}

/**
 * Transitions a completed milestone and optionally activates the next one.
 * Both updates run in a single DB transaction.
 */
export async function transitionMilestone(
  completedId: string,
  nextId?: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(milestones)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(milestones.id, completedId));

    if (nextId) {
      await tx
        .update(milestones)
        .set({ status: "active", startedAt: new Date() })
        .where(eq(milestones.id, nextId));
    }
  });
}

// ---------------------------------------------------------------------------
// Message queries
// ---------------------------------------------------------------------------

/** Inserts a game message and returns its new ID. */
export async function insertMessage(data: InsertMessageData): Promise<string> {
  const [row] = await db
    .insert(messages)
    .values({
      adventureId: data.adventureId,
      milestoneId: data.milestoneId ?? null,
      role: data.role,
      content: data.content,
      metadata: data.metadata ?? {},
    })
    .returning({ id: messages.id });
  return row!.id;
}

// ---------------------------------------------------------------------------
// Character / HP queries
// ---------------------------------------------------------------------------

/**
 * Applies hpChange to the adventure character, clamping between 0 and maxHp.
 * Returns the resulting currentHp and maxHp values.
 */
export async function updateCharacterHp(
  adventureId: string,
  hpChange: number,
): Promise<{ currentHp: number; maxHp: number }> {
  const [row] = await db
    .update(adventureCharacters)
    .set({
      currentHp: sql<number>`GREATEST(0, LEAST(max_hp, current_hp + ${hpChange}))`,
    })
    .where(eq(adventureCharacters.adventureId, adventureId))
    .returning({
      currentHp: adventureCharacters.currentHp,
      maxHp: adventureCharacters.maxHp,
    });
  return row!;
}

// ---------------------------------------------------------------------------
// Adventure state queries
// ---------------------------------------------------------------------------

/**
 * Updates Adventure.state JSONB.
 *
 * Two modes:
 *  - Full snapshot (default): replaces state with a GameStateSnapshot and refreshes lastPlayedAt.
 *  - Patch (`{ patch: true }`): writes the raw JSON object as state without touching lastPlayedAt.
 *    Used for in-turn updates (e.g. tutorialChoices capture).
 */
export async function updateAdventureState(
  adventureId: string,
  state: GameStateSnapshot,
): Promise<void>;
export async function updateAdventureState(
  adventureId: string,
  state: Record<string, unknown>,
  options: { patch: true },
): Promise<void>;
export async function updateAdventureState(
  adventureId: string,
  state: GameStateSnapshot | Record<string, unknown>,
  options?: { patch?: boolean },
): Promise<void> {
  if (options?.patch) {
    await db
      .update(adventures)
      .set({ state })
      .where(eq(adventures.id, adventureId));
    return;
  }
  await db
    .update(adventures)
    .set({ state, lastPlayedAt: new Date(), updatedAt: new Date() })
    .where(eq(adventures.id, adventureId));
}

/** Marks an adventure as completed (or game_over). Sets isGameOver column + JSONB for backwards compat. */
export async function completeAdventure(
  adventureId: string,
  isGameOver: boolean,
): Promise<void> {
  await db
    .update(adventures)
    .set({
      status: "completed",
      completedAt: new Date(),
      isGameOver,
      updatedAt: new Date(),
      state: sql`jsonb_set(${adventures.state}, '{completion}', ${JSON.stringify({
        isGameOver,
      })}::jsonb, true)`,
    })
    .where(eq(adventures.id, adventureId));
}

/** Updates the narrativeSummary column after async LLM generation. */
export async function updateNarrativeSummary(
  adventureId: string,
  summary: string,
): Promise<void> {
  await db
    .update(adventures)
    .set({ narrativeSummary: summary, updatedAt: new Date() })
    .where(eq(adventures.id, adventureId));
}

// ---------------------------------------------------------------------------
// Adventure / character / message reads (Phase 3 — centralisation)
// ---------------------------------------------------------------------------

/** Returns a single adventure by id, or null if not found. */
export async function getAdventureById(id: string): Promise<AdventureRow | null> {
  const [row] = await db.select().from(adventures).where(eq(adventures.id, id)).limit(1);
  return row ?? null;
}

/**
 * Returns the adventure if it exists AND belongs to userId.
 * Throws AppErrors.adventureNotFound() (404) when missing,
 * AppErrors.notYourAdventure() (403) when owned by another user.
 *
 * Use this everywhere we need both 404 and 403 in a single call.
 */
export async function getAdventureByIdOrThrow(
  id: string,
  userId: string,
): Promise<AdventureRow> {
  const row = await getAdventureById(id);
  if (!row) throw AppErrors.adventureNotFound();
  if (row.userId !== userId) throw AppErrors.notYourAdventure();
  return row;
}

/**
 * Lightweight ownership check — true iff (adventureId, userId) exists.
 * Used by Socket.io game:join where we only need a boolean.
 */
export async function verifyAdventureOwnership(
  adventureId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: adventures.id })
    .from(adventures)
    .where(and(eq(adventures.id, adventureId), eq(adventures.userId, userId)))
    .limit(1);
  return Boolean(row);
}

/** Returns the adventure character row for a given adventure, or null. */
export async function getAdventureCharacter(
  adventureId: string,
): Promise<AdventureCharacterRow | null> {
  const [row] = await db
    .select()
    .from(adventureCharacters)
    .where(eq(adventureCharacters.adventureId, adventureId))
    .limit(1);
  return row ?? null;
}

export interface GetMessagesOptions {
  /** Maximum number of rows to return. Defaults to LIMITS.GET_MESSAGES_PAGE_SIZE. */
  limit?: number;
  /** When provided, restricts results to a single milestone. */
  milestoneId?: string;
  /** Sort order on createdAt. Defaults to "asc". */
  order?: "asc" | "desc";
}

/**
 * Generic message fetch — covers GET /messages, getState, and the recent
 * window used by processAction (via getRecentMessages).
 */
export async function getMessages(
  adventureId: string,
  options: GetMessagesOptions = {},
): Promise<MessageRow[]> {
  const limit = options.limit ?? LIMITS.GET_MESSAGES_PAGE_SIZE;
  const order = options.order ?? "asc";

  const where = options.milestoneId
    ? and(
        eq(messages.adventureId, adventureId),
        eq(messages.milestoneId, options.milestoneId),
      )
    : eq(messages.adventureId, adventureId);

  return db
    .select()
    .from(messages)
    .where(where)
    .orderBy(order === "asc" ? asc(messages.createdAt) : desc(messages.createdAt))
    .limit(limit);
}

/**
 * Returns the most recent N messages ordered chronologically (ASC).
 * Implemented as a DESC query on createdAt + reverse to keep DB index usage.
 * Defaults to LIMITS.RECENT_MESSAGES_FOR_ACTION when limit is omitted.
 */
export async function getRecentMessages(
  adventureId: string,
  limit: number = LIMITS.RECENT_MESSAGES_FOR_ACTION,
): Promise<MessageRow[]> {
  const rows = await getMessages(adventureId, { limit, order: "desc" });
  return rows.reverse();
}
