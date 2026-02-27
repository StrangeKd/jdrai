import type { Difficulty, EstimatedDuration } from "@jdrai/shared";

import { DifficultySlider } from "@/components/adventure/DifficultySlider";
import { DurationSelector } from "@/components/adventure/DurationSelector";
import { Button } from "@/components/ui/button";

interface AdventureCustomConfigViewProps {
  duration: EstimatedDuration;
  difficulty: Difficulty;
  onDurationChange: (d: EstimatedDuration) => void;
  onDifficultyChange: (d: Difficulty) => void;
  onNext: () => void;
}

export function AdventureCustomConfigView({
  duration,
  difficulty,
  onDurationChange,
  onDifficultyChange,
  onNext,
}: AdventureCustomConfigViewProps) {
  return (
    <>
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
        <div>
          <h2 className="mb-4 text-base font-semibold text-amber-100">
            Combien de temps avez-vous ?
          </h2>
          <DurationSelector value={duration} onChange={onDurationChange} />
        </div>
        <div>
          <h2 className="mb-4 text-base font-semibold text-amber-100">
            Quel défi souhaitez-vous ?
          </h2>
          <DifficultySlider value={difficulty} onChange={onDifficultyChange} />
        </div>
      </div>

      <div className="flex justify-center lg:mt-2">
        <Button className="w-full max-w-xs uppercase tracking-wider" onClick={onNext}>
          LANCER L&apos;AVENTURE
        </Button>
      </div>
    </>
  );
}
