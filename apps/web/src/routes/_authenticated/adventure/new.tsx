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
  difficulty: z.enum(["easy", "normal", "hard", "nightmare"]).optional(),
  estimatedDuration: z.enum(["short", "medium", "long"]).optional(),
  templateId: z.string().min(1).optional(),
});

export const Route = createFileRoute("/_authenticated/adventure/new")({
  validateSearch: searchSchema,
  component: NewAdventurePage,
});

// ---------------------------------------------------------------------------
// Local state types
// ---------------------------------------------------------------------------

type AdventureStep =
  | "config" // WF-E9-01 (custom) or WF-E9-02 (templates)
  | "confirmation" // WF-E9-03 (custom + template paths)
  | "random-choice" // WF-E9-03b (random: reveal or surprise)
  | "random-revealed" // WF-E9-03c (random: params shown, can re-roll)
  | "loading" // WF-E9-04 (full-screen, nav hidden)
  | "error"; // WF-E9-05 (after 3 failed attempts)

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
  const { mode, difficulty, estimatedDuration, templateId } = Route.useSearch();
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
  const initialConfig: AdventureConfig = {
    ...DEFAULT_CONFIG,
    ...(difficulty ? { difficulty } : {}),
    ...(estimatedDuration ? { duration: estimatedDuration } : {}),
    ...(templateId ? { templateId } : {}),
  };

  const [config, setConfig] = useState<AdventureConfig>(initialConfig);
  const [step, setStep] = useState<AdventureStep>(() =>
    mode === "random" ? "random-choice" : "config",
  );
  const [abandonTarget, setAbandonTarget] = useState<AdventureDTO | null>(null);

  // DEV only — LLM mode selector (persisted in localStorage, read by useGameChat on action send)
  type DevMode = "normal" | "mock" | "free";
  const [devMode, setDevMode] = useState<DevMode>(() => {
    if (!import.meta.env.DEV) return "normal";
    if (localStorage.getItem("dev:mockLlm") === "true") return "mock";
    if (localStorage.getItem("dev:freeModels") === "true") return "free";
    return "normal";
  });

  function changeDevMode(mode: DevMode) {
    localStorage.setItem("dev:mockLlm",    String(mode === "mock"));
    localStorage.setItem("dev:freeModels", String(mode === "free"));
    setDevMode(mode);
  }

  const isAtLimit = !activeLoading && !activeError && activeAdventures.length >= 5;

  // ---------------------------------------------------------------------------
  // DEV mock LLM toggle — rendered on all config/confirmation/random steps
  // ---------------------------------------------------------------------------

  const DEV_MODES: { id: DevMode; label: string; title: string }[] = [
    { id: "normal", label: "Normal",  title: "Provider configuré dans .env" },
    { id: "mock",   label: "Mock",    title: "Réponse hardcodée — zéro token" },
    { id: "free",   label: "Gratuit", title: "OpenRouter free tier (LLM_FREE_MODEL_KEY)" },
  ];

  const DevMockToggle = import.meta.env.DEV ? (
    <div className="flex items-center gap-2 rounded border border-yellow-600/40 bg-yellow-950/30 px-3 py-2 text-xs text-yellow-400">
      <span className="font-mono font-semibold shrink-0">DEV</span>
      <span className="shrink-0 text-yellow-600">LLM :</span>
      <div className="flex flex-1 gap-1">
        {DEV_MODES.map(({ id, label, title }) => (
          <button
            key={id}
            type="button"
            title={title}
            onClick={() => changeDevMode(id)}
            className={[
              "rounded px-2 py-0.5 font-medium transition-colors",
              devMode === id
                ? "bg-yellow-500 text-stone-900"
                : "bg-stone-700 text-stone-400 hover:bg-stone-600 hover:text-stone-200",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
      <span className="shrink-0 text-yellow-600/60 italic">
        {DEV_MODES.find((m) => m.id === devMode)?.title}
      </span>
    </div>
  ) : null;

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
        onLimitReached={() => setStep(mode === "random" ? "random-choice" : "config")}
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
  // Active adventures limit guard (all non-loading/non-error steps)
  // ---------------------------------------------------------------------------

  if (!activeLoading && !activeError && isAtLimit) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
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
        <AdventureLimitScreen
          adventures={activeAdventures}
          onAbandon={(adv) => setAbandonTarget(adv)}
        />
        <AbandonModal adventure={abandonTarget} onClose={() => setAbandonTarget(null)} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Random choice (WF-E9-03b)
  // ---------------------------------------------------------------------------

  if (step === "random-choice") {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {DevMockToggle}
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
        {DevMockToggle}
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
        {DevMockToggle}
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

      {/* Config content */}
      {!activeLoading && !activeError && (
        <>
          {mode === "custom" && (
            <AdventureCustomConfigView
              duration={config.duration}
              difficulty={config.difficulty}
              onDurationChange={(d) => setConfig((c) => ({ ...c, duration: d }))}
              onDifficultyChange={(d) => setConfig((c) => ({ ...c, difficulty: d }))}
              onNext={() => {
                setConfig((c) => ({ ...c, isRandom: false, hiddenParams: false }));
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
