import type { Difficulty } from "@jdrai/shared";

import { Slider } from "@/components/ui/slider";

const DIFFICULTY_CONFIG = [
  {
    value: 1,
    key: "easy" as const,
    label: "Facile",
    description: "L'histoire avant le défi. Le MJ est bienveillant, les échecs sont doux.",
  },
  {
    value: 2,
    key: "normal" as const,
    label: "Normal",
    description: "Équilibre narration et défi. Les erreurs ont des conséquences surmontables.",
  },
  {
    value: 3,
    key: "hard" as const,
    label: "Difficile",
    description: "Le défi est réel. Les erreurs coûtent cher, restez vigilant.",
  },
  {
    value: 4,
    key: "nightmare" as const,
    label: "Cauchemar",
    description: "Survie narrative. Le MJ est impitoyable, chaque erreur peut être fatale.",
  },
] satisfies readonly { value: number; key: Difficulty; label: string; description: string }[];

interface DifficultySliderProps {
  value: Difficulty;
  onChange: (v: Difficulty) => void;
}

export function DifficultySlider({ value, onChange }: DifficultySliderProps) {
  const current = DIFFICULTY_CONFIG.find((d) => d.key === value) ?? DIFFICULTY_CONFIG[1]!;

  const handleChange = (values: number[]) => {
    const notch = values[0] ?? 2;
    const config = DIFFICULTY_CONFIG[notch - 1];
    if (config) onChange(config.key);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Current cran label centered above slider */}
      <p className="text-center text-sm font-semibold text-amber-200">{current.label}</p>

      {/* Slider with extreme labels */}
      <div className="flex items-center gap-3">
        <span className="w-10 shrink-0 text-xs text-stone-400">Facile</span>
        <Slider
          min={1}
          max={4}
          step={1}
          value={[current.value]}
          onValueChange={handleChange}
          className="flex-1"
          aria-label="Difficulté"
        />
        <span className="w-14 shrink-0 text-right text-xs text-stone-400">Cauchemar</span>
      </div>

      {/* Dynamic description below slider */}
      <p className="text-center text-xs text-stone-400 min-h-[2.5rem]">{current.description}</p>
    </div>
  );
}
