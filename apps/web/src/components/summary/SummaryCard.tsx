/**
 * SummaryCard — displays the LLM-generated narrative summary of the adventure.
 *
 * States:
 *  - text === null    → skeleton (polling, LLM not yet ready)
 *  - text === undefined → inline error (WF-E11-04)
 *  - text === string  → narrative content
 *
 * For "abandoned" state: always renders static text regardless of API data.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { SummaryState } from "./types";

interface SummaryCardProps {
  text: string | null | undefined;
  screenState: SummaryState;
  onRetry?: () => void;
}

const LABEL: Record<SummaryState, string | null> = {
  success: "📜 Résumé de l'aventure",
  game_over: "📜 Votre héritage",
  abandoned: null,
};

export function SummaryCard({ text, screenState, onRetry }: SummaryCardProps) {
  const label = LABEL[screenState];

  // Abandoned: always static — no LLM summary
  if (screenState === "abandoned") {
    return (
      <Card>
        {label && (
          <CardHeader>
            <CardTitle className="text-base">{label}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-muted-foreground italic">
            Vous avez quitté cette aventure avant sa conclusion.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {label && (
        <CardHeader>
          <CardTitle className="text-base">{label}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {text === null && (
          // Polling — skeleton
          <div
            aria-label="Chargement du résumé"
            className="space-y-2"
          >
            <div className="animate-pulse bg-muted rounded h-4 w-full" />
            <div className="animate-pulse bg-muted rounded h-4 w-5/6" />
            <div className="animate-pulse bg-muted rounded h-4 w-4/6" />
          </div>
        )}
        {text === undefined && (
          // Error state (WF-E11-04)
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              ⚠️ Le résumé n'a pas pu être généré.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="self-start text-sm underline hover:no-underline"
              >
                Réessayer
              </button>
            )}
          </div>
        )}
        {typeof text === "string" && (
          <p className="leading-relaxed">{text}</p>
        )}
      </CardContent>
    </Card>
  );
}
