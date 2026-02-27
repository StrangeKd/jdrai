import type { Difficulty, EstimatedDuration } from "@jdrai/shared";

// Weighted toward balanced values (Normal difficulty, Medium duration most common)
const DIFFICULTY_WEIGHTS: { value: Difficulty; weight: number }[] = [
  { value: "easy", weight: 2 },
  { value: "normal", weight: 4 },
  { value: "hard", weight: 3 },
  { value: "nightmare", weight: 1 },
];

const DURATION_WEIGHTS: { value: EstimatedDuration; weight: number }[] = [
  { value: "short", weight: 3 },
  { value: "medium", weight: 4 },
  { value: "long", weight: 3 },
];

function weightedRandom<T>(options: { value: T; weight: number }[]): T {
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  let rand = Math.random() * total;
  for (const option of options) {
    rand -= option.weight;
    if (rand <= 0) return option.value;
  }
  return options[options.length - 1]!.value;
}

export function generateRandomConfig(): { difficulty: Difficulty; estimatedDuration: EstimatedDuration } {
  return {
    difficulty: weightedRandom(DIFFICULTY_WEIGHTS),
    estimatedDuration: weightedRandom(DURATION_WEIGHTS),
  };
}
