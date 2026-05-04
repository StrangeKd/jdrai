/**
 * reference.repository.ts — DB queries for races and character classes.
 *
 * These tables are static post-seed. All queries live here to allow cross-module
 * consumption without coupling other modules to the DB layer.
 *
 * TODO: cache opportunity — races and characterClasses are static post-seed.
 * A Map<id, row> loaded at boot would eliminate ~10–15 DB queries per game session.
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { characterClasses, races } from "@/db/schema";

// ---------------------------------------------------------------------------
// Row types (inferred from schema)
// ---------------------------------------------------------------------------

export type RaceRow = typeof races.$inferSelect;
export type ClassRow = typeof characterClasses.$inferSelect;

// ---------------------------------------------------------------------------
// Race queries
// ---------------------------------------------------------------------------

/** Returns all races ordered by name. */
export async function getAllRaces(): Promise<RaceRow[]> {
  return db.select().from(races).orderBy(races.name);
}

/** Returns a single race by id, or null if not found. */
export async function getRaceById(id: string): Promise<RaceRow | null> {
  const [row] = await db.select().from(races).where(eq(races.id, id)).limit(1);
  return row ?? null;
}

/** Returns the default race (isDefault=true), or null if not seeded. */
export async function findDefaultRace(): Promise<RaceRow | null> {
  const [row] = await db.select().from(races).where(eq(races.isDefault, true)).limit(1);
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Character class queries
// ---------------------------------------------------------------------------

/** Returns all character classes ordered by name. */
export async function getAllClasses(): Promise<ClassRow[]> {
  return db.select().from(characterClasses).orderBy(characterClasses.name);
}

/** Returns a single character class by id, or null if not found. */
export async function getClassById(id: string): Promise<ClassRow | null> {
  const [row] = await db
    .select()
    .from(characterClasses)
    .where(eq(characterClasses.id, id))
    .limit(1);
  return row ?? null;
}

/** Returns the default character class (isDefault=true), or null if not seeded. */
export async function findDefaultClass(): Promise<ClassRow | null> {
  const [row] = await db
    .select()
    .from(characterClasses)
    .where(eq(characterClasses.isDefault, true))
    .limit(1);
  return row ?? null;
}
