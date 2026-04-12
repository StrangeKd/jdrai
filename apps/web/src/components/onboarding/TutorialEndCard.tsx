/**
 * TutorialEndCard — full-screen overlay shown when the tutorial adventure completes.
 *
 * Displays a celebration animation, personalized subtitle, MetaCharacterCard
 * (race + class from the tutorial choices), and a CTA to navigate to the Hub.
 *
 * Triggered when adventure.status === "completed" via WebSocket game:adventure-complete.
 *
 * Story 8.2 Task 8 (AC: #6)
 */
import type { MetaCharacterDTO } from "@jdrai/shared";

import { Button } from "@/components/ui/button";

interface TutorialEndCardProps {
  username: string;
  metaCharacter: MetaCharacterDTO | null | undefined;
  /** Called when player clicks "Découvrir le Hub" */
  onNavigateHub: () => void;
}

function MetaCharacterCardSkeleton() {
  return (
    <div className="animate-pulse flex flex-col items-center gap-2">
      <div className="h-16 w-16 rounded-full bg-stone-700" />
      <div className="h-4 w-24 rounded bg-stone-700" />
      <div className="h-3 w-32 rounded bg-stone-700" />
    </div>
  );
}

function MetaCharacterCard({
  username,
  metaCharacter,
}: {
  username: string;
  metaCharacter: MetaCharacterDTO;
}) {
  const raceAndClass = [metaCharacter.raceName, metaCharacter.className]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-500/30 bg-stone-800/60 px-6 py-4">
      {/* Avatar placeholder */}
      <div
        aria-label="Avatar"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-700 text-3xl"
      >
        🧙
      </div>
      <p className="font-semibold text-amber-100">{username}</p>
      {raceAndClass && (
        <p className="text-sm text-amber-200/70 italic">{raceAndClass}</p>
      )}
    </div>
  );
}

export function TutorialEndCard({
  username,
  metaCharacter,
  onNavigateHub,
}: TutorialEndCardProps) {
  return (
    // Full-screen overlay — highest z-index, above everything
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-stone-950/95 px-6 py-12 text-center">
      {/* Celebration animation */}
      <div className="text-6xl animate-bounce" aria-hidden="true">
        🎉
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-amber-100">Aventure terminée !</h1>

      {/* Personalized subtitle */}
      <p className="text-lg text-amber-200/80">
        {username}, vous avez survécu à votre premier défi.
      </p>

      {/* MetaCharacterCard */}
      {metaCharacter === undefined ? (
        <MetaCharacterCardSkeleton />
      ) : metaCharacter === null ? null : (
        <MetaCharacterCard username={username} metaCharacter={metaCharacter} />
      )}

      {/* CTA */}
      <Button
        size="lg"
        className="mt-4 tracking-widest uppercase"
        onClick={onNavigateHub}
      >
        Découvrir le Hub
      </Button>
    </div>
  );
}
