/**
 * useGameUI — pure UI state for the game session screen.
 *
 * Responsibilities:
 *  - Pause menu, history drawer, exit modal state + actions
 *  - Milestone overlay + auto-dismiss timer
 *  - Session intro (isFirstLaunch) + minimum display timer
 *  - Autosave indicator + lastSavedAt
 *  - beforeunload guard (tab close / refresh prevention)
 *  - isInGameSession flag lifecycle
 *
 * Cross-domain methods exposed for the coordinator:
 *  - triggerSave(date) — called after save API completes
 *  - showMilestone(name) — called on milestone_complete socket event
 *  - handleIntroEnd() — called after first GM response completes
 *
 * Used as a sub-hook by useGameSession (Story 7.4).
 */
import { useEffect, useRef, useState } from "react";

import type { useNavigate } from "@tanstack/react-router";

import type { GameStateDTO } from "@jdrai/shared";

type NavigateFn = ReturnType<typeof useNavigate>;

export interface GameUIInputs {
  adventureId: string;
  options?: { isNew?: boolean; isResume?: boolean };
  /** Called by confirmExit — should be coordinator's manualSave() */
  onConfirmExitSave: () => Promise<void>;
  navigate: NavigateFn;
  /** Used to initialise lastSavedAt from adventure.lastPlayedAt on first load */
  gameState: GameStateDTO | null;
}

/** Public state/actions exposed in GameSessionState */
export interface GameUIPublicState {
  isPauseMenuOpen: boolean;
  isHistoryDrawerOpen: boolean;
  isExitModalOpen: boolean;
  isConfirmingExit: boolean;
  showMilestoneOverlay: boolean;
  milestoneOverlayName: string | null;
  isFirstLaunch: boolean;
  showAutosaveIndicator: boolean;
  lastSavedAt: Date | null;
  isInGameSession: boolean;
  openPauseMenu: () => void;
  closePauseMenu: () => void;
  openHistoryDrawer: () => void;
  closeHistoryDrawer: () => void;
  openExitModal: () => void;
  closeExitModal: () => void;
  confirmExit: (onNavigate?: () => void) => Promise<void>;
  dismissIntro: () => void;
  exitGameSession: () => void;
}

/** Full state including cross-domain wiring methods (coordinator-only, not in GameSessionState) */
export interface GameUIState extends GameUIPublicState {
  /** Update lastSavedAt + show autosave indicator for 2s */
  triggerSave: (date: Date) => void;
  /** Show milestone overlay with auto-dismiss after 2500ms */
  showMilestone: (nextMilestone: string) => void;
  /** Dismiss intro with minimum display timer enforcement */
  handleIntroEnd: () => void;
}

