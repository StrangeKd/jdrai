import { eq } from "drizzle-orm";

import type {
  AdventureCharacterDTO,
  AdventureCreateInput,
  AdventureDTO,
  AdventureTemplateDTO,
  Difficulty,
  EstimatedDuration,
} from "@jdrai/shared";

import { db } from "@/db";
import { adventures, adventureTemplates, characterClasses, metaCharacters, milestones, races, users } from "@/db/schema";
import { AppError } from "@/utils/errors";
import { toISOString } from "@/utils/http";

import {
  type AdventureRow,
  countActiveAdventures,
  createAdventure,
  createAdventureCharacter,
  findAdventureById,
  findAdventuresByUser,
  getAdventureMilestones,
  updateAdventureStatus,
} from "./adventures.repository";

const MAX_ACTIVE_ADVENTURES = 5;

// ---------------------------------------------------------------------------
// DTO mapper
// ---------------------------------------------------------------------------

function mapRowToDTO(row: AdventureRow): AdventureDTO {
  const { adventure, character, className, raceName, currentMilestoneName } = row;

  const characterDTO: AdventureCharacterDTO = {
    id: character?.id ?? "",
    name: character?.name ?? "Aventurier",
    className: className ?? "Aventurier",
    raceName: raceName ?? "Humain",
    stats: (character?.stats as AdventureCharacterDTO["stats"]) ?? {
      strength: 10,
      agility: 10,
      charisma: 10,
      karma: 10,
    },
    currentHp: character?.currentHp ?? 20,
    maxHp: character?.maxHp ?? 20,
  };

  const dto: AdventureDTO = {
    id: adventure.id,
    title: adventure.title,
    status: adventure.status as AdventureDTO["status"],
    difficulty: adventure.difficulty as AdventureDTO["difficulty"],
    estimatedDuration: adventure.estimatedDuration as EstimatedDuration,
    startedAt: toISOString(adventure.startedAt ?? adventure.createdAt),
    lastPlayedAt: toISOString(adventure.lastPlayedAt ?? adventure.createdAt),
    ...(adventure.completedAt ? { completedAt: toISOString(adventure.completedAt) } : {}),
    currentMilestone: currentMilestoneName ?? null,
    character: characterDTO,
    isGameOver: adventure.isGameOver ?? false,
    isTutorial: adventure.isTutorial ?? false,
  };

  // Omit optional fields when null/undefined to satisfy exactOptionalPropertyTypes
  if (adventure.templateId) dto.templateId = adventure.templateId;
  if (adventure.tone) dto.tone = adventure.tone as AdventureDTO["tone"];
  if (adventure.narrativeSummary) dto.narrativeSummary = adventure.narrativeSummary;

  return dto;
}

/** Seeds the 3 fixed tutorial milestones immediately after adventure creation. */
async function seedTutorialMilestones(adventureId: string): Promise<void> {
  await db.insert(milestones).values([
    {
      adventureId,
      name: "L'Éveil",
      sortOrder: 1,
      status: "active",
      startedAt: new Date(),
    },
    {
      adventureId,
      name: "La Rencontre",
      sortOrder: 2,
      status: "pending",
    },
    {
      adventureId,
      name: "L'Épreuve",
      sortOrder: 3,
      status: "pending",
    },
  ]);
}

// ---------------------------------------------------------------------------
// Meta-character resolution (graceful fallback if table not seeded yet)
// ---------------------------------------------------------------------------

interface MetaCharData {
  name: string | null;
  classId: string | null;
  raceId: string | null;
}

async function getMetaCharacterForUser(userId: string): Promise<MetaCharData | null> {
  const row = await db.query.metaCharacters.findFirst({
    where: eq(metaCharacters.userId, userId),
    columns: { name: true, classId: true, raceId: true },
  });
  if (!row) return null;
  return { name: row.name, classId: row.classId ?? null, raceId: row.raceId ?? null };
}

async function getFallbackCharacterNameForUser(userId: string): Promise<string> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { username: true },
  });
  return user?.username ?? "Aventurier";
}

// ---------------------------------------------------------------------------
// Public service methods
// ---------------------------------------------------------------------------

