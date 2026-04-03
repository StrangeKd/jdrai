/**
 * MetaCharacterService — manages the persistent player identity created after tutorial completion.
 * Story 8.1 Tasks 7 + 8.
 */
import { eq } from "drizzle-orm";

import type { MetaCharacterDTO } from "@jdrai/shared";

import { db } from "@/db";
import { characterClasses, metaCharacters, races } from "@/db/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateFromTutorialParams {
  userId: string;
  username: string;
  raceId?: string | undefined;
  classId?: string | undefined;
}

// ---------------------------------------------------------------------------
// MetaCharacterService
// ---------------------------------------------------------------------------

export class MetaCharacterService {
  /**
   * Creates (or upserts) a MetaCharacter after tutorial completion.
   * Falls back to DB defaults (isDefault=true) when race/class choices are missing.
   */
  async createFromTutorial(params: CreateFromTutorialParams): Promise<MetaCharacterDTO> {
    // Resolve race — use provided raceId or fall back to the default race
    const resolvedRace = params.raceId
      ? await db.query.races.findFirst({ where: eq(races.id, params.raceId) })
      : await db.query.races.findFirst({ where: eq(races.isDefault, true) });

    // Resolve class — use provided classId or fall back to the default class
    const resolvedClass = params.classId
      ? await db.query.characterClasses.findFirst({
          where: eq(characterClasses.id, params.classId),
        })
      : await db.query.characterClasses.findFirst({
          where: eq(characterClasses.isDefault, true),
        });

    // Upsert — handles tutorial replayed (userId has UNIQUE constraint)
    const [metaChar] = await db
      .insert(metaCharacters)
      .values({
        userId: params.userId,
        name: params.username,
        raceId: resolvedRace?.id ?? null,
        classId: resolvedClass?.id ?? null,
        level: 1,
        xp: 0,
        cosmetics: {},
      })
      .onConflictDoUpdate({
        target: metaCharacters.userId,
        set: {
          name: params.username,
          raceId: resolvedRace?.id ?? null,
          classId: resolvedClass?.id ?? null,
        },
      })
      .returning();

    return this.toDTO(metaChar!, resolvedRace, resolvedClass);
  }

  /**
   * Returns the MetaCharacter for a given user, or null if none exists yet.
   */
  async getByUserId(userId: string): Promise<MetaCharacterDTO | null> {
    const row = await db.query.metaCharacters.findFirst({
      where: eq(metaCharacters.userId, userId),
    });
    if (!row) return null;

    // Resolve race/class names via separate lookups (Drizzle relations not configured yet in P1)
    const race = row.raceId
      ? await db.query.races.findFirst({ where: eq(races.id, row.raceId) })
      : undefined;
    const cls = row.classId
      ? await db.query.characterClasses.findFirst({
          where: eq(characterClasses.id, row.classId),
        })
      : undefined;

    return this.toDTO(row, race, cls);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private toDTO(
    row: typeof metaCharacters.$inferSelect,
    race: typeof races.$inferSelect | undefined | null,
    cls: typeof characterClasses.$inferSelect | undefined | null,
  ): MetaCharacterDTO {
    const dto: MetaCharacterDTO = {
      id: row.id,
      name: row.name,
      level: row.level,
      xp: row.xp,
      createdAt: row.createdAt.toISOString(),
    };

    if (row.avatarUrl) dto.avatarUrl = row.avatarUrl;
    if (row.raceId) dto.raceId = row.raceId;
    if (race?.name) dto.raceName = race.name;
    if (row.classId) dto.classId = row.classId;
    if (cls?.name) dto.className = cls.name;

    return dto;
  }
}

export const metaCharacterService = new MetaCharacterService();
