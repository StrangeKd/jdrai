/**
 * SummaryGlobalError — full-page error state for E11 (WF-E11-06).
 * Shown when GET /adventures/:id fails entirely.
 * Reassures the player that their data is not lost.
 */
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryGlobalErrorProps {
  onRetry: () => void;
}

export function SummaryGlobalError({ onRetry }: SummaryGlobalErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 gap-6 text-center">
      <span className="text-5xl" aria-hidden="true">⚠️</span>
      <h1 className="text-xl font-bold">Impossible de charger le résumé de l'aventure.</h1>
      <Card className="max-w-sm w-full">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            Une erreur est survenue. Vos données ne sont pas perdues.
          </p>
        </CardContent>
      </Card>
      <div className="flex flex-col items-center gap-3">
        <Button onClick={onRetry} className="w-full max-w-xs">
          RÉESSAYER
        </Button>
        <Link to="/hub" className="text-sm text-muted-foreground hover:underline">
          Retour au Hub
        </Link>
      </div>
    </div>
  );
}
