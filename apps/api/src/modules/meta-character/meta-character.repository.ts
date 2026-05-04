/**
 * meta-character.repository.ts — DB queries for the meta-character module.
 *
 * Extracts persistence logic from MetaCharacterService, following the
 * repository pattern used across other modules.
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { metaCharacters } from "@/db/schema";

// ---------------------------------------------------------------------------
// Row type
// ---------------------------------------------------------------------------

export type MetaCharacterRow = typeof metaCharacters.$inferSelect;

// ---------------------------------------------------------------------------
// Upsert input type
// ---------------------------------------------------------------------------

export interface UpsertMetaCharacterData {
  userId: string;
  name: string;
  raceId: string | null;
  classId: string | null;
  level?: number;
  xp?: number;
  cosmetics?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Returns the MetaCharacter row for a given user, or null if none exists. */
export async function getMetaCharacterByUserId(userId: string): Promise<MetaCharacterRow | null> {
  const row = await db.query.metaCharacters.findFirst({
    where: eq(metaCharacters.userId, userId),
  });
  return row ?? null;
}

/**
 * Creates or updates (upserts) the MetaCharacter for a user.
 * Uses the userId UNIQUE constraint as conflict target — safe to call
 * multiple times (e.g., tutorial replayed).
 */
export async function createOrUpdateMetaCharacter(
  data: UpsertMetaCharacterData,
): Promise<MetaCharacterRow> {
  const [row] = await db
    .insert(metaCharacters)
    .values({
      userId: data.userId,
      name: data.name,
      raceId: data.raceId,
      classId: data.classId,
      level: data.level ?? 1,
      xp: data.xp ?? 0,
      cosmetics: data.cosmetics ?? {},
    })
    .onConflictDoUpdate({
      target: metaCharacters.userId,
      set: {
        name: data.name,
        raceId: data.raceId,
        classId: data.classId,
      },
    })
    .returning();
  return row!;
}
