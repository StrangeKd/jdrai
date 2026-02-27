import type { Difficulty, EstimatedDuration } from "@jdrai/shared";

import { ConfirmationCard } from "@/components/adventure/ConfirmationCard";
import { Button } from "@/components/ui/button";

interface AdventureConfirmationViewProps {
  duration: EstimatedDuration;
  difficulty: Difficulty;
  characterName: string;
  templateName?: string;
  onBack: () => void;
  onLaunch: () => void;
}

export function AdventureConfirmationView({
  duration,
  difficulty,
  characterName,
  templateName,
  onBack,
  onLaunch,
}: AdventureConfirmationViewProps) {
  return (
    <>
      <header className="flex items-center gap-3">
        <Button
          variant="link"
          onClick={onBack}
          className="p-0 m-0 text-amber-400 hover:text-amber-300 transition-colors hover:no-underline"
          aria-label="Modifier les paramètres"
        >
          ←
        </Button>
        <h1 className="text-lg font-semibold text-amber-100">Confirmer l&apos;aventure</h1>
      </header>

      <ConfirmationCard
        duration={duration}
        difficulty={difficulty}
        characterName={characterName}
        {...(templateName ? { templateName } : {})}
      />

      <Button className="w-full uppercase tracking-wider" onClick={onLaunch}>
        LANCER L&apos;AVENTURE
      </Button>

      <Button
        variant="link"
        onClick={onBack}
        className="w-full p-0 m-0 text-center text-sm text-stone-400 transition-colors hover:text-stone-200 hover:no-underline"
      >
        Modifier les paramètres
      </Button>
    </>
  );
}
