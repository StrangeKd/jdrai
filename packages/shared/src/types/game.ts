/**
 * Game-session types shared between API and future clients.
 * Story 6.2 Task 3 / Story 6.3b Task 1.
 */
import type { AdventureDTO } from "./adventure";
import type { MilestoneDTO } from "./milestone";

export type ActionType = "trivial" | "easy" | "medium" | "hard" | "very_hard";

export type D20Outcome =
  | "critical_success"
  | "success"
  | "partial_success"
  | "failure"
  | "critical_failure";

/**
 * Metadata stored on every Message created during a game session.
 * Maps to Message.metadata column (JSONB) — Story 6.3 will write these fields.
 */
export interface MessageMetadata {
  /** Raw D20 roll value (1–20) */
  roll?: number;
  /** Final DC used for the resolution */
  dc?: number;
  /** Total character bonus applied */
  bonus?: number;
  /** Narrative outcome of the roll */
  outcome?: D20Outcome;
  /** Name of the milestone completed by this message (if any) */
  milestoneCompleted?: string;
  /** HP delta applied by this message (positive = heal, negative = damage) */
  hpChange?: number;
}

/**
 * A single game message returned by the REST API.
 * metadata (D20 data) is intentionally excluded from the DTO in P1.
 */
export interface GameMessageDTO {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  milestoneId: string | null;
  createdAt: string;
}

/**
 * Full game state snapshot returned by GET /api/adventures/:id/state.
 * isStreaming is always false on REST; Socket.io manages live state.
 */
export interface GameStateDTO {
  adventure: AdventureDTO;
  messages: GameMessageDTO[];
  milestones: MilestoneDTO[];
  isStreaming: boolean;
}
