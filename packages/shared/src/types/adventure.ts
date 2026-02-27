export type AdventureStatus = "active" | "completed" | "abandoned";
export type Difficulty = "easy" | "normal" | "hard" | "nightmare";
export type Tone = "serious" | "humorous" | "epic" | "dark";
export type EstimatedDuration = "short" | "medium" | "long";

export interface CharacterStats {
  strength: number;
  agility: number;
  charisma: number;
  karma: number;
}

export interface AdventureCharacterDTO {
  id: string;
  name: string;
  className: string;
  raceName: string;
  stats: CharacterStats;
  currentHp: number;
  maxHp: number;
}

export interface AdventureDTO {
  id: string;
  title: string;
  status: AdventureStatus;
  difficulty: Difficulty;
  tone?: Tone | undefined; // P2 — nullable in P1
  estimatedDuration: EstimatedDuration;
  /** Derived server-side: name of the active milestone (null if none yet). Never a number. */
  currentMilestone?: string | null | undefined;
  startedAt: string;
  lastPlayedAt: string;
  character: AdventureCharacterDTO;
}

export interface AdventureCharacterCreateInput {
  name: string;
  classId: string;
  raceId: string;
  background?: string | undefined;
  stats: CharacterStats;
}

export interface AdventureCreateInput {
  templateId?: string | undefined;
  title?: string | undefined;
  difficulty: Difficulty;
  tone?: Tone | undefined;
  estimatedDuration: EstimatedDuration;
  character?: AdventureCharacterCreateInput | undefined; // Optional — server auto-creates in P1
}

// NEW — returned by GET /api/v1/templates
export interface AdventureTemplateDTO {
  id: string;
  name: string;
  description: string;
  genre: string;
  /** Optional emoji/icon hint for UI (fallback client-side if absent). */
  emoji?: string | undefined;
  difficulty: Difficulty;
  estimatedDuration: EstimatedDuration;
}
