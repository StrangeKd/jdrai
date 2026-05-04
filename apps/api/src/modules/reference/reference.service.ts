/**
 * reference.service.ts — maps race/class rows to DTOs for the reference controller.
 *
 * Other modules (game, meta-character, adventures) should consume the repository
 * directly — the service is only for the HTTP controller layer.
 */
import type { ClassRow, RaceRow } from "./reference.repository";
import { getAllClasses, getAllRaces } from "./reference.repository";

// ---------------------------------------------------------------------------
// DTO types
// ---------------------------------------------------------------------------

export interface RaceDTO {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

export interface ClassDTO {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function toRaceDTO(row: RaceRow): RaceDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    isDefault: row.isDefault,
  };
}

function toClassDTO(row: ClassRow): ClassDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    isDefault: row.isDefault,
  };
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/** Returns all races as DTOs, ordered by name. */
export async function getRaces(): Promise<RaceDTO[]> {
  const rows = await getAllRaces();
  return rows.map(toRaceDTO);
}

/** Returns all character classes as DTOs, ordered by name. */
export async function getClasses(): Promise<ClassDTO[]> {
  const rows = await getAllClasses();
  return rows.map(toClassDTO);
}
