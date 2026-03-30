import { and, asc, count, desc, eq } from "drizzle-orm";

import type { MilestoneDTO } from "@jdrai/shared";

import { db } from "@/db";
import {
  adventureCharacters,
  adventures,
  type adventureStatusEnum,
  characterClasses,
  milestones,
  races,
} from "@/db/schema";
import { AppError } from "@/utils/errors";

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
  return buildFindAdventuresByUserQuery(userId, statusFilter).execute();
}

export function buildFindAdventuresByUserQuery(
  userId: string,
  statusFilter?: AdventureStatus,
) {
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
  const rows = await buildFindAdventureByIdQuery(id, userId).execute();

  return rows[0] ?? null;
}

// Allowed status transitions — only "active" adventures can be transitioned
const VALID_TRANSITIONS: Record<string, Array<"completed" | "abandoned">> = {
  active: ["completed", "abandoned"],
  completed: [],
  abandoned: [],
};

/**
 * Updates an adventure's status with transition validation.
 * Throws 404 NOT_FOUND if not found or not owned by userId.
 * Throws 400 INVALID_TRANSITION if the current status doesn't allow the requested transition.
 * Sets completedAt when status becomes "completed".
 */
export async function updateAdventureStatus(
  id: string,
  userId: string,
  status: "abandoned" | "completed",
): Promise<typeof adventures.$inferSelect> {
  // Fetch current adventure to validate ownership + transition
  const [current] = await db
    .select({ id: adventures.id, userId: adventures.userId, status: adventures.status })
    .from(adventures)
    .where(and(eq(adventures.id, id), eq(adventures.userId, userId)))
    .limit(1);

  if (!current) {
    throw new AppError(404, "NOT_FOUND", "Adventure not found");
  }

  const allowedTargets = VALID_TRANSITIONS[current.status] ?? [];
  if (!allowedTargets.includes(status)) {
    throw new AppError(400, "INVALID_TRANSITION", `Cannot transition from "${current.status}" to "${status}"`);
  }

  const [row] = await db
    .update(adventures)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === "completed" ? { completedAt: new Date() } : {}),
    })
    .where(eq(adventures.id, id))
    .returning();

  // Defensive guard for rare concurrent delete between SELECT and UPDATE.
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Adventure not found");
  }

  return row!;
}

/**
 * Returns all milestones for an adventure ordered by sortOrder ASC.
 * Verifies ownership — throws 404 if adventure not found or not owned.
 */
export async function getAdventureMilestones(
  adventureId: string,
  userId: string,
): Promise<MilestoneDTO[]> {
  const [adventureRow] = await db
    .select({ id: adventures.id })
    .from(adventures)
    .where(and(eq(adventures.id, adventureId), eq(adventures.userId, userId)))
    .limit(1);

  if (!adventureRow) {
    throw new AppError(404, "NOT_FOUND", "Adventure not found");
  }

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

/**
 * Updates the narrative summary and isGameOver flag on an adventure.
 * Internal — called by GameService after async LLM generation.
 */
export async function updateNarrativeSummary(
  adventureId: string,
  summary: string,
  isGameOver: boolean,
): Promise<void> {
  await db
    .update(adventures)
    .set({ narrativeSummary: summary, isGameOver, updatedAt: new Date() })
    .where(eq(adventures.id, adventureId));
}

export function buildFindAdventureByIdQuery(id: string, userId: string) {
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
    .where(and(eq(adventures.id, id), eq(adventures.userId, userId)))
    .limit(1);
}
