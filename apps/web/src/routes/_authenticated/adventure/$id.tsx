/**
 * Game session route — /adventure/:id (Story 6.4 Task 3 / Story 6.5 Task 7).
 *
 * Full-screen immersive mode: navigation chrome is hidden by AppLayout.shouldHideNav().
 * Uses useGameSession for all game state (socket + REST).
 */
import { createFileRoute, useBlocker, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { CharacterPanel } from "@/components/game/CharacterPanel";
import { ExitConfirmModal } from "@/components/game/ExitConfirmModal";
import { FreeInput } from "@/components/game/FreeInput";
import { HistoryDrawer } from "@/components/game/HistoryDrawer";
import { IntroSession } from "@/components/game/IntroSession";
import { MilestoneOverlay } from "@/components/game/MilestoneOverlay";
import { NarrationPanel } from "@/components/game/NarrationPanel";
import { PauseMenu } from "@/components/game/PauseMenu";
import { SessionHeader } from "@/components/game/SessionHeader";
import { useGameSession } from "@/hooks/useGameSession";

export const Route = createFileRoute("/_authenticated/adventure/$id")({
  component: GameSessionPage,
});

export function GameSessionPage() {
  const { id: adventureId } = Route.useParams();
  const isNewAdventure = useRouterState({
    select: (s) => !!s.location.state.isNew,
  });

  const {
    gameState,
    currentScene,
    streamingBuffer,
    playerEcho,
    choices,
    isLoading,
    isStreaming,
    gameError,
    sendAction,
    // Story 6.5
    currentHp,
    maxHp,
    lastSavedAt,
    showAutosaveIndicator,
    isPauseMenuOpen,
    isAdventureComplete,
    openPauseMenu,
    closePauseMenu,
    manualSave,
    // Story 6.6
    showMilestoneOverlay,
    milestoneOverlayName,
    isHistoryDrawerOpen,
    isFirstLaunch,
    openHistoryDrawer,
    closeHistoryDrawer,
    dismissIntro,
    // Story 6.7
    isInGameSession,
    isExitModalOpen,
    openExitModal,
    closeExitModal,
    isConfirmingExit,
    confirmExit,
  } = useGameSession(adventureId, { isNew: isNewAdventure });

  // Story 6.7 — Router blocker: intercepts in-app navigation and browser back button
  // while isInGameSession=true (adventure not yet complete).
  const blocker = useBlocker({
    shouldBlockFn: () => isInGameSession && !isAdventureComplete,
    withResolver: true,
  });

  // Unified modal open state: manual (PauseMenu quit) OR router-blocked navigation
  const isExitModalActuallyOpen = isExitModalOpen || blocker.status === "blocked";

  // Confirm: save + navigate (or proceed blocked navigation)
  const handleConfirmExit = () => {
    if (blocker.status === "blocked") {
      void confirmExit(() => blocker.proceed());
    } else {
      void confirmExit();
    }
  };

  // Cancel: stay in session
  const handleCancelExit = () => {
    if (blocker.status === "blocked") blocker.reset();
    closeExitModal();
  };

  const [isSaving, setIsSaving] = useState(false);

  const isLocked = isLoading || isStreaming;
  const character = gameState?.adventure?.character;
  const adventureTitle = gameState?.adventure.title ?? "Aventure";
  const milestones = gameState?.milestones ?? [];

  // ---------------------------------------------------------------------------
  // Story 7.x stub — redirect when adventure ends
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isAdventureComplete) {
      // TODO Story 7.2: navigate({ to: "/adventure/$id/summary", params: { id: adventureId } })
      console.log("[GameSession] Adventure complete — Story 7.x will handle redirect");
    }
  }, [isAdventureComplete, adventureId]);

  // ---------------------------------------------------------------------------
  // Desktop keyboard shortcuts
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = document.activeElement?.tagName === "INPUT";

      // Keys 1–4: select a suggested choice
      if (!isInputFocused && e.key >= "1" && e.key <= "4") {
        const idx = parseInt(e.key) - 1;
        const choice = choices[idx];
        if (choice && !isLocked) {
          void sendAction(choice.label, choice.id);
        }
      }

      // Enter: focus free input when not focused
      if (!isInputFocused && e.key === "Enter") {
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Votre action"]');
        if (input && !isLocked) {
          e.preventDefault();
          input.focus();
        }
      }

      // Space: open pause menu when input is not focused
      if (!isInputFocused && e.key === " ") {
        e.preventDefault();
        if (!isPauseMenuOpen) openPauseMenu();
      }

      // Escape: toggle pause menu (Story 6.5 — replaces Story 6.4 no-op)
      if (e.key === "Escape") {
        if (isPauseMenuOpen) {
          closePauseMenu();
        } else {
          openPauseMenu();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [choices, isLocked, sendAction, isPauseMenuOpen, openPauseMenu, closePauseMenu]);

  // ---------------------------------------------------------------------------
  // Manual save handler (tracks isSaving for PauseMenu loading state)
  // ---------------------------------------------------------------------------

  const handleManualSave = async () => {
    setIsSaving(true);
    await manualSave();
    setIsSaving(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="fixed inset-0 flex flex-col bg-stone-950 text-amber-100 overflow-hidden">
      {/* SessionHeader — fixed top-0, h-14 (Story 6.5) */}
      <SessionHeader
        title={adventureTitle}
        currentHp={currentHp}
        maxHp={maxHp}
        showAutosaveIndicator={showAutosaveIndicator}
        onPauseMenuOpen={openPauseMenu}
        {...(character ? { character } : {})}
      />

      {/* CharacterPanel — mobile only, fixed top-14, h-10 (Story 6.5) */}
      {character && (
        <CharacterPanel character={character} currentHp={currentHp} maxHp={maxHp} />
      )}

      {/* NarrationPanel — fills all remaining space.
          pt-24 on mobile (header 56px + character panel 40px),
          pt-14 on desktop (header only — CharacterPanel is hidden md:hidden) */}
      <div className="flex-1 min-h-0 flex justify-center overflow-hidden pt-24 md:pt-14">
        <div className="w-full max-w-[720px]">
          <NarrationPanel
            currentScene={currentScene}
            streamingBuffer={streamingBuffer}
            playerEcho={playerEcho}
            choices={choices}
            isLoading={isLoading}
            isStreaming={isStreaming}
            isLocked={isLocked}
            onChoiceSelect={(choice) => void sendAction(choice.label, choice.id)}
          />
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

      {/* FreeInput — fixed at bottom of screen */}
      <div className="shrink-0">
        <FreeInput
          disabled={isLocked}
          isStreaming={isStreaming}
          isLoading={isLoading}
          onSubmit={(text) => void sendAction(text)}
          onHistoryClick={openHistoryDrawer}
        />
      </div>

      {/* PauseMenu overlay — Story 6.5 */}
      <PauseMenu
        isOpen={isPauseMenuOpen}
        onClose={closePauseMenu}
        onSave={handleManualSave}
        onHistory={openHistoryDrawer}
        onQuit={() => { closePauseMenu(); openExitModal(); }}
        lastSavedAt={lastSavedAt}
        isSaving={isSaving}
      />

      {/* HistoryDrawer — Story 6.6 */}
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={closeHistoryDrawer}
        adventureId={adventureId}
        milestones={milestones}
      />

      {/* MilestoneOverlay — Story 6.6 */}
      <MilestoneOverlay
        visible={showMilestoneOverlay}
        milestoneName={milestoneOverlayName}
      />

      {/* IntroSession — Story 6.6, shown only on first launch of new adventure */}
      <IntroSession
        visible={isFirstLaunch}
        isClickable={isStreaming}
        onDismiss={dismissIntro}
      />

      {/* ExitConfirmModal — Story 6.7, highest z-index (110) */}
      <ExitConfirmModal
        isOpen={isExitModalActuallyOpen}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
        lastSavedAt={lastSavedAt}
        isConfirming={isConfirmingExit}
      />
    </div>
  );
}
