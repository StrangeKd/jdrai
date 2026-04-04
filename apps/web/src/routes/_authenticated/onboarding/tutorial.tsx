/**
 * Tutorial route — /onboarding/tutorial (Story 8.2)
 *
 * Implements the E7 tutorial interface: E10 game session + overlay layer
 * (TutorialTooltipLayer, PresetSelector, TutorialEndCard).
 *
 * AC: #1, #2, #3, #4, #5, #6, #7, #8, #11, #12
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import type { AdventureDTO, MetaCharacterDTO } from "@jdrai/shared";

import { CharacterPanel } from "@/components/game/CharacterPanel";
import { ExitConfirmModal } from "@/components/game/ExitConfirmModal";
import { FreeInput } from "@/components/game/FreeInput";
import { HistoryDrawer } from "@/components/game/HistoryDrawer";
import { IntroSession } from "@/components/game/IntroSession";
import { MilestoneOverlay } from "@/components/game/MilestoneOverlay";
import { NarrationPanel } from "@/components/game/NarrationPanel";
import { PauseMenu } from "@/components/game/PauseMenu";
import { SessionHeader } from "@/components/game/SessionHeader";
import {
  type PresetOption,
  PresetSelector,
} from "@/components/onboarding/PresetSelector";
import { TutorialEndCard } from "@/components/onboarding/TutorialEndCard";
import { TutorialTooltipLayer } from "@/components/onboarding/TutorialTooltipLayer";
import { useAuth } from "@/hooks/useAuth";
import { useGameSession } from "@/hooks/useGameSession";
import { useTutorial } from "@/hooks/useTutorial";
import { metaCharacterQuery } from "@/queries/meta-character.queries";
import { api } from "@/services/api";

// ---------------------------------------------------------------------------
// Icon maps for PresetSelector cards
// ---------------------------------------------------------------------------

const RACE_ICONS: Record<string, string> = {
  Humain: "👤",
  Elfe: "🧝",
  Nain: "🧔",
};

const CLASS_ICONS: Record<string, string> = {
  Aventurier: "⚔️",
  Guerrier: "🛡️",
  Mage: "🔮",
  Voleur: "🗡️",
};

const DEFAULT_ICON = "✨";

// Re-export for external consumers that previously imported from this file
export { metaCharacterQuery } from "@/queries/meta-character.queries";

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated/onboarding/tutorial")({
  component: TutorialPage,
});

export function TutorialPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // -------------------------------------------------------------------------
  // Tutorial adventure creation / restart state
  // -------------------------------------------------------------------------

  const [adventureId, setAdventureId] = useState<string | null>(null);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [existingTutorialId, setExistingTutorialId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // -------------------------------------------------------------------------
  // Tutorial overlay tracking flags
  // -------------------------------------------------------------------------

  const [hasChoicesRendered, setHasChoicesRendered] = useState(false);
  const [hasFreeInputFocused, setHasFreeInputFocused] = useState(false);
  const [hasPauseMenuOpenedForTooltip, setHasPauseMenuOpenedForTooltip] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // -------------------------------------------------------------------------
  // useTutorial — tooltip state + reference data
  // -------------------------------------------------------------------------

  const { isTooltipSeen, dismissTooltip, races, classes } = useTutorial();

  // -------------------------------------------------------------------------
  // MetaCharacter query (shared cache key with Hub)
  // -------------------------------------------------------------------------

  const { data: metaCharacter } = useQuery(metaCharacterQuery);

  // -------------------------------------------------------------------------
  // Discover existing active tutorial adventure on mount
  // -------------------------------------------------------------------------

  useQuery({
    queryKey: ["adventures", "active", "tutorial-check"],
    queryFn: async () => {
      const response = await api.get<{ success: true; data: AdventureDTO[] }>(
        "/api/v1/adventures?status=active",
      );
      const activeTutorial = response.data.find((a) => a.isTutorial && a.status === "active");
      if (activeTutorial) {
        setExistingTutorialId(activeTutorial.id);
        setShowRestartDialog(true);
      } else {
        await createTutorialAdventure();
      }
      return response.data;
    },
    // Run once on mount only
    staleTime: Infinity,
    gcTime: 0,
    enabled: adventureId === null && !showRestartDialog,
  });

  // -------------------------------------------------------------------------
  // Create new tutorial adventure
  // -------------------------------------------------------------------------

  const createTutorialAdventure = useCallback(async () => {
    setIsCreating(true);
    try {
      const response = await api.post<{ success: true; data: AdventureDTO }>(
        "/api/v1/adventures",
        {
          isTutorial: true,
          difficulty: "easy",
          estimatedDuration: "short",
        },
      );
      setAdventureId(response.data.id);
    } finally {
      setIsCreating(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // "Recommencer" dialog handlers
  // -------------------------------------------------------------------------

  const handleRestart = useCallback(async () => {
    if (!existingTutorialId) return;
    setShowRestartDialog(false);
    await api.patch(`/api/v1/adventures/${existingTutorialId}`, { status: "abandoned" });
    await createTutorialAdventure();
  }, [existingTutorialId, createTutorialAdventure]);

  const handleContinueExisting = useCallback(() => {
    if (!existingTutorialId) return;
    setShowRestartDialog(false);
    setAdventureId(existingTutorialId);
  }, [existingTutorialId]);

  // -------------------------------------------------------------------------
  // Render: loading / restart dialog
  // -------------------------------------------------------------------------

  if (!adventureId || showRestartDialog) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-stone-950 text-amber-100 px-6">
        {showRestartDialog ? (
          <div className="w-full max-w-sm space-y-4 text-center">
            <p className="text-lg font-semibold">Une aventure est déjà en cours.</p>
            <p className="text-sm text-stone-400">
              Cette aventure est en cours. Recommencer depuis le début ?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => void handleRestart()}
                className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-500 transition-colors"
              >
                Recommencer
              </button>
              <button
                onClick={handleContinueExisting}
                className="rounded-lg border border-stone-600 px-4 py-2 text-sm text-stone-300 hover:border-stone-400 transition-colors"
              >
                Continuer là où j'en étais
              </button>
            </div>
          </div>
        ) : (
          <div className="text-stone-400 text-sm">
            {isCreating ? "Création du tutoriel…" : "Chargement…"}
          </div>
        )}
      </div>
    );
  }

  return <TutorialSession adventureId={adventureId} username={user?.username ?? user?.email ?? "Aventurier"} metaCharacter={metaCharacter ?? null} races={races} classes={classes} isTooltipSeen={isTooltipSeen} dismissTooltip={dismissTooltip} isSaving={isSaving} setIsSaving={setIsSaving} hasChoicesRendered={hasChoicesRendered} setHasChoicesRendered={setHasChoicesRendered} hasFreeInputFocused={hasFreeInputFocused} setHasFreeInputFocused={setHasFreeInputFocused} hasPauseMenuOpenedForTooltip={hasPauseMenuOpenedForTooltip} setHasPauseMenuOpenedForTooltip={setHasPauseMenuOpenedForTooltip} queryClient={queryClient} />;
}

// ---------------------------------------------------------------------------
// TutorialSession — rendered once adventureId is known
// Separated to ensure useGameSession is only called after adventureId is set.
// ---------------------------------------------------------------------------

interface TutorialSessionProps {
  adventureId: string;
  username: string;
  metaCharacter: MetaCharacterDTO | null;
  races: ReturnType<typeof useTutorial>["races"];
  classes: ReturnType<typeof useTutorial>["classes"];
  isTooltipSeen: (id: string) => boolean;
  dismissTooltip: (id: string) => void;
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
  hasChoicesRendered: boolean;
  setHasChoicesRendered: (v: boolean) => void;
  hasFreeInputFocused: boolean;
  setHasFreeInputFocused: (v: boolean) => void;
  hasPauseMenuOpenedForTooltip: boolean;
  setHasPauseMenuOpenedForTooltip: (v: boolean) => void;
  queryClient: ReturnType<typeof useQueryClient>;
}

function TutorialSession({
  adventureId,
  username,
  metaCharacter,
  races,
  classes,
  isTooltipSeen,
  dismissTooltip,
  isSaving,
  setIsSaving,
  hasChoicesRendered,
  setHasChoicesRendered,
  hasFreeInputFocused,
  setHasFreeInputFocused,
  hasPauseMenuOpenedForTooltip,
  setHasPauseMenuOpenedForTooltip,
  queryClient,
}: TutorialSessionProps) {
  const navigate = useNavigate();

  const {
    gameState,
    currentScene,
    streamingBuffer,
    playerEcho,
    choices,
    presetSelector,
    isLoading,
    isStreaming,
    gameError,
    sendAction,
    currentHp,
    maxHp,
    lastSavedAt,
    showAutosaveIndicator,
    isPauseMenuOpen,
    isAdventureComplete,
    openPauseMenu,
    closePauseMenu,
    manualSave,
    showMilestoneOverlay,
    milestoneOverlayName,
    isHistoryDrawerOpen,
    isFirstLaunch,
    openHistoryDrawer,
    closeHistoryDrawer,
    dismissIntro,
    isGameOver,
    isExitModalOpen,
    openExitModal,
    closeExitModal,
    isConfirmingExit,
    confirmExit,
    isRateLimited,
    rateLimitCountdown,
    isDisconnected,
    connectionFailed,
    manualReconnect,
    hasLLMError,
    retryLastAction,
    isLocked,
    exitGameSession,
  } = useGameSession(adventureId, { isNew: true });

  // -------------------------------------------------------------------------
  // PresetSelector — derive options from reference data + presetSelector signal
  // -------------------------------------------------------------------------

  const presetType = presetSelector; // "race" | "class" | undefined

  const presetOptions: PresetOption[] =
    presetType === "race"
      ? races.map((r) => ({
          id: r.id,
          name: r.name,
          icon: RACE_ICONS[r.name] ?? DEFAULT_ICON,
          trait: r.description ?? "",
        }))
      : presetType === "class"
        ? classes.map((c) => ({
            id: c.id,
            name: c.name,
            icon: CLASS_ICONS[c.name] ?? DEFAULT_ICON,
            trait: c.description ?? "",
          }))
        : [];

  // Track tooltip trigger: choices/preset are visible
  const hasChoices = choices.length > 0 || (!!presetType && presetOptions.length > 0);
  if (hasChoices && !hasChoicesRendered) {
    setHasChoicesRendered(true);
  }

  // -------------------------------------------------------------------------
  // Pause menu — track first open for tooltip
  // -------------------------------------------------------------------------

  const handleOpenPauseMenu = () => {
    if (!hasPauseMenuOpenedForTooltip) {
      setHasPauseMenuOpenedForTooltip(true);
    }
    openPauseMenu();
  };

  // -------------------------------------------------------------------------
  // Adventure completion — show TutorialEndCard instead of navigating to /summary
  // -------------------------------------------------------------------------

  // On adventure complete, invalidate meta-character cache so TutorialEndCard shows fresh data
  if (isAdventureComplete || isGameOver) {
    void queryClient.invalidateQueries({ queryKey: ["meta-character"] });
  }

  // -------------------------------------------------------------------------
  // Exit / Quit tutorial — calls confirmExit which saves + navigates to /hub
  // -------------------------------------------------------------------------

  const handleConfirmExit = () => {
    exitGameSession();
    void confirmExit();
  };

  const handleCancelExit = () => {
    closeExitModal();
  };

  // -------------------------------------------------------------------------
  // Manual save
  // -------------------------------------------------------------------------

  const handleManualSave = async () => {
    setIsSaving(true);
    await manualSave();
    setIsSaving(false);
  };

  const character = gameState?.adventure?.character;
  const adventureTitle = gameState?.adventure.title ?? "Tutoriel";
  const milestones = gameState?.milestones ?? [];

  const showPresetSelector = !isStreaming && !hasLLMError && !!presetType && presetOptions.length > 0;
  const showChoices = !isStreaming && !hasLLMError && !showPresetSelector && choices.length > 0;

  // -------------------------------------------------------------------------
  // TutorialEndCard — shown when adventure completed
  // -------------------------------------------------------------------------

  const showEndCard = isAdventureComplete || isGameOver;

  return (
    <div className="fixed inset-0 flex flex-col bg-stone-950 text-amber-100 overflow-hidden">
      {/* SessionHeader */}
      <SessionHeader
        title={adventureTitle}
        currentHp={currentHp}
        maxHp={maxHp}
        showAutosaveIndicator={showAutosaveIndicator}
        onPauseMenuOpen={handleOpenPauseMenu}
        {...(character ? { character } : {})}
      />

      {/* CharacterPanel — mobile only */}
      {character && (
        <CharacterPanel character={character} currentHp={currentHp} maxHp={maxHp} />
      )}

      {/* NarrationPanel */}
      <div className="flex-1 min-h-0 flex justify-center overflow-hidden pt-24 md:pt-14">
        <div className="w-full max-w-[720px]">
          <NarrationPanel
            currentScene={currentScene}
            streamingBuffer={streamingBuffer}
            playerEcho={playerEcho}
            choices={showChoices ? choices : []}
            isLoading={isLoading}
            isStreaming={isStreaming}
            isLocked={isLocked}
            onChoiceSelect={(choice) => void sendAction(choice.label, choice.id)}
            isDisconnected={isDisconnected}
            connectionFailed={connectionFailed}
            hasLLMError={hasLLMError}
            isRateLimited={isRateLimited}
            rateLimitCountdown={rateLimitCountdown}
            onReconnectRetry={manualReconnect}
            onLLMRetry={retryLastAction}
          />
          {/* PresetSelector rendered below NarrationPanel content */}
          {showPresetSelector && (
            <div className="px-6 pb-4">
              <PresetSelector
                type={presetType}
                options={presetOptions}
                onSelect={(opt) => void sendAction(opt.name, opt.id, presetType)}
                isDisabled={isLocked}
              />
            </div>
          )}
        </div>
      </div>

      {/* Game error banner */}
      {gameError && (
        <div
          role="alert"
          className="shrink-0 px-4 py-2 bg-red-900/80 text-red-200 text-sm text-center border-t border-red-700"
        >
          {gameError}
        </div>
      )}

      {/* FreeInput */}
      <div className="shrink-0">
        <FreeInput
          disabled={isLocked}
          isStreaming={isStreaming}
          isLoading={isLoading}
          isRateLimited={isRateLimited}
          rateLimitCountdown={rateLimitCountdown}
          isDisconnected={isDisconnected}
          onSubmit={(text) => void sendAction(text)}
          onHistoryClick={openHistoryDrawer}
          onFocus={() => {
            if (!hasFreeInputFocused) setHasFreeInputFocused(true);
          }}
        />
      </div>

      {/* Tutorial overlay layer */}
      <TutorialTooltipLayer
        hasChoicesRendered={hasChoicesRendered}
        hasFreeInputFocused={hasFreeInputFocused}
        hasPauseMenuOpened={hasPauseMenuOpenedForTooltip}
        isTooltipSeen={isTooltipSeen}
        dismissTooltip={dismissTooltip}
      />

      {/* TutorialEndCard — full-screen overlay when adventure completed */}
      {showEndCard && (
        <TutorialEndCard
          username={username}
          metaCharacter={metaCharacter}
          onNavigateHub={() => {
            exitGameSession();
            void navigate({ to: "/hub" });
          }}
        />
      )}

      {/* PauseMenu — quit calls openExitModal */}
      <PauseMenu
        isOpen={isPauseMenuOpen}
        onClose={closePauseMenu}
        onSave={handleManualSave}
        onHistory={openHistoryDrawer}
        onQuit={() => {
          closePauseMenu();
          openExitModal();
        }}
        lastSavedAt={lastSavedAt}
        isSaving={isSaving}
      />

      {/* HistoryDrawer */}
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={closeHistoryDrawer}
        adventureId={adventureId}
        milestones={milestones}
      />

      {/* MilestoneOverlay */}
      <MilestoneOverlay
        visible={showMilestoneOverlay}
        milestoneName={milestoneOverlayName}
      />

      {/* IntroSession */}
      <IntroSession
        visible={isFirstLaunch}
        isClickable={isLoading || isStreaming}
        onDismiss={dismissIntro}
      />

      {/* ExitConfirmModal — quit tutorial */}
      <ExitConfirmModal
        isOpen={isExitModalOpen || false}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
        lastSavedAt={lastSavedAt}
        isConfirming={isConfirmingExit}
      />
    </div>
  );
}
