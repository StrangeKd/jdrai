/**
 * MetaCharacterService — manages the persistent player identity created after tutorial completion.
 * Story 8.1 Tasks 7 + 8.
 */
import type { MetaCharacterDTO } from "@jdrai/shared";

import type { ClassRow, RaceRow } from "@/modules/reference/reference.repository";
import { findDefaultClass, findDefaultRace, getClassById, getRaceById } from "@/modules/reference/reference.repository";

import type { MetaCharacterRow } from "./meta-character.repository";
import {
  createOrUpdateMetaCharacter,
  getMetaCharacterByUserId,
} from "./meta-character.repository";

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
      ? await getRaceById(params.raceId)
      : await findDefaultRace();

    // Resolve class — use provided classId or fall back to the default class
    const resolvedClass = params.classId
      ? await getClassById(params.classId)
      : await findDefaultClass();

    // Upsert — handles tutorial replayed (userId has UNIQUE constraint)
    const metaChar = await createOrUpdateMetaCharacter({
      userId: params.userId,
      name: params.username,
      raceId: resolvedRace?.id ?? null,
      classId: resolvedClass?.id ?? null,
    });

    return this.toDTO(metaChar, resolvedRace, resolvedClass);
  }

  /**
   * Returns the MetaCharacter for a given user, or null if none exists yet.
   */
  async getByUserId(userId: string): Promise<MetaCharacterDTO | null> {
    const row = await getMetaCharacterByUserId(userId);
    if (!row) return null;

    // Resolve race/class names via separate lookups (Drizzle relations not configured yet in P1)
    const race = row.raceId ? await getRaceById(row.raceId) : undefined;
    const cls = row.classId ? await getClassById(row.classId) : undefined;

    return this.toDTO(row, race ?? null, cls ?? null);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private toDTO(
    row: MetaCharacterRow,
    race: RaceRow | undefined | null,
    cls: ClassRow | undefined | null,
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