export async function createAdventureForUser(
  userId: string,
  input: AdventureCreateInput,
): Promise<AdventureDTO> {
  // 1. Enforce 5-active-adventure limit
  const activeCount = await countActiveAdventures(userId);
  if (activeCount >= MAX_ACTIVE_ADVENTURES) {
    throw new AppError(409, "MAX_ACTIVE_ADVENTURES", "Maximum active adventures reached");
  }

  // 2. Resolve title
  const title = input.title?.trim() || "Aventure sans nom";

  // 3. Create adventure row
  const isTutorial = input.isTutorial ?? false;
  const adventure = await createAdventure({
    userId,
    templateId: input.templateId ?? null,
    title,
    difficulty: input.difficulty,
    estimatedDuration: input.estimatedDuration,
    tone: input.tone ?? null,
    isTutorial,
    // Initialize tutorial-specific state fields when applicable
    ...(isTutorial
      ? {
          state: {
            worldState: {},
            tutorialChoices: {},
            tutorialPhase: "intro",
          },
        }
      : {}),
  });

  // 4. Fetch default class (Aventurier, isDefault=true)
  const [defaultClass] = await db
    .select()
    .from(characterClasses)
    .where(eq(characterClasses.isDefault, true))
    .limit(1);
  if (!defaultClass) {
    throw new AppError(500, "INTERNAL_ERROR", "Default character class not seeded");
  }

  // 5. Fetch default race (Humain, isDefault=true)
  const [defaultRace] = await db.select().from(races).where(eq(races.isDefault, true)).limit(1);
  if (!defaultRace) {
    throw new AppError(500, "INTERNAL_ERROR", "Default race not seeded");
  }

  // 6. Try meta-character for name/class/race override
  const metaChar = await getMetaCharacterForUser(userId);
  const fallbackName = await getFallbackCharacterNameForUser(userId);

  // 7. Create adventure character (auto-created, P1 ignores client input)
  const character = await createAdventureCharacter({
    adventureId: adventure.id,
    classId: metaChar?.classId ?? defaultClass.id,
    raceId: metaChar?.raceId ?? defaultRace.id,
    name: metaChar?.name ?? fallbackName,
  });

  // 8. Seed tutorial milestones immediately (bypass LLM generation)
  if (isTutorial) {
    await seedTutorialMilestones(adventure.id);
  }

  // 9. Map to DTO — tutorial milestones seeded; non-tutorial milestones generated by LLM in Epic 6
  return mapRowToDTO({
    adventure,
    character,
    className: defaultClass?.name ?? "Aventurier",
    raceName: defaultRace?.name ?? "Humain",
    currentMilestoneName: isTutorial ? "L'Éveil" : null,
  });
}

export async function getAdventuresForUser(
  userId: string,
  statusFilter?: string,
): Promise<AdventureDTO[]> {
  const validStatuses = ["active", "completed", "abandoned"] as const;
  const status = validStatuses.includes(statusFilter as (typeof validStatuses)[number])
    ? (statusFilter as (typeof validStatuses)[number])
    : undefined;

  const rows = await findAdventuresByUser(userId, status);
  // Deduplicate: the milestones LEFT JOIN can produce multiple rows per adventure
  // when an adventure has more than one active milestone (data inconsistency guard).
  const seen = new Set<string>();
  const uniqueRows = rows.filter((row) => {
    if (seen.has(row.adventure.id)) return false;
    seen.add(row.adventure.id);
    return true;
  });
  return uniqueRows.map(mapRowToDTO);
}

export async function getAdventureById(id: string, userId: string): Promise<AdventureDTO> {
  const row = await findAdventureById(id, userId);
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Adventure not found");
  }
  return mapRowToDTO(row);
}

export async function getTemplates(): Promise<AdventureTemplateDTO[]> {
  const rows = await db
    .select({
      id: adventureTemplates.id,
      name: adventureTemplates.name,
      description: adventureTemplates.description,
      genre: adventureTemplates.genre,
      difficulty: adventureTemplates.difficulty,
      estimatedDuration: adventureTemplates.estimatedDuration,
      seedData: adventureTemplates.seedData,
    })
    .from(adventureTemplates)
    .where(eq(adventureTemplates.isPublic, true));

  return rows.map((r) => {
    const seed = r.seedData as unknown;
    const emoji =
      seed &&
      typeof seed === "object" &&
      "emoji" in seed &&
      typeof (seed as { emoji?: unknown }).emoji === "string"
        ? (seed as { emoji: string }).emoji
        : undefined;

    const dto: AdventureTemplateDTO = {
      id: r.id,
      name: r.name,
      description: r.description,
      genre: r.genre,
      difficulty: r.difficulty as Difficulty,
      estimatedDuration: r.estimatedDuration as EstimatedDuration,
    };

    // Omit optional fields when undefined to satisfy exactOptionalPropertyTypes
    if (emoji) dto.emoji = emoji;

    return dto;
  });
}

export async function updateAdventureForUser(
  userId: string,
  adventureId: string,
  status: "completed" | "abandoned",
): Promise<AdventureDTO | null> {
  // Fetch current adventure to check ownership + tutorial flag before transitioning
  const current = await findAdventureById(adventureId, userId);
  if (!current) {
    throw new AppError(404, "NOT_FOUND", "Adventure not found");
  }

  // Tutorial abandonment — hard delete instead of status update (AC #11)
  if (current.adventure.isTutorial && status === "abandoned") {
    await db.delete(adventures).where(eq(adventures.id, adventureId));
    return null; // Controller returns 204 No Content
  }

  // Standard status transition — repository validates ownership + allowed transition
  await updateAdventureStatus(adventureId, userId, status);
  // Re-fetch full row with joins to return a proper DTO
  const fullRow = await findAdventureById(adventureId, userId);
  if (!fullRow) {
    throw new AppError(404, "NOT_FOUND", "Adventure not found after update");
  }
  return mapRowToDTO(fullRow);
}

export async function getAdventureMilestonesForUser(
  userId: string,
  adventureId: string,
) {
  return getAdventureMilestones(adventureId, userId);
}
