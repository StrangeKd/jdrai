/**
 * useGameSession — coordinator hook for the game session screen (Story 7.4 refactor).
 *
 * Responsibilities (coordinator only):
 *  - Fetch initial game state via GET /adventures/:id/state
 *  - Manage narrative global state: currentHp, maxHp, isAdventureComplete, isGameOver
 *  - Expose manualSave() (POST /adventures/:id/save)
 *  - Compose sub-hooks: useGameStreaming, useGameResilience, useGameUI
 *  - Wire cross-domain callbacks via stable refs (HP, completion, milestone, autosave, intro)
 *  - Compute isLocked from sub-hook states
 *  - Expose the unchanged GameSessionState interface to consumers
 *
 * Consumed by the /$id game session route.
 * Public interface (GameSessionState) is identical to pre-refactor — zero consumer changes.
 */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ApiResponse, GameStateDTO } from "@jdrai/shared";

import { api } from "@/services/api";

import { useGameResilience } from "./useGameResilience";
import { useGameStreaming } from "./useGameStreaming";
import { useGameUI } from "./useGameUI";

export interface GameSessionState {
  /** Full initial state fetched from REST on mount */
  gameState: GameStateDTO | null;
  /** Last clean text from game:response-complete (signal-stripped) */
  currentScene: string;
  /** Accumulates game:chunk text during streaming */
  streamingBuffer: string;
  /** Player's last submitted action — shown as echo during loading/streaming */
  playerEcho: string | null;
  /** Suggested choices from game:response-complete */
  choices: import("@jdrai/shared").SuggestedAction[];
  /** true: action submitted, waiting for game:response-start */
  isLoading: boolean;
  /** true: receiving game:chunk events */
  isStreaming: boolean;
  /** Error message from game:error event */
  gameError: string | null;
  /** true while mounted on the game session route (used by Story 6.7 beforeunload guard) */
  isInGameSession: boolean;
  /** Character current HP — updated via game:state-update hp_change */
  currentHp: number;
  /** Character max HP — updated via game:state-update hp_change */
  maxHp: number;
  /** Last save timestamp, initialised from adventure.lastPlayedAt */
  lastSavedAt: Date | null;
  /** true for 2s after each auto-save or manual save */
  showAutosaveIndicator: boolean;
  /** true when the pause overlay is open */
  isPauseMenuOpen: boolean;
  /** true when the adventure has ended (adventure_complete or game_over) */
  isAdventureComplete: boolean;
  /** true when the adventure ended with game_over */
  isGameOver: boolean;
  /** true while the milestone celebration overlay is visible */
  showMilestoneOverlay: boolean;
  /** Name of the milestone being celebrated, or null */
  milestoneOverlayName: string | null;
  /** true while the history drawer is open */
  isHistoryDrawerOpen: boolean;
  /** true on first load when adventure has no messages yet — shows IntroSession */
  isFirstLaunch: boolean;
  /** Submit a player action (free text or choice label) */
  sendAction: (action: string, choiceId?: string) => Promise<void>;
  /** Open the pause overlay */
  openPauseMenu: () => void;
  /** Close the pause overlay */
  closePauseMenu: () => void;
  /** Manually save the adventure via POST /adventures/:id/save */
  manualSave: () => Promise<void>;
  /** Open the history drawer */
  openHistoryDrawer: () => void;
  /** Close the history drawer */
  closeHistoryDrawer: () => void;
  /** Immediately dismiss the intro overlay (bypasses minimum display timer) */
  dismissIntro: () => void;
  /** true when the exit confirmation modal is open */
  isExitModalOpen: boolean;
  /** Open the exit confirmation modal */
  openExitModal: () => void;
  /** Close the exit confirmation modal */
  closeExitModal: () => void;
  /** true while save + navigate are in progress during exit */
  isConfirmingExit: boolean;
  /**
   * Confirm exit: auto-saves then navigates away.
   * If onNavigate is provided (e.g. blocker.proceed()), calls it instead of navigate(/hub).
   */
  confirmExit: (onNavigate?: () => void) => Promise<void>;
  /** true while the server is rate-limiting requests (HTTP 429) */
  isRateLimited: boolean;
  /** Countdown in seconds until rate-limit lifts (0 when not rate-limited) */
  rateLimitCountdown: number;
  /** true while the Socket.io connection is lost and auto-reconnection is in progress */
  isDisconnected: boolean;
  /** true when all 3 reconnection attempts have been exhausted (permanent failure state) */
  connectionFailed: boolean;
  /** Manually restart Socket.io connection attempts after permanent failure */
  manualReconnect: () => void;
  /** true when the LLM backend returned an error (all 3 internal retries exhausted) */
  hasLLMError: boolean;
  /** Re-sends the last player action — resets hasLLMError and calls sendAction again */
  retryLastAction: () => void;
  /**
   * Composite lock flag: true when player input must be disabled.
   * = isLoading || isStreaming || isRateLimited || isDisconnected || isAdventureComplete
   * Note: hasLLMError is NOT included — FreeInput is re-enabled on LLM error.
   */
  isLocked: boolean;
  /**
   * Clears the isInGameSession flag without navigating.
   * Must be called BEFORE programmatic navigation on adventure completion to bypass
   * the TanStack Router beforeNavigate guard (Story 7.2).
   */
  exitGameSession: () => void;
}

