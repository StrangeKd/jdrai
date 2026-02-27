import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import type { AdventureDTO, Difficulty, EstimatedDuration } from "@jdrai/shared";

import { AbandonModal } from "@/components/adventure/AbandonModal";
import { AdventureConfirmationView } from "@/components/adventure/AdventureConfirmationView";
import { AdventureCustomConfigView } from "@/components/adventure/AdventureCustomConfigView";
import { AdventureLimitScreen } from "@/components/adventure/AdventureLimitScreen";
import { AdventureLoadingScreen } from "@/components/adventure/AdventureLoadingScreen";
import { AdventureTemplatesView } from "@/components/adventure/AdventureTemplatesView";
import { GenerationErrorView } from "@/components/adventure/GenerationErrorView";
import { RandomChoiceView } from "@/components/adventure/RandomChoiceView";
import { RandomRevealedView } from "@/components/adventure/RandomRevealedView";
import { generateRandomConfig } from "@/components/adventure/utils/randomConfig";
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

type AdventureStep =
  | "config"           // WF-E9-01 (custom) or WF-E9-02 (templates)
  | "confirmation"     // WF-E9-03 (custom + template paths)
  | "random-choice"    // WF-E9-03b (random: reveal or surprise)
  | "random-revealed"  // WF-E9-03c (random: params shown, can re-roll)
  | "loading"          // WF-E9-04 (full-screen, nav hidden)
  | "error";           // WF-E9-05 (after 3 failed attempts)

interface AdventureConfig {
  duration: EstimatedDuration;
  difficulty: Difficulty;
  templateId?: string;
  templateName?: string;
  isRandom: boolean;
  /** Whether the player chose "Accepter l'inconnu" — params hidden during loading. */
  hiddenParams: boolean;
}

const DEFAULT_CONFIG: AdventureConfig = {
  duration: "medium",
  difficulty: "normal",
  isRandom: false,
  hiddenParams: false,
};

const DURATION_LABELS: Record<EstimatedDuration, string> = {
  short: "Courte (~20 min)",
  medium: "Moyenne (~45 min)",
  long: "Longue (~1h+)",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Facile",
  normal: "Normal",
  hard: "Difficile",
  nightmare: "Cauchemar",
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

  // Initial step depends on mode:
  // - random → "random-choice" (skip config entirely per story Dev Notes)
  // - custom/templates → "config"
  const [config, setConfig] = useState<AdventureConfig>(DEFAULT_CONFIG);
  const [step, setStep] = useState<AdventureStep>(() =>
    mode === "random" ? "random-choice" : "config",
  );
  const [abandonTarget, setAbandonTarget] = useState<AdventureDTO | null>(null);

  const isAtLimit = !activeLoading && !activeError && activeAdventures.length >= 5;

  // ---------------------------------------------------------------------------
  // Loading screen (full-screen overlay, no container wrapper)
  // ---------------------------------------------------------------------------

  if (step === "loading") {
    return (
      <AdventureLoadingScreen
        config={{
          difficulty: config.difficulty,
          estimatedDuration: config.duration,
          ...(config.templateId ? { templateId: config.templateId } : {}),
        }}
        hiddenParams={config.hiddenParams}
        durationLabel={DURATION_LABELS[config.duration]}
        difficultyLabel={DIFFICULTY_LABELS[config.difficulty]}
        onError={() => setStep("error")}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Error screen (WF-E9-05) — navigation restored
  // ---------------------------------------------------------------------------

  if (step === "error") {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <GenerationErrorView
          onRetry={() => setStep("loading")}
          onBack={() => setStep(mode === "random" ? "random-choice" : "config")}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Random choice (WF-E9-03b)
  // ---------------------------------------------------------------------------

  if (step === "random-choice") {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <RandomChoiceView
          onReveal={() => {
            const random = generateRandomConfig();
            setConfig((c) => ({
              ...c,
              difficulty: random.difficulty,
              duration: random.estimatedDuration,
              isRandom: true,
              hiddenParams: false,
            }));
            setStep("random-revealed");
          }}
          onAccept={() => {
            const random = generateRandomConfig();
            setConfig((c) => ({
              ...c,
              difficulty: random.difficulty,
              duration: random.estimatedDuration,
              isRandom: true,
              hiddenParams: true,
            }));
            setStep("loading");
          }}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Random revealed (WF-E9-03c)
  // ---------------------------------------------------------------------------

  if (step === "random-revealed") {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <RandomRevealedView
          difficulty={config.difficulty}
          estimatedDuration={config.duration}
          onLaunch={() => setStep("loading")}
          onReroll={() => {
            const random = generateRandomConfig();
            setConfig((c) => ({
              ...c,
              difficulty: random.difficulty,
              duration: random.estimatedDuration,
            }));
          }}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Confirmation step (WF-E9-03)
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
          onLaunch={() => setStep("loading")}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Config step (WF-E9-01 custom / WF-E9-02 templates)
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
                  hiddenParams: false,
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
