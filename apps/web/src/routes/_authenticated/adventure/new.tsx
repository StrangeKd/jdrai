import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import type {
  AdventureDTO,
  AdventureTemplateDTO,
  Difficulty,
  EstimatedDuration,
} from "@jdrai/shared";

import { AbandonModal } from "@/components/adventure/AbandonModal";
import { ConfirmationCard } from "@/components/adventure/ConfirmationCard";
import { DifficultySlider } from "@/components/adventure/DifficultySlider";
import { DurationSelector } from "@/components/adventure/DurationSelector";
import { TemplateCard, TemplateCardSkeleton } from "@/components/adventure/TemplateCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
// Sub-components
// ---------------------------------------------------------------------------

function AdventureLimitScreen({
  adventures,
  onAbandon,
}: {
  adventures: AdventureDTO[];
  onAbandon: (adventure: AdventureDTO) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      {/* Alert banner */}
      <div className="rounded-lg border border-amber-700/60 bg-amber-900/20 p-4">
        <p className="font-medium text-amber-200">
          ⚠️ Vous avez atteint la limite de 5 aventures en cours.
        </p>
        <p className="mt-1 text-sm text-stone-400">
          Terminez ou abandonnez une aventure pour en lancer une nouvelle.
        </p>
      </div>

      {/* Active adventures list */}
      <div className="space-y-2">
        {adventures.map((adventure) => (
          <div
            key={adventure.id}
            className="flex items-center gap-3 rounded-lg border border-stone-700/50 bg-stone-800/30 px-4 py-3"
          >
            <span aria-hidden="true">🗺️</span>
            <span className="flex-1 text-sm font-medium text-amber-100 truncate">
              {adventure.title}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded p-1 text-stone-400 hover:text-stone-200 transition-colors"
                  aria-label="Options"
                >
                  ⋮
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-stone-700 bg-stone-900 text-amber-100"
              >
                <DropdownMenuItem
                  onClick={() =>
                    void navigate({ to: "/adventure/$id", params: { id: adventure.id } })
                  }
                  className="cursor-pointer"
                >
                  Reprendre
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onAbandon(adventure)}
                  className="cursor-pointer text-red-400 focus:text-red-300"
                >
                  Abandonner
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function NewAdventurePage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();

  const { data: user } = useCurrentUser();
  const characterName = user?.username ?? "Aventurier";

  const { data: activeAdventures = [], isLoading: activeLoading } = useActiveAdventures();
  const {
    data: templates = [],
    isLoading: templatesLoading,
    isError: templatesError,
    refetch: refetchTemplates,
  } = useTemplates();

  const [config, setConfig] = useState<AdventureConfig>(DEFAULT_CONFIG);
  const [step, setStep] = useState<"config" | "confirmation">("config");
  const [abandonTarget, setAbandonTarget] = useState<AdventureDTO | null>(null);

  const isAtLimit = !activeLoading && activeAdventures.length >= 5;

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
        <header className="flex items-center gap-3">
          <Button
            variant="link"
            onClick={() => setStep("config")}
            className="p-0 m-0 text-amber-400 hover:text-amber-300 transition-colors hover:no-underline"
            aria-label="Modifier les paramètres"
          >
            ←
          </Button>
          <h1 className="text-lg font-semibold text-amber-100">Confirmer l&apos;aventure</h1>
        </header>

        <ConfirmationCard
          duration={config.duration}
          difficulty={config.difficulty}
          characterName={characterName}
          {...(config.templateName ? { templateName: config.templateName } : {})}
        />

        <Button className="w-full uppercase tracking-wider" onClick={handleLaunch}>
          LANCER L&apos;AVENTURE
        </Button>

        <Button
          variant="link"
          onClick={() => setStep("config")}
          className="w-full p-0 m-0 text-center text-sm text-stone-400 transition-colors hover:text-stone-200 hover:no-underline"
        >
          Modifier les paramètres
        </Button>
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

      {/* Limit screen — replaces all config content */}
      {!activeLoading && isAtLimit && (
        <>
          <AdventureLimitScreen
            adventures={activeAdventures}
            onAbandon={(adv) => setAbandonTarget(adv)}
          />
          <AbandonModal adventure={abandonTarget} onClose={() => setAbandonTarget(null)} />
        </>
      )}

      {/* Config content — hidden when at limit */}
      {!activeLoading && !isAtLimit && (
        <>
          {/* Custom config mode */}
          {mode === "custom" && (
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
              <div>
                <h2 className="mb-4 text-base font-semibold text-amber-100">
                  Combien de temps avez-vous ?
                </h2>
                <DurationSelector
                  value={config.duration}
                  onChange={(d) => setConfig((c) => ({ ...c, duration: d }))}
                />
              </div>
              <div>
                <h2 className="mb-4 text-base font-semibold text-amber-100">
                  Quel défi souhaitez-vous ?
                </h2>
                <DifficultySlider
                  value={config.difficulty}
                  onChange={(d) => setConfig((c) => ({ ...c, difficulty: d }))}
                />
              </div>
            </div>
          )}

          {/* Templates mode */}
          {mode === "templates" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-amber-100">Choisissez un scénario</h2>

              {templatesLoading && (
                <div className="space-y-4">
                  <TemplateCardSkeleton />
                  <TemplateCardSkeleton />
                </div>
              )}

              {templatesError && !templatesLoading && (
                <div className="rounded-lg border border-stone-700 bg-stone-800/30 p-4 text-center">
                  <p className="text-sm text-stone-400">Impossible de charger les scénarios.</p>
                  <button
                    type="button"
                    onClick={() => void refetchTemplates()}
                    className="mt-2 text-sm text-amber-400 underline hover:text-amber-300"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              {!templatesLoading && !templatesError && (
                <div className="space-y-4 overflow-y-auto">
                  {templates.map((tpl: AdventureTemplateDTO) => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Random mode — Story 5.3 will handle this; show custom config as fallback */}
          {mode === "random" && (
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
              <div>
                <h2 className="mb-4 text-base font-semibold text-amber-100">
                  Combien de temps avez-vous ?
                </h2>
                <DurationSelector
                  value={config.duration}
                  onChange={(d) => setConfig((c) => ({ ...c, duration: d }))}
                />
              </div>
              <div>
                <h2 className="mb-4 text-base font-semibold text-amber-100">
                  Quel défi souhaitez-vous ?
                </h2>
                <DifficultySlider
                  value={config.difficulty}
                  onChange={(d) => setConfig((c) => ({ ...c, difficulty: d }))}
                />
              </div>
            </div>
          )}

          {/* CTA — only for custom/random modes (templates go directly to confirmation on "CHOISIR") */}
          {(mode === "custom" || mode === "random") && (
            <div className="flex justify-center lg:mt-2">
              <Button
                className="w-full max-w-xs uppercase tracking-wider"
                onClick={() => {
                  setConfig((c) => ({ ...c, isRandom: mode === "random" }));
                  setStep("confirmation");
                }}
              >
                LANCER L&apos;AVENTURE
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
