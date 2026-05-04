/**
 * game.dto.ts — DTO mappers shared across the game/adventures modules.
 * Centralises row → DTO conversions to avoid drift between modules.
 */
import type { AdventureCharacterDTO, MilestoneDTO } from "@jdrai/shared";

import type { adventureCharacters, milestones } from "@/db/schema";
import { toISOStringOrUndefined } from "@/utils/http";

type MilestoneRow = typeof milestones.$inferSelect;
type AdventureCharacterRow = typeof adventureCharacters.$inferSelect;

/**
 * Maps a milestone DB row to a MilestoneDTO.
 * Used by game.repository.getMilestones / getActiveMilestone and
 * adventures.repository.getAdventureMilestones.
 */
export function toMilestoneDTO(row: MilestoneRow): MilestoneDTO {
  const dto: MilestoneDTO = {
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    status: row.status,
  };
  if (row.description) dto.description = row.description;
  const startedAt = toISOStringOrUndefined(row.startedAt);
  if (startedAt) dto.startedAt = startedAt;
  const completedAt = toISOStringOrUndefined(row.completedAt);
  if (completedAt) dto.completedAt = completedAt;
  return dto;
}

/**
 * Maps an adventure character DB row to an AdventureCharacterDTO.
 * Falls back to the P1 defaults (Aventurier / Humain / 20 HP) when the
 * row is missing — used by game.service.buildAdventureDTO and similar
 * read paths.
 *
 * For lists (cf. adventures.service.mapRowToDTO) the caller may pass
 * className/raceName resolved via JOIN.
 */
export function toAdventureCharacterDTO(
  row: AdventureCharacterRow | null | undefined,
  options: { className?: string | null; raceName?: string | null } = {},
): AdventureCharacterDTO {
  return {
    id: row?.id ?? "",
    name: row?.name ?? "Aventurier",
    className: options.className ?? "Aventurier",
    raceName: options.raceName ?? "Humain",
    stats: (row?.stats as AdventureCharacterDTO["stats"]) ?? {
      strength: 10,
      agility: 10,
      charisma: 10,
      karma: 10,
    },
    currentHp: row?.currentHp ?? 20,
    maxHp: row?.maxHp ?? 20,
  };
}