export function useGameSession(
  adventureId: string,
  options?: { isNew?: boolean; isResume?: boolean },
): GameSessionState {
  // ---------------------------------------------------------------------------
  // Stable callback refs — wires cross-domain calls from streaming → coordinator → UI
  // Each ref holds a function that will be updated on every render (fresh closures)
  // while providing a stable reference to pass to useGameStreaming.
  // ---------------------------------------------------------------------------
  const onHpChangeRef = useRef<(hp: number, maxHp: number) => void>(() => {});
  const onAdventureCompleteRef = useRef<(isGameOver: boolean) => void>(() => {});
  const onMilestoneCompleteRef = useRef<(next: string | null) => void>(() => {});
  const onResponseCompleteRef = useRef<(savedAt: Date) => void>(() => {});
  const onGameErrorRef = useRef<() => void>(() => {});

  // ---------------------------------------------------------------------------
  // REST initial state load — GET /adventures/:id/state
  // ---------------------------------------------------------------------------

  const { data: gameStateResponse } = useQuery<ApiResponse<GameStateDTO>>({
    queryKey: ["adventure", adventureId, "state"],
    queryFn: () => {
      const mockParam =
        import.meta.env.DEV && localStorage.getItem("dev:mockLlm") === "true"
          ? "?mockLlm=true"
          : "";
      return api.get<ApiResponse<GameStateDTO>>(
        `/api/v1/adventures/${adventureId}/state${mockParam}`,
      );
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const gameState = gameStateResponse?.data ?? null;

  // ---------------------------------------------------------------------------
  // Coordinator-owned narrative state
  // ---------------------------------------------------------------------------

  const [currentHp, setCurrentHp] = useState(0);
  const [maxHp, setMaxHp] = useState(0);
  const [isAdventureComplete, setIsAdventureComplete] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // ---------------------------------------------------------------------------
  // manualSave — defined before hooks but called at runtime (no ordering issue)
  // ---------------------------------------------------------------------------

  async function manualSave(): Promise<void> {
    try {
      const result = await api.post<ApiResponse<{ savedAt: string }>>(
        `/api/v1/adventures/${adventureId}/save`,
        {},
      );
      if (result.data?.savedAt) {
        ui.triggerSave(new Date(result.data.savedAt));
      }
    } catch {
      // Silent fail — auto-save already persists data; manual save is non-critical
    }
  }

  // ---------------------------------------------------------------------------
  // Sub-hooks
  // ---------------------------------------------------------------------------

  // resilience must be called before streaming — reconnectKey is passed as a dependency
  const resilience = useGameResilience();

  const streaming = useGameStreaming(
    adventureId,
    gameState,
    {
      onHpChange: useCallback((hp, maxHp) => onHpChangeRef.current(hp, maxHp), []),
      onAdventureComplete: useCallback((go) => onAdventureCompleteRef.current(go), []),
      onMilestoneComplete: useCallback((n) => onMilestoneCompleteRef.current(n), []),
      onResponseComplete: useCallback((d) => onResponseCompleteRef.current(d), []),
      onGameError: useCallback(() => onGameErrorRef.current(), []),
    },
    options,
    resilience.reconnectKey,
  );
  const navigate = useNavigate();
  const ui = useGameUI({
    options: options ?? {},
    onConfirmExitSave: manualSave,
    navigate,
    gameState,
  });

  // ---------------------------------------------------------------------------
  // Update callback refs (each render = fresh implementations with correct closures)
  // ---------------------------------------------------------------------------

  onHpChangeRef.current = (hp, max) => {
    setCurrentHp(hp);
    setMaxHp(max);
  };
  onAdventureCompleteRef.current = (go) => {
    setIsAdventureComplete(true);
    setIsGameOver(go);
  };
  onMilestoneCompleteRef.current = (next) => {
    if (next) ui.showMilestone(next);
  };
  onResponseCompleteRef.current = (savedAt) => {
    ui.triggerSave(savedAt);
    ui.handleIntroEnd();
  };
  onGameErrorRef.current = () => {
    ui.dismissIntro();
  };

  // ---------------------------------------------------------------------------
  // Seed HP from initial game state (coordinator owns HP)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!gameState?.adventure?.character) return;
    const char = gameState.adventure.character;
    setCurrentHp(char.currentHp);
    setMaxHp(char.maxHp);
  }, [gameState]);

  // ---------------------------------------------------------------------------
  // isLocked — composite from all sub-hooks + adventure completion
  // ---------------------------------------------------------------------------

  const isLocked =
    streaming.isLoading ||
    streaming.isStreaming ||
    resilience.isRateLimited ||
    resilience.isDisconnected ||
    isAdventureComplete;

  // ---------------------------------------------------------------------------
  // Compose public interface — identical to pre-refactor GameSessionState
  // ---------------------------------------------------------------------------

  const {
    triggerSave: _triggerSave,
    showMilestone: _showMilestone,
    handleIntroEnd: _handleIntroEnd,
    ...uiPublic
  } = ui;

  return {
    gameState,
    ...streaming,
    ...resilience,
    ...uiPublic,
    currentHp,
    maxHp,
    isAdventureComplete,
    isGameOver,
    isLocked,
    manualSave,
  };
}
