/**
 * useTutorial — manages tutorial-specific state.
 *
 * Responsibilities:
 *  - Tooltip dismissal state persisted in localStorage (keyed by TUTORIAL_TOOLTIPS_KEY)
 *  - Reference data fetching (races + classes via TanStack Query)
 *
 * Story 8.2 Task 3 (AC: #1, #3, #5, #6)
 */
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { CharacterClassDTO, RaceDTO } from "@jdrai/shared";

import { api } from "@/services/api";

const TUTORIAL_TOOLTIPS_KEY = "tutorial_tooltips_seen";

export interface UseTutorialReturn {
  isTooltipSeen: (id: string) => boolean;
  dismissTooltip: (id: string) => void;
  races: RaceDTO[];
  classes: CharacterClassDTO[];
  isReferenceLoading: boolean;
}

export function useTutorial(): UseTutorialReturn {
  // -------------------------------------------------------------------------
  // Tooltip state — persisted in localStorage
  // -------------------------------------------------------------------------

  const [seenTooltips, setSeenTooltips] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(TUTORIAL_TOOLTIPS_KEY);
      return stored ? new Set<string>(JSON.parse(stored) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const dismissTooltip = (tooltipId: string): void => {
    const next = new Set(seenTooltips).add(tooltipId);
    setSeenTooltips(next);
    try {
      localStorage.setItem(TUTORIAL_TOOLTIPS_KEY, JSON.stringify([...next]));
    } catch {
      // Ignore storage errors (e.g. private browsing quota)
    }
  };

  const isTooltipSeen = (tooltipId: string): boolean => seenTooltips.has(tooltipId);

  // -------------------------------------------------------------------------
  // Reference data — staleTime: Infinity (these never change in a session)
  // -------------------------------------------------------------------------

  const { data: racesData, isLoading: racesLoading } = useQuery({
    queryKey: ["reference", "races"],
    queryFn: () =>
      api
        .get<{ success: true; data: RaceDTO[] }>("/api/v1/reference/races")
        .then((r) => r.data),
    staleTime: Infinity,
  });

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ["reference", "classes"],
    queryFn: () =>
      api
        .get<{ success: true; data: CharacterClassDTO[] }>("/api/v1/reference/classes")
        .then((r) => r.data),
    staleTime: Infinity,
  });

  return {
    isTooltipSeen,
    dismissTooltip,
    races: racesData ?? [],
    classes: classesData ?? [],
    isReferenceLoading: racesLoading || classesLoading,
  };
}
