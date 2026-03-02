import { describe, expect, it } from "vitest";

import { generateRandomConfig } from "../randomConfig";

describe("generateRandomConfig", () => {
  it("returns a valid difficulty value", () => {
    const { difficulty } = generateRandomConfig();
    expect(["easy", "normal", "hard", "nightmare"]).toContain(difficulty);
  });

  it("returns a valid estimatedDuration value", () => {
    const { estimatedDuration } = generateRandomConfig();
    expect(["short", "medium", "long"]).toContain(estimatedDuration);
  });

  it("produces different results across multiple calls (randomness check)", () => {
    const results = new Set(
      Array.from({ length: 100 }, () => {
        const c = generateRandomConfig();
        return `${c.difficulty}|${c.estimatedDuration}`;
      }),
    );
    // With weights spread across 4 difficulties × 3 durations = 12 combinations,
    // 100 iterations should produce multiple distinct results
    expect(results.size).toBeGreaterThan(1);
  });

  it("never returns undefined for either field", () => {
    for (let i = 0; i < 50; i++) {
      const { difficulty, estimatedDuration } = generateRandomConfig();
      expect(difficulty).toBeDefined();
      expect(estimatedDuration).toBeDefined();
    }
  });
});