export function useGameUI({ adventureId, options, onConfirmExitSave, navigate, gameState }: GameUIInputs): GameUIState {
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isConfirmingExit, setIsConfirmingExit] = useState(false);
  const [showMilestoneOverlay, setShowMilestoneOverlay] = useState(false);
  const [milestoneOverlayName, setMilestoneOverlayName] = useState<string | null>(null);
  // isResume overrides isNew: no intro on resume
  const [isFirstLaunch, setIsFirstLaunch] = useState(
    options?.isResume ? false : (options?.isNew ?? false),
  );
  const [showAutosaveIndicator, setShowAutosaveIndicator] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isInGameSession, setIsInGameSession] = useState(true);

  // Timer refs — cleared on unmount to prevent setState after unmount
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const milestoneOverlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Minimum timestamp until which the intro must stay visible (ensures readability)
  const introMinDisplayUntilRef = useRef<number>(
    options?.isNew && !options?.isResume ? Date.now() + 2000 : 0,
  );

  // Stable ref for onConfirmExitSave to avoid stale closures in confirmExit
  const onConfirmExitSaveRef = useRef(onConfirmExitSave);
  onConfirmExitSaveRef.current = onConfirmExitSave;

  // Seed lastSavedAt from initial game state load
  useEffect(() => {
    if (gameState?.adventure?.lastPlayedAt) {
      setLastSavedAt(new Date(gameState.adventure.lastPlayedAt));
    }
  }, [gameState]);

  // beforeunload guard: prevents tab close / refresh during active session
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isInGameSession) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome; message ignored by modern browsers
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isInGameSession]);

  // Timer cleanup on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      if (milestoneOverlayTimerRef.current) clearTimeout(milestoneOverlayTimerRef.current);
      if (introHideTimerRef.current) clearTimeout(introHideTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Cross-domain methods (called by coordinator)
  // ---------------------------------------------------------------------------

  function triggerSave(date: Date): void {
    setLastSavedAt(date);
    setShowAutosaveIndicator(true);
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => setShowAutosaveIndicator(false), 2000);
  }

  function showMilestone(nextMilestone: string): void {
    setMilestoneOverlayName(nextMilestone);
    setShowMilestoneOverlay(true);
    if (milestoneOverlayTimerRef.current) clearTimeout(milestoneOverlayTimerRef.current);
    milestoneOverlayTimerRef.current = setTimeout(() => {
      setShowMilestoneOverlay(false);
      setMilestoneOverlayName(null);
    }, 2500);
  }

  function handleIntroEnd(): void {
    const remaining = introMinDisplayUntilRef.current - Date.now();
    if (remaining > 0) {
      introHideTimerRef.current = setTimeout(() => setIsFirstLaunch(false), remaining);
    } else {
      setIsFirstLaunch(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Pause menu
  // ---------------------------------------------------------------------------

  function openPauseMenu() {
    setIsPauseMenuOpen(true);
  }

  function closePauseMenu() {
    setIsPauseMenuOpen(false);
  }

  // ---------------------------------------------------------------------------
  // History drawer
  // ---------------------------------------------------------------------------

  function openHistoryDrawer() {
    setIsHistoryDrawerOpen(true);
  }

  function closeHistoryDrawer() {
    setIsHistoryDrawerOpen(false);
  }

  // ---------------------------------------------------------------------------
  // Session intro
  // ---------------------------------------------------------------------------

  function dismissIntro() {
    if (introHideTimerRef.current) clearTimeout(introHideTimerRef.current);
    setIsFirstLaunch(false);
  }

  // ---------------------------------------------------------------------------
  // Exit modal + confirmation
  // ---------------------------------------------------------------------------

  function openExitModal() {
    setIsExitModalOpen(true);
  }

  function closeExitModal() {
    setIsExitModalOpen(false);
  }

  async function confirmExit(onNavigate?: () => void): Promise<void> {
    setIsConfirmingExit(true);

    // Save silently — data is already auto-saved; this just refreshes lastPlayedAt
    try {
      await onConfirmExitSaveRef.current();
    } catch {
      // Silent — don't block exit on save failure
    }

    // MUST be set to false before navigate() / blocker.proceed() to prevent
    // the beforeunload listener from firing during the router transition.
    setIsInGameSession(false);

    if (onNavigate) {
      onNavigate(); // e.g. blocker.proceed() — let TanStack Router complete blocked navigation
    } else {
      void navigate({ to: "/hub" });
    }

    // May not execute if navigate unmounts the component — that is fine
    setIsConfirmingExit(false);
  }

  function exitGameSession() {
    setIsInGameSession(false);
  }

  return {
    isPauseMenuOpen,
    isHistoryDrawerOpen,
    isExitModalOpen,
    isConfirmingExit,
    showMilestoneOverlay,
    milestoneOverlayName,
    isFirstLaunch,
    showAutosaveIndicator,
    lastSavedAt,
    isInGameSession,
    openPauseMenu,
    closePauseMenu,
    openHistoryDrawer,
    closeHistoryDrawer,
    openExitModal,
    closeExitModal,
    confirmExit,
    dismissIntro,
    exitGameSession,
    // Cross-domain methods
    triggerSave,
    showMilestone,
    handleIntroEnd,
  };
}
