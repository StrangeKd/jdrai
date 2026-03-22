/**
 * D20Service unit tests (Story 6.2 Task 1)
 * Pure logic — no mocks required.
 */
import { describe, expect, it } from "vitest";

import type { ActionType, BonusContext, D20ResolveParams } from "./d20.service";
import { D20Service } from "./d20.service";

const service = new D20Service();

// ---------------------------------------------------------------------------
// rollD20
// ---------------------------------------------------------------------------

describe("D20Service.rollD20()", () => {
  it("always returns an integer between 1 and 20 (inclusive)", () => {
    for (let i = 0; i < 1000; i++) {
      const roll = service.rollD20();
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(20);
      expect(Number.isInteger(roll)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// getBaseDC
// ---------------------------------------------------------------------------

describe("D20Service.getBaseDC()", () => {
  it.each([
    ["trivial", 5],
    ["easy", 8],
    ["medium", 12],
    ["hard", 15],
    ["very_hard", 18],
  ] as [ActionType, number][])(
    "returns %i for action type '%s'",
    (actionType, expectedDC) => {
      expect(service.getBaseDC(actionType)).toBe(expectedDC);
    },
  );
});

// ---------------------------------------------------------------------------
// getDifficultyModifier
// ---------------------------------------------------------------------------

describe("D20Service.getDifficultyModifier()", () => {
  it("returns -3 for Easy difficulty", () => {
    expect(service.getDifficultyModifier("easy")).toBe(-3);
  });

  it("returns 0 for Normal difficulty", () => {
    expect(service.getDifficultyModifier("normal")).toBe(0);
  });

  it("returns +2 for Hard difficulty", () => {
    expect(service.getDifficultyModifier("hard")).toBe(2);
  });

  it("returns +4 for Nightmare difficulty", () => {
    expect(service.getDifficultyModifier("nightmare")).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// getCharacterBonus
// ---------------------------------------------------------------------------

describe("D20Service.getCharacterBonus()", () => {
  it("returns +2 when class matches and no other modifier", () => {
    const ctx: BonusContext = { classMatch: true, narrativeFavor: false, repetition: false };
    expect(service.getCharacterBonus(ctx)).toBe(2);
  });

  it("returns +1 for narrative favor only", () => {
    const ctx: BonusContext = { classMatch: false, narrativeFavor: true, repetition: false };
    expect(service.getCharacterBonus(ctx)).toBe(1);
  });

  it("returns -2 for repetition only", () => {
    const ctx: BonusContext = { classMatch: false, narrativeFavor: false, repetition: true };
    expect(service.getCharacterBonus(ctx)).toBe(-2);
  });

  it("returns +3 when class + narrative favor (no repetition)", () => {
    const ctx: BonusContext = { classMatch: true, narrativeFavor: true, repetition: false };
    expect(service.getCharacterBonus(ctx)).toBe(3);
  });

  it("returns 0 when no modifiers apply", () => {
    const ctx: BonusContext = { classMatch: false, narrativeFavor: false, repetition: false };
    expect(service.getCharacterBonus(ctx)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getOutcome
// ---------------------------------------------------------------------------

describe("D20Service.getOutcome()", () => {
  it("roll 20 is always critical_success regardless of DC", () => {
    // Even with a very high DC (100), roll 20 wins
    expect(service.getOutcome(20, 0, 100)).toBe("critical_success");
    expect(service.getOutcome(20, -5, 100)).toBe("critical_success");
  });

  it("roll 1 is always critical_failure regardless of DC", () => {
    // Even with DC 1, roll 1 fails
    expect(service.getOutcome(1, 10, 1)).toBe("critical_failure");
    expect(service.getOutcome(1, 0, 5)).toBe("critical_failure");
  });

  it("returns success when roll+bonus >= finalDC (non-critical)", () => {
    // roll 15, bonus 0, finalDC 12 → 15 >= 12 → success
    expect(service.getOutcome(15, 0, 12)).toBe("success");
    // roll 12, bonus 0, finalDC 12 → 12 >= 12 → success
    expect(service.getOutcome(12, 0, 12)).toBe("success");
  });

  it("returns partial_success when roll+bonus is between DC-1 and DC-5", () => {
    // finalDC=12, partial range: 7–11 (DC-5=7, DC-1=11)
    expect(service.getOutcome(11, 0, 12)).toBe("partial_success");
    expect(service.getOutcome(7, 0, 12)).toBe("partial_success");
    // roll 8, bonus +1, total 9 vs finalDC 12 → 9 in range [7–11]
    expect(service.getOutcome(8, 1, 12)).toBe("partial_success");
  });

  it("returns failure when roll+bonus < DC-5", () => {
    // finalDC=12, failure threshold: <7 (total <= 6)
    expect(service.getOutcome(6, 0, 12)).toBe("failure");
    expect(service.getOutcome(2, 0, 12)).toBe("failure");
  });

  it("success with positive bonus pushing over DC", () => {
    // roll 10, bonus +2, finalDC 12 → total 12 → success
    expect(service.getOutcome(10, 2, 12)).toBe("success");
  });
});

// ---------------------------------------------------------------------------
// resolve (orchestration)
// ---------------------------------------------------------------------------

describe("D20Service.resolve()", () => {
  it("applies Easy difficulty modifier -3 correctly in resolve()", () => {
    const params: D20ResolveParams = {
      actionType: "medium",
      difficulty: "easy",
      characterBonus: 0,
    };
    const result = service.resolve(params);
    // baseDC(medium)=12, modifier(easy)=-3, finalDC=9
    expect(result.baseDC).toBe(12);
    expect(result.difficultyModifier).toBe(-3);
    expect(result.finalDC).toBe(9);
  });

  it("applies Nightmare difficulty modifier +4 correctly in resolve()", () => {
    const params: D20ResolveParams = {
      actionType: "medium",
      difficulty: "nightmare",
      characterBonus: 0,
    };
    const result = service.resolve(params);
    // baseDC(medium)=12, modifier(nightmare)=+4, finalDC=16
    expect(result.baseDC).toBe(12);
    expect(result.difficultyModifier).toBe(4);
    expect(result.finalDC).toBe(16);
  });

  it("returns a complete D20Result with all fields populated", () => {
    const params: D20ResolveParams = {
      actionType: "easy",
      difficulty: "normal",
      characterBonus: 1,
    };
    const result = service.resolve(params);

    expect(result.roll).toBeGreaterThanOrEqual(1);
    expect(result.roll).toBeLessThanOrEqual(20);
    expect(result.actionType).toBe("easy");
    expect(result.difficulty).toBe("normal");
    expect(result.baseDC).toBe(8);
    expect(result.difficultyModifier).toBe(0);
    expect(result.finalDC).toBe(8);
    expect(result.characterBonus).toBe(1);
    expect(result.totalScore).toBe(result.roll + 1);
    expect(["critical_success", "success", "partial_success", "failure", "critical_failure"])
      .toContain(result.outcome);
  });

  it("totalScore equals roll + characterBonus", () => {
    const params: D20ResolveParams = {
      actionType: "trivial",
      difficulty: "normal",
      characterBonus: 3,
    };
    for (let i = 0; i < 20; i++) {
      const result = service.resolve(params);
      expect(result.totalScore).toBe(result.roll + 3);
    }
  });
});
