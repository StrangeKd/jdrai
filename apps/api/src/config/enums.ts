/**
 * Centralised enum-like constants for adventure and milestone statuses, domain limits,
 * and valid state-machine transitions. Avoids magic string literals spread across modules.
 */

// ---------------------------------------------------------------------------
// Adventure status
// ---------------------------------------------------------------------------

export const ADVENTURE_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  ABANDONED: "abandoned",
} as const;

export type AdventureStatus = (typeof ADVENTURE_STATUS)[keyof typeof ADVENTURE_STATUS];

// ---------------------------------------------------------------------------
// Milestone status
// ---------------------------------------------------------------------------

export const MILESTONE_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETED: "completed",
} as const;

export type MilestoneStatus = (typeof MILESTONE_STATUS)[keyof typeof MILESTONE_STATUS];

// ---------------------------------------------------------------------------
// Domain limits
// ---------------------------------------------------------------------------

export const LIMITS = {
  /** Maximum number of simultaneous active solo adventures per user. */
  MAX_ACTIVE_ADVENTURES: 5,
  /** Number of past messages included in LLM history. */
  MAX_HISTORY_MESSAGES: 20,
  /** Number of recent messages fetched for processAction context. */
  RECENT_MESSAGES_FOR_ACTION: 20,
  /** Message count threshold triggering a full state re-sync in the prompt. */
  STATE_RESYNC_MESSAGE_COUNT: 50,
  /** Page size used by GET /messages. */
  GET_MESSAGES_PAGE_SIZE: 100,
} as const;

// ---------------------------------------------------------------------------
// Adventure state-machine transitions
// ---------------------------------------------------------------------------

/**
 * Maps each adventure status to the set of statuses it can legally transition to.
 * Only "active" adventures can be completed or abandoned.
 */
export const VALID_ADVENTURE_TRANSITIONS: Record<AdventureStatus, AdventureStatus[]> = {
  [ADVENTURE_STATUS.ACTIVE]: [ADVENTURE_STATUS.COMPLETED, ADVENTURE_STATUS.ABANDONED],
  [ADVENTURE_STATUS.COMPLETED]: [],
  [ADVENTURE_STATUS.ABANDONED]: [],
};
