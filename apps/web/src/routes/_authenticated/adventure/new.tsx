import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import type { AdventureDTO, Difficulty, EstimatedDuration } from "@jdrai/shared";

import { AbandonModal } from "@/components/adventure/AbandonModal";
import { AdventureConfirmationView } from "@/components/adventure/AdventureConfirmationView";
import { AdventureCustomConfigView } from "@/components/adventure/AdventureCustomConfigView";
import { AdventureLimitScreen } from "@/components/adventure/AdventureLimitScreen";
import { AdventureTemplatesView } from "@/components/adventure/AdventureTemplatesView";
import { Button } from "@/components/ui/button";
import { useActiveAdventures, useTemplates } from "@/hooks/useAdventures";
import { useCurrentUser } from "@/hooks/useUser";

// ---------------------------------------------------------------------------
// Route definition with validateSearch
// ---------------------------------------------------------------------------

const searchSchema = z.object({
  mode: z.enum(["custom", "templates", "random"]).default("custom").catch("custom"),
});

export const Route = createFileRoute("/_authenticated/adventure/new")({
  validateSearch: searchSchema,
  component: NewAdventurePage,
});

// ---------------------------------------------------------------------------
// Local state types
// ---------------------------------------------------------------------------

interface AdventureConfig {
  duration: EstimatedDuration;
  difficulty: Difficulty;
  templateId?: string;
  templateName?: string;
  isRandom: boolean;
}

const DEFAULT_CONFIG: AdventureConfig = {
  duration: "medium",
  difficulty: "normal",
  isRandom: false,
};

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function NewAdventurePage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();

  const { data: user } = useCurrentUser();
  const characterName = user?.username ?? "Aventurier";

  const {
    data: activeAdventures = [],
    isLoading: activeLoading,
    isError: activeError,
    refetch: refetchActiveAdventures,
  } = useActiveAdventures();
  const {
    data: templates = [],
    isLoading: templatesLoading,
    isError: templatesError,
    refetch: refetchTemplates,
  } = useTemplates();

  const [config, setConfig] = useState<AdventureConfig>(DEFAULT_CONFIG);
  const [step, setStep] = useState<"config" | "confirmation">("config");
  const [abandonTarget, setAbandonTarget] = useState<AdventureDTO | null>(null);

  const isAtLimit = !activeLoading && !activeError && activeAdventures.length >= 5;

  // Placeholder for Story 5.3 — will be wired to loading screen + POST /api/adventures
  const handleLaunch = () => {
    // TODO Story 5.3: setStep("loading") → POST /api/adventures → redirect to /adventure/:id
    console.log("TODO: Story 5.3 — launch adventure with config:", config);
  };

  // ---------------------------------------------------------------------------
  // Confirmation step
  // ---------------------------------------------------------------------------

  if (step === "confirmation") {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <AdventureConfirmationView
          duration={config.duration}
          difficulty={config.difficulty}
          characterName={characterName}
          {...(config.templateName ? { templateName: config.templateName } : {})}
          onBack={() => setStep("config")}
          onLaunch={handleLaunch}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Config step
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Button
          variant="link"
          onClick={() => void navigate({ to: "/hub" })}
          className="p-0 m-0 text-amber-400 hover:text-amber-300 transition-colors hover:no-underline"
          aria-label="Retour au hub"
        >
          ←
        </Button>
        <h1 className="text-lg font-semibold text-amber-100">Nouvelle aventure</h1>
      </header>

      {/* Loading */}
      {activeLoading && (
        <div className="py-8 text-center text-sm text-stone-500">Chargement...</div>
      )}

      {/* Active adventures error */}
      {!activeLoading && activeError && (
        <div className="rounded-lg border border-stone-700 bg-stone-800/30 p-4 text-center">
          <p className="text-sm text-stone-400">Impossible de charger vos aventures.</p>
          <button
            type="button"
            onClick={() => void refetchActiveAdventures()}
            className="mt-2 text-sm text-amber-400 underline hover:text-amber-300"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Limit screen — replaces all config content */}
      {!activeLoading && !activeError && isAtLimit && (
        <>
          <AdventureLimitScreen
            adventures={activeAdventures}
            onAbandon={(adv) => setAbandonTarget(adv)}
          />
          <AbandonModal adventure={abandonTarget} onClose={() => setAbandonTarget(null)} />
        </>
      )}

      {/* Config content — hidden when at limit */}
      {!activeLoading && !activeError && !isAtLimit && (
        <>
          {(mode === "custom" || mode === "random") && (
            <AdventureCustomConfigView
              duration={config.duration}
              difficulty={config.difficulty}
              onDurationChange={(d) => setConfig((c) => ({ ...c, duration: d }))}
              onDifficultyChange={(d) => setConfig((c) => ({ ...c, difficulty: d }))}
              onNext={() => {
                setConfig((c) => ({ ...c, isRandom: mode === "random" }));
                setStep("confirmation");
              }}
            />
          )}

          {mode === "templates" && (
            <AdventureTemplatesView
              templates={templates}
              isLoading={templatesLoading}
              isError={templatesError}
              onRetry={() => void refetchTemplates()}
              onChoose={(t) => {
                setConfig((c) => ({
                  ...c,
                  templateId: t.id,
                  templateName: t.name,
                  difficulty: t.difficulty,
                  duration: t.estimatedDuration,
                  isRandom: false,
                }));
                setStep("confirmation");
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
