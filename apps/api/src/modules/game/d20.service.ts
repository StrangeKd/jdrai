/**
 * D20Service — server-side dice resolution engine.
 * Pure business logic: no DB, no LLM, no side effects.
 * GDD §3.1–§3.3, GD-001
 */
import type { ActionType, D20Outcome, Difficulty } from "@jdrai/shared";

// Re-export for consumers that import from this module directly (e.g. PromptBuilder)
export type { ActionType, D20Outcome } from "@jdrai/shared";

export interface BonusContext {
  /** +2 when player's class aligns with the action (e.g. warrior attacking) */
  classMatch: boolean;
  /** +1 when the narrative context favors success (environment, preparation) */
  narrativeFavor: boolean;
  /** -2 when the same action was attempted in the previous turn */
  repetition: boolean;
}

export interface D20ResolveParams {
  actionType: ActionType;
  difficulty: Difficulty;
  /** Pre-calculated total bonus from BonusContext */
  characterBonus: number;
}

export interface D20Result {
  /** Raw dice roll: 1–20 */
  roll: number;
  actionType: ActionType;
  difficulty: Difficulty;
  /** Base DC from action type table (GDD §3.2) */
  baseDC: number;
  /** +/- modifier from difficulty level */
  difficultyModifier: number;
  /** baseDC + difficultyModifier */
  finalDC: number;
  characterBonus: number;
  /** roll + characterBonus */
  totalScore: number;
  outcome: D20Outcome;
}

// ---------------------------------------------------------------------------
// Lookup tables (GDD §3.2–§3.3 + MEMORY.md DC modifiers)
// ---------------------------------------------------------------------------

const BASE_DC: Record<ActionType, number> = {
  narrative: 0, // sentinel — never used at runtime (no D20 roll for narrative actions)
  trivial: 5,
  easy: 8,
  medium: 12,
  hard: 15,
  very_hard: 18,
};

const DIFFICULTY_MODIFIERS: Record<Difficulty, number> = {
  easy: -3,
  normal: 0,
  hard: 2,
  nightmare: 4,
};

// ---------------------------------------------------------------------------
// D20Service
// ---------------------------------------------------------------------------

export class D20Service {
  /**
   * Rolls a D20 and returns a random integer between 1 and 20 (inclusive).
   */
  rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  /**
   * Returns the base Difficulty Class for a given action type.
   * Table from GDD §3.2.
   */
  getBaseDC(actionType: ActionType): number {
    return BASE_DC[actionType];
  }

  /**
   * Returns the difficulty modifier to add to the base DC.
   * Easy=-3, Normal=0, Hard=+2, Nightmare=+4 (confirmed in MEMORY.md).
   */
  getDifficultyModifier(difficulty: Difficulty): number {
    return DIFFICULTY_MODIFIERS[difficulty];
  }

  /**
   * Computes the total character bonus from a BonusContext.
   * +2 class match, +1 narrative favor, -2 repetition.
   */
  getCharacterBonus(context: BonusContext): number {
    let bonus = 0;
    if (context.classMatch) bonus += 2;
    if (context.narrativeFavor) bonus += 1;
    if (context.repetition) bonus -= 2;
    return bonus;
  }

  /**
   * Maps roll + bonus vs finalDC to a D20Outcome.
   * Critical results (1 and 20) take priority over DC comparison (GDD §3.1).
   */
  getOutcome(roll: number, bonus: number, finalDC: number): D20Outcome {
    if (roll === 20) return "critical_success";
    if (roll === 1) return "critical_failure";

    const total = roll + bonus;
    if (total >= finalDC) return "success";
    if (total >= finalDC - 5) return "partial_success";
    return "failure";
  }

  /**
   * Orchestrates a full D20 resolution: roll → DC → bonus → outcome.
   * Returns the complete D20Result for injection into the GM prompt and Message.metadata.
   */
  resolve(params: D20ResolveParams): D20Result {
    const roll = this.rollD20();
    const baseDC = this.getBaseDC(params.actionType);
    const difficultyModifier = this.getDifficultyModifier(params.difficulty);
    const finalDC = baseDC + difficultyModifier;
    const totalScore = roll + params.characterBonus;
    const outcome = this.getOutcome(roll, params.characterBonus, finalDC);

    return {
      roll,
      actionType: params.actionType,
      difficulty: params.difficulty,
      baseDC,
      difficultyModifier,
      finalDC,
      characterBonus: params.characterBonus,
      totalScore,
      outcome,
    };
  }
}
