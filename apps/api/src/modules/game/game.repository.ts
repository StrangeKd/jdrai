/**
 * game.repository.ts — DB queries for the game module (Story 6.3a Task 3).
 * All queries are narrow, single-responsibility functions.
 */
import { and, asc, eq, sql } from "drizzle-orm";

import type { MilestoneDTO } from "@jdrai/shared";

import { db } from "@/db";
import {
  adventureCharacters,
  adventures,
  messages,
  milestones,
} from "@/db/schema";

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

  return rows.map((r) => {
    const dto: MilestoneDTO = {
      id: r.id,
      name: r.name,
      sortOrder: r.sortOrder,
      status: r.status,
    };
    if (r.description) dto.description = r.description;
    if (r.startedAt) dto.startedAt = r.startedAt.toISOString();
    if (r.completedAt) dto.completedAt = r.completedAt.toISOString();
    return dto;
  });
}

/** Returns the active milestone for an adventure, or null if none. */
export async function getActiveMilestone(adventureId: string): Promise<MilestoneDTO | null> {
  const [row] = await db
    .select()
    .from(milestones)
    .where(and(eq(milestones.adventureId, adventureId), eq(milestones.status, "active")))
    .limit(1);

  if (!row) return null;

  const dto: MilestoneDTO = {
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    status: row.status,
  };
  if (row.description) dto.description = row.description;
  if (row.startedAt) dto.startedAt = row.startedAt.toISOString();
  if (row.completedAt) dto.completedAt = row.completedAt.toISOString();
  return dto;
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

/** Updates Adventure.state JSONB and lastPlayedAt after each completed turn. */
export async function updateAdventureState(
  adventureId: string,
  state: GameStateSnapshot,
): Promise<void> {
  await db
    .update(adventures)
    .set({ state, lastPlayedAt: new Date(), updatedAt: new Date() })
    .where(eq(adventures.id, adventureId));
}

/** Marks an adventure as completed (or game_over). */
export async function completeAdventure(
  adventureId: string,
  isGameOver: boolean,
): Promise<void> {
  await db
    .update(adventures)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
      state: sql`jsonb_set(${adventures.state}, '{completion}', ${JSON.stringify({
        isGameOver,
      })}::jsonb, true)`,
    })
    .where(eq(adventures.id, adventureId));
}
