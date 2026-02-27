import type { Difficulty, EstimatedDuration } from "@jdrai/shared";

import { Button } from "@/components/ui/button";

interface RandomRevealedViewProps {
  difficulty: Difficulty;
  estimatedDuration: EstimatedDuration;
  onLaunch: () => void;
  onReroll: () => void;
}

const DURATION_OPTIONS: { value: EstimatedDuration; label: string; estimate: string }[] = [
  { value: "short", label: "Courte", estimate: "~20 min" },
  { value: "medium", label: "Moyenne", estimate: "~45 min" },
  { value: "long", label: "Longue", estimate: "~1h+" },
];

const DIFFICULTY_CONFIG: { key: Difficulty; label: string }[] = [
  { key: "easy", label: "Facile" },
  { key: "normal", label: "Normal" },
  { key: "hard", label: "Difficile" },
  { key: "nightmare", label: "Cauchemar" },
];

/** WF-E9-03c — Random revealed: shows the generated params, allows re-rolling. */
export function RandomRevealedView({ difficulty, estimatedDuration, onLaunch, onReroll }: RandomRevealedViewProps) {
  const durationOpt = DURATION_OPTIONS.find((d) => d.value === estimatedDuration);
  const difficultyOpt = DIFFICULTY_CONFIG.find((d) => d.key === difficulty);

  return (
    <div className="flex flex-col gap-6 px-4">
      <h2 className="text-xl font-bold text-amber-100">Le destin a choisi pour vous...</h2>
      <div className="bg-stone-800/60 rounded-xl p-5 space-y-4">
        <div className="text-stone-200">
          <span aria-hidden="true">📖</span>{" "}
          <span className="text-stone-400">Thème</span> — Heroic Fantasy
        </div>
        <div className="text-stone-200">
          <span aria-hidden="true">⏱️</span>{" "}
          <span className="text-stone-400">Durée</span> —{" "}
          {durationOpt ? `${durationOpt.label} (${durationOpt.estimate})` : estimatedDuration}
        </div>
        <div className="text-stone-200">
          <span aria-hidden="true">⚖️</span>{" "}
          <span className="text-stone-400">Difficulté</span> —{" "}
          {difficultyOpt?.label ?? difficulty}
        </div>
      </div>
      <Button onClick={onLaunch} className="w-full uppercase tracking-wider">
        LANCER L&apos;AVENTURE
      </Button>
      <button
        type="button"
        onClick={onReroll}
        className="text-sm text-amber-400/70 hover:text-amber-400 transition-colors text-center"
      >
        Retirer les dés
      </button>
    </div>
  );
}
