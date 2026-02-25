export type AdventureStatus = "active" | "completed" | "abandoned";

export interface AdventureDTO {
  id: string;
  userId: string;
  title: string;
  status: AdventureStatus;
  /** Name of the currently active milestone — derived server-side, never a number. */
  currentMilestone?: string;
  /** ISO date string — last time the player interacted with this adventure. */
  lastPlayedAt: string;
  /** ISO date string — set when status transitions to "completed" or "abandoned". */
  completedAt?: string;
  createdAt: string;
}
