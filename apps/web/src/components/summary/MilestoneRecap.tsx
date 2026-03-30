/**
 * MilestoneRecap — displays completed milestones in the E11 end screen.
 *
 * Filtering rules (no spoil for incomplete adventures):
 *  - success:   all milestones
 *  - game_over: completed only
 *  - abandoned: completed only
 *
 * No numerical progression shown (architecture rule: narrative-only).
 */
import type { MilestoneDTO } from "@jdrai/shared";

import type { SummaryState } from "./types";

interface MilestoneRecapProps {
  milestones: MilestoneDTO[] | undefined;
  isLoading: boolean;
  screenState: SummaryState;
}

export function MilestoneRecap({ milestones, isLoading, screenState }: MilestoneRecapProps) {
  if (isLoading) {
    return (
      <ul aria-label="Chargement des jalons" className="space-y-2">
        {[0, 1, 2].map((i) => (
          <li key={i} className="animate-pulse bg-muted rounded h-6 w-full" />
        ))}
      </ul>
    );
  }

  const filtered =
    screenState === "success"
      ? (milestones ?? [])
      : (milestones ?? []).filter((m) => m.status === "completed");

  if (filtered.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun jalon atteint.</p>;
  }

  return (
    <ul className="space-y-2">
      {filtered.map((milestone) => (
        <li key={milestone.id} className="flex items-center gap-2 text-sm">
          <span>🏴</span>
          <span>{milestone.name}</span>
          <span className="text-green-500 ml-auto">✓</span>
        </li>
      ))}
    </ul>
  );
}
