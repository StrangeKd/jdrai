/**
 * E11 — Adventure Summary Screen (/adventure/:id/summary).
 *
 * Supports 3 states:
 *  - success   (status=completed, isGameOver=false) — WF-E11-01
 *  - game_over (status=completed, isGameOver=true)  — WF-E11-02
 *  - abandoned (status=abandoned)                  — WF-E11-05
 *
 * Celebration animation fires only on first visit from E10 (router state.fromGameSession=true).
 * narrativeSummary is polled until populated or max 15 retries (~30s).
 *
 * P1 limitation: "Rejouer/Retenter" links to /adventure/new without pre-filling
 * difficulty/estimatedDuration — new.tsx search schema would need extending (P2).
 */
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useRef, useState } from "react";

import type { AdventureDTO, MilestoneDTO } from "@jdrai/shared";

import { CelebrationAnimation } from "@/components/summary/CelebrationAnimation";
import { MilestoneRecap } from "@/components/summary/MilestoneRecap";
import { RewardPlaceholder } from "@/components/summary/RewardPlaceholder";
import { SummaryCard } from "@/components/summary/SummaryCard";
import { SummaryGlobalError } from "@/components/summary/SummaryGlobalError";
import type { SummaryState } from "@/components/summary/types";
import { Button } from "@/components/ui/button";
import { getAdventureById, getMilestones } from "@/services/adventure.service";

export const Route = createFileRoute("/_authenticated/adventure/$id_/summary")({
  component: AdventureSummaryPage,
});

function deriveScreenState(adventure: AdventureDTO | undefined): SummaryState {
  if (!adventure) return "success"; // Default while loading — success header shown in skeleton
  if (adventure.status === "abandoned") return "abandoned";
  if (adventure.isGameOver) return "game_over";
  return "success";
}

const TITLE: Record<SummaryState, string> = {
  success: "Aventure terminée !",
  game_over: "Votre quête s'achève ici.",
  abandoned: "Aventure inachevée",
};

export function AdventureSummaryPage() {
  const { id } = Route.useParams();

  // Detect first-visit from E10 — triggers celebration animation (WF-E11 §7 "Animation unique")
  const routerState = useRouterState({
    select: (s) => s.location.state as { fromGameSession?: boolean } | null,
  });
  const fromGameSession = routerState?.fromGameSession === true;

  // Safety net: surface inline error after 15 poll attempts (~30s) if LLM never responds
  const summaryPollAttempts = useRef(0);
  const [summaryError, setSummaryError] = useState(false);

  // Fetch adventure (with polling while narrativeSummary is absent)
  const {
    data: adventure,
    isLoading: adventureLoading,
    isError: adventureError,
    refetch,
  } = useQuery<AdventureDTO>({
    queryKey: ["adventure", id],
    queryFn: () => getAdventureById(id),
    // In TanStack Query v5, refetchInterval receives the Query object; data is at query.state.data
    refetchInterval: (query) => {
      const data = query.state.data as AdventureDTO | undefined;
      // Poll only for completed adventures that still lack narrativeSummary.
      // Abandoned adventures do not require LLM summary generation.
      if (
        !data
        || data.status !== "completed"
        || data.narrativeSummary !== undefined
      ) {
        return false;
      }
      summaryPollAttempts.current += 1;
      if (summaryPollAttempts.current >= 15) {
        setSummaryError(true);
        return false;
      }
      return 2000; // Poll every 2s
    },
    refetchIntervalInBackground: false,
  });

  // Fetch milestones separately (fast — DB only, no LLM dependency)
  const { data: milestones, isLoading: milestonesLoading } = useQuery<MilestoneDTO[]>({
    queryKey: ["adventure-milestones", id],
    queryFn: () => getMilestones(id),
  });

  // Full-page error — adventure data unavailable (WF-E11-06)
  if (adventureError) {
    return <SummaryGlobalError onRetry={() => void refetch()} />;
  }

  const screenState = deriveScreenState(adventure);
  // Guard: wait for adventure data before enabling celebration to avoid a false positive
  // while adventure is loading (deriveScreenState returns "success" by default for undefined).
  const showCelebration = fromGameSession && !adventureLoading && screenState === "success";

  // Determine the text to pass to SummaryCard:
  //  null      → polling in progress (skeleton)
  //  undefined → error after max retries (inline error — WF-E11-04)
  //  string    → ready
  let summaryText: string | null | undefined;
  if (summaryError) {
    summaryText = undefined;
  } else if (adventure?.narrativeSummary !== undefined) {
    summaryText = adventure.narrativeSummary;
  } else if (!adventureLoading) {
    summaryText = null; // Adventure loaded but summary absent — polling in progress
  } else {
    summaryText = null; // Initial load
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        {screenState === "success" && <CelebrationAnimation play={showCelebration} />}
        {screenState === "game_over" && (
          <span className="text-5xl" aria-label="Game Over">
            ☠️
          </span>
        )}
        <h1 className="text-2xl font-bold mt-4">{TITLE[screenState]}</h1>
        {adventureLoading ? (
          <div
            aria-label="Chargement"
            className="animate-pulse h-5 w-32 bg-muted mx-auto mt-2 rounded"
          />
        ) : (
          <p className="text-muted-foreground mt-1">{adventure?.title}</p>
        )}
      </div>

      {/* Desktop: 2 columns for summary + milestones (WF-E11-07) */}
      <div className="md:grid md:grid-cols-2 md:gap-8 space-y-8 md:space-y-0">
        <SummaryCard
          text={summaryText}
          screenState={screenState}
          onRetry={() => {
            summaryPollAttempts.current = 0;
            setSummaryError(false);
            void refetch();
          }}
        />

        <section>
          <h2 className="text-lg font-semibold mb-3">Votre parcours</h2>
          <MilestoneRecap
            milestones={milestones}
            isLoading={milestonesLoading}
            screenState={screenState}
          />
        </section>
      </div>

      {/* Abandoned teaser (WF-E11-05) */}
      {screenState === "abandoned" && (
        <blockquote className="border-l-2 border-muted pl-4 italic text-muted-foreground">
          "Cette histoire avait encore des chemins inexplorés..."
        </blockquote>
      )}

      {/* Rewards — hidden for abandoned (WF-E11-05) */}
      {screenState !== "abandoned" && <RewardPlaceholder />}

      {/* P3: Companion message slot — reserved, currently empty */}
      {/* <CompanionMessage context="adventure_complete" adventureTitle={adventure?.title} /> */}

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <Button asChild className="w-full max-w-xs">
          <Link to="/hub">RETOUR AU HUB</Link>
        </Button>
        {adventure && (
          <Link
            to="/adventure/new"
            search={{
              mode: "custom",
              difficulty: adventure.difficulty,
              estimatedDuration: adventure.estimatedDuration,
              ...(adventure.templateId ? { templateId: adventure.templateId } : {}),
            }}
            className="text-sm text-muted-foreground hover:underline"
          >
            {screenState === "success" ? "Rejouer ce scénario" : "Retenter ce scénario"}
          </Link>
        )}
      </div>
    </div>
  );
}
