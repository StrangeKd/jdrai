import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  adventureCharacters,
  adventures,
  characterClasses,
  milestones,
  races,
  type adventureStatusEnum,
} from "@/db/schema";

type AdventureStatus = (typeof adventureStatusEnum.enumValues)[number];

/** Raw row returned by list and findById queries — includes joined fields. */
export interface AdventureRow {
  adventure: typeof adventures.$inferSelect;
  character: typeof adventureCharacters.$inferSelect | null;
  className: string | null;
  raceName: string | null;
  currentMilestoneName: string | null;
}

/**
 * Count active adventures for a given user.
 * Used to enforce the 5-adventure limit before creation.
 */
export async function countActiveAdventures(userId: string): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(adventures)
    .where(and(eq(adventures.userId, userId), eq(adventures.status, "active")));
  return Number(result?.value ?? 0);
}

/**
 * Insert a new adventure and return the created row.
 */
export async function createAdventure(
  data: typeof adventures.$inferInsert,
): Promise<typeof adventures.$inferSelect> {
  const [row] = await db.insert(adventures).values(data).returning();
  return row!;
}

/**
 * Insert an adventure character and return the created row.
 */
export async function createAdventureCharacter(
  data: typeof adventureCharacters.$inferInsert,
): Promise<typeof adventureCharacters.$inferSelect> {
  const [row] = await db.insert(adventureCharacters).values(data).returning();
  return row!;
}

/**
 * Fetch all adventures for a user, ordered by lastPlayedAt DESC.
 * Includes joined character + currentMilestone (derived via LEFT JOIN on active milestone).
 */
export async function findAdventuresByUser(
  userId: string,
  statusFilter?: AdventureStatus,
): Promise<AdventureRow[]> {
  const conditions = statusFilter
    ? and(eq(adventures.userId, userId), eq(adventures.status, statusFilter))
    : eq(adventures.userId, userId);

  return db
    .select({
      adventure: adventures,
      currentMilestoneName: milestones.name,
      character: adventureCharacters,
      className: characterClasses.name,
      raceName: races.name,
    })
    .from(adventures)
    .leftJoin(
      milestones,
      and(eq(milestones.adventureId, adventures.id), eq(milestones.status, "active")),
    )
    .leftJoin(adventureCharacters, eq(adventureCharacters.adventureId, adventures.id))
    .leftJoin(characterClasses, eq(characterClasses.id, adventureCharacters.classId))
    .leftJoin(races, eq(races.id, adventureCharacters.raceId))
    .where(conditions)
    .orderBy(desc(adventures.lastPlayedAt));
}

/**
 * Fetch a single adventure by id, verifying it belongs to the given user.
 * Returns null if not found or belongs to another user.
 */
export async function findAdventureById(
  id: string,
  userId: string,
): Promise<AdventureRow | null> {
  const rows = await db
    .select({
      adventure: adventures,
      currentMilestoneName: milestones.name,
      character: adventureCharacters,
      className: characterClasses.name,
      raceName: races.name,
    })
    .from(adventures)
    .leftJoin(
      milestones,
      and(eq(milestones.adventureId, adventures.id), eq(milestones.status, "active")),
    )
    .leftJoin(adventureCharacters, eq(adventureCharacters.adventureId, adventures.id))
    .leftJoin(characterClasses, eq(characterClasses.id, adventureCharacters.classId))
    .leftJoin(races, eq(races.id, adventureCharacters.raceId))
    .where(and(eq(adventures.id, id), eq(adventures.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}
