/**
 * useGameSession — single composable hook for the game session screen (Story 6.4 Task 2 / Story 6.5 Task 2).
 *
 * Responsibilities:
 *  - Establish and teardown the Socket.io connection (via connect/disconnect)
 *  - Load initial game state via GET /adventures/:id/state
 *  - Handle all socket events: response-start, chunk, response-complete, state-update, error
 *  - Manage game display state: currentScene, streamingBuffer, playerEcho, choices
 *  - Manage HP state, autosave indicator, pause menu state (Story 6.5)
 *  - Manage milestone overlay, history drawer, session intro state (Story 6.6)
 *  - Expose sendAction() which submits the player action via useGameChat
 *  - Expose manualSave(), openPauseMenu(), closePauseMenu() (Story 6.5)
 *  - Expose openHistoryDrawer(), closeHistoryDrawer() (Story 6.6)
 *
 * Consumed by the /$id game session route (Story 6.4 Task 3 / Story 6.5 Task 7 / Story 6.6 Task 7).
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import type { ApiResponse, GameStateDTO, SuggestedAction } from "@jdrai/shared";

import { api } from "@/services/api";
import { connect, disconnect, getSocket } from "@/services/socket.service";

import { useGameChat } from "./useGameChat";

// ---------------------------------------------------------------------------
// Signal stripping for streaming buffer
// ---------------------------------------------------------------------------

/**
 * Strips complete system signals from the streaming buffer and hides any
 * partial/in-progress signal at the end of the buffer (splits across chunks).
 *
 * Complete signals removed: [HP_CHANGE:x], [MILESTONE_COMPLETE:x],
 *   [ADVENTURE_COMPLETE], [GAME_OVER], [CHOIX]...[/CHOIX]
 * Partial signal suppressed: trailing `[...` that hasn't closed yet.
 */
function stripStreamingSignals(text: string): string {
  return (
    text
      // Remove complete signals
      .replace(/\[HP_CHANGE:[+-]?\d+\]/g, "")
      .replace(/\[MILESTONE_COMPLETE:[^\]]+\]/g, "")
      .replace(/\[ADVENTURE_COMPLETE\]/g, "")
      .replace(/\[GAME_OVER\]/g, "")
      .replace(/\[CHOIX\][\s\S]*?\[\/CHOIX\]/g, "")
      // Hide trailing partial signal (e.g. "[HP_CH" at end of buffer)
      .replace(/\[[A-Z_][^\]]*$/, "")
      // Collapse triple+ newlines left by removed signals
      .replace(/\n{3,}/g, "\n\n")
  );
}

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
  choices: SuggestedAction[];
  /** true: action submitted, waiting for game:response-start */
  isLoading: boolean;
  /** true: receiving game:chunk events */
  isStreaming: boolean;
  /** Error message from game:error event */
  gameError: string | null;
  /** true while mounted on the game session route (used by Story 6.7 beforeunload guard) */
  isInGameSession: boolean;
  /** Character current HP — updated via game:state-update hp_change (Story 6.5) */
  currentHp: number;
  /** Character max HP — updated via game:state-update hp_change (Story 6.5) */
  maxHp: number;
  /** Last save timestamp, initialised from adventure.lastPlayedAt (Story 6.5) */
  lastSavedAt: Date | null;
  /** true for 2s after each auto-save or manual save (Story 6.5) */
  showAutosaveIndicator: boolean;
  /** true when the pause overlay is open (Story 6.5) */
  isPauseMenuOpen: boolean;
  /** true when the adventure has ended (adventure_complete or game_over) — Story 7.x will redirect */
  isAdventureComplete: boolean;
  /** true when the adventure ended with game_over (Story 6.5 stub, Story 7.x will use) */
  isGameOver: boolean;
  /** true while the milestone celebration overlay is visible (Story 6.6) */
  showMilestoneOverlay: boolean;
  /** Name of the milestone being celebrated, or null (Story 6.6) */
  milestoneOverlayName: string | null;
  /** true while the history drawer is open (Story 6.6) */
  isHistoryDrawerOpen: boolean;
  /** true on first load when adventure has no messages yet — shows IntroSession (Story 6.6) */
  isFirstLaunch: boolean;
  /** Submit a player action (free text or choice label) */
  sendAction: (action: string, choiceId?: string) => Promise<void>;
  /** Open the pause overlay (Story 6.5) */
  openPauseMenu: () => void;
  /** Close the pause overlay (Story 6.5) */
  closePauseMenu: () => void;
  /** Manually save the adventure via POST /adventures/:id/save (Story 6.5) */
  manualSave: () => Promise<void>;
  /** Open the history drawer (Story 6.6) */
  openHistoryDrawer: () => void;
  /** Close the history drawer (Story 6.6) */
  closeHistoryDrawer: () => void;
}

export function useGameSession(adventureId: string, options?: { isNew?: boolean }): GameSessionState {
  const [currentScene, setCurrentScene] = useState("");
  const [streamingBuffer, setStreamingBuffer] = useState("");
  const [playerEcho, setPlayerEcho] = useState<string | null>(null);
  const [choices, setChoices] = useState<SuggestedAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [isInGameSession, setIsInGameSession] = useState(true);
  // Story 6.5 — HP + autosave + pause menu + adventure completion
  const [currentHp, setCurrentHp] = useState(0);
  const [maxHp, setMaxHp] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showAutosaveIndicator, setShowAutosaveIndicator] = useState(false);
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  const [isAdventureComplete, setIsAdventureComplete] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  // Story 6.6 — Milestone overlay + history drawer + session intro
  const [showMilestoneOverlay, setShowMilestoneOverlay] = useState(false);
  const [milestoneOverlayName, setMilestoneOverlayName] = useState<string | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  // Initialized from options.isNew so the overlay is visible before gameState loads
  const [isFirstLaunch, setIsFirstLaunch] = useState(options?.isNew ?? false);
  // Timer ref for autosave indicator auto-clear (prevents stale setState after unmount)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timer ref for milestone overlay auto-dismiss
  const milestoneOverlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timer ref for intro delayed hide (enforces 2s minimum display)
  const introHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Minimum timestamp until which the intro must stay visible (ensures readability)
  const introMinDisplayUntilRef = useRef<number>(options?.isNew ? Date.now() + 2000 : 0);
  // Prevents double-triggering the intro request across re-renders (renamed from introRequestedRef)
  const hasAutoStarted = useRef(false);

  // TanStack AI streaming layer — handles HTTP action POST + chunk streaming
  const { sendMessage } = useGameChat(adventureId);

  // ---------------------------------------------------------------------------
  // Initial state load — GET /adventures/:id/state
  // ---------------------------------------------------------------------------

  const { data: gameStateResponse } = useQuery<ApiResponse<GameStateDTO>>({
    queryKey: ["adventure", adventureId, "state"],
    queryFn: () => api.get<ApiResponse<GameStateDTO>>(`/api/v1/adventures/${adventureId}/state`),
    staleTime: 0,               // Always refetch on mount — ensures fresh state after navigation
    refetchOnWindowFocus: false, // Real-time updates come via Socket.io, not polling
  });

  const gameState = gameStateResponse?.data ?? null;

  // Seed currentScene and choices from the last assistant message on initial load
  useEffect(() => {
    if (!gameState) return;
    const lastAssistant = [...(gameState.messages ?? [])].reverse().find((m) => m.role === "assistant");
    if (lastAssistant) {
      setCurrentScene(lastAssistant.content);
      setChoices(lastAssistant.choices ?? []);
    }
  }, [gameState]);

  // Story 6.5 — Initialise HP and lastSavedAt from initial game state load
  useEffect(() => {
    if (!gameState?.adventure?.character) return;
    const char = gameState.adventure.character;
    setCurrentHp(char.currentHp);
    setMaxHp(char.maxHp);
    if (gameState.adventure.lastPlayedAt) {
      setLastSavedAt(new Date(gameState.adventure.lastPlayedAt));
    }
  }, [gameState]);

  // Story 6.6 — Auto-trigger first GM narration on new adventures (no messages yet).
  // isFirstLaunch is already set from options.isNew — no need to re-derive it here.
  useEffect(() => {
    if (!gameState) return;
    if (hasAutoStarted.current) return;

    const isNew = (gameState.messages ?? []).length === 0;
    if (isNew) {
      hasAutoStarted.current = true;
      // Trigger first GM narration through the standard action flow.
      // isLoading and isStreaming are both false at this point (initial load).
      void sendAction("Commencer l'aventure");
    }
  }, [gameState]);

  // ---------------------------------------------------------------------------
  // Story 6.5 — Autosave indicator helper (clears after 2s, debounced)
  // ---------------------------------------------------------------------------

  function triggerAutosaveIndicator() {
    setShowAutosaveIndicator(true);
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => setShowAutosaveIndicator(false), 2000);
  }

  // ---------------------------------------------------------------------------
  // Socket connection lifecycle + game event handlers
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const sock = connect(adventureId);

    const onResponseStart = (data?: { adventureId?: string }) => {
      if (data?.adventureId && data.adventureId !== adventureId) return;
      setIsLoading(false);
      setIsStreaming(true);
      setStreamingBuffer("");
    };

    // game:chunk payload: { adventureId, chunk }
    const onChunk = (data: { adventureId: string; chunk: string }) => {
      if (data.adventureId !== adventureId) return;
      setStreamingBuffer((prev) => stripStreamingSignals(prev + data.chunk));
    };

    // game:response-complete payload: { adventureId, messageId, cleanText, choices, stateChanges }
    const onResponseComplete = (data: {
      adventureId?: string;
      cleanText: string;
      choices?: SuggestedAction[];
    }) => {
      if (data.adventureId && data.adventureId !== adventureId) return;
      setCurrentScene(data.cleanText);
      setStreamingBuffer("");
      setChoices(data.choices ?? []);
      setIsStreaming(false);
      setIsLoading(false);
      setPlayerEcho(null);
      setLastSavedAt(new Date());
      // Story 6.5: trigger autosave indicator after each completed GM response
      triggerAutosaveIndicator();
      // Story 6.6: dismiss IntroSession after first narration completes.
      // Enforces a 2s minimum display so the player has time to read the intro text.
      const remaining = introMinDisplayUntilRef.current - Date.now();
      if (remaining > 0) {
        introHideTimerRef.current = setTimeout(() => setIsFirstLaunch(false), remaining);
      } else {
        setIsFirstLaunch(false);
      }
    };

    // game:state-update — Story 6.5: handle hp_change, adventure_complete, game_over
    //                     Story 6.6: handle milestone_complete
    const onStateUpdate = (data: {
      type?: string;
      currentHp?: number;
      maxHp?: number;
      nextMilestone?: string | null;
    }) => {
      if (data.type === "hp_change") {
        if (data.currentHp !== undefined) setCurrentHp(data.currentHp);
        if (data.maxHp !== undefined) setMaxHp(data.maxHp);
      } else if (data.type === "adventure_complete") {
        setIsAdventureComplete(true);
      } else if (data.type === "game_over") {
        setIsAdventureComplete(true);
        setIsGameOver(true);
      } else if (data.type === "milestone_complete") {
        // Only show overlay when there is a next milestone.
        // nextMilestone=null means the last milestone completed → adventure ending.
        if (data.nextMilestone) {
          setMilestoneOverlayName(data.nextMilestone);
          setShowMilestoneOverlay(true);
          if (milestoneOverlayTimerRef.current) clearTimeout(milestoneOverlayTimerRef.current);
          milestoneOverlayTimerRef.current = setTimeout(() => {
            setShowMilestoneOverlay(false);
            setMilestoneOverlayName(null);
          }, 2500);
        }
      }
    };

    const onError = (data: { adventureId?: string; error: string } | string) => {
      if (typeof data !== "string" && data.adventureId && data.adventureId !== adventureId) return;
      const message = typeof data === "string" ? data : (data.error ?? "Une erreur est survenue.");
      setGameError(message);
      setIsLoading(false);
      setIsStreaming(false);
    };

    sock.on("game:response-start", onResponseStart as (...args: unknown[]) => void);
    sock.on("game:chunk", onChunk as (...args: unknown[]) => void);
    sock.on("game:response-complete", onResponseComplete as (...args: unknown[]) => void);
    sock.on("game:state-update", onStateUpdate as (...args: unknown[]) => void);
    sock.on("game:error", onError as (...args: unknown[]) => void);

    return () => {
      sock.off("game:response-start", onResponseStart as (...args: unknown[]) => void);
      sock.off("game:chunk", onChunk as (...args: unknown[]) => void);
      sock.off("game:response-complete", onResponseComplete as (...args: unknown[]) => void);
      sock.off("game:state-update", onStateUpdate as (...args: unknown[]) => void);
      sock.off("game:error", onError as (...args: unknown[]) => void);
      // Clear timers to prevent setState after unmount
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      if (milestoneOverlayTimerRef.current) clearTimeout(milestoneOverlayTimerRef.current);
      if (introHideTimerRef.current) clearTimeout(introHideTimerRef.current);
      disconnect();
      setIsInGameSession(false);
    };
  }, [adventureId]);

  // ---------------------------------------------------------------------------
  // sendAction
  // ---------------------------------------------------------------------------

  async function sendAction(action: string, choiceId?: string): Promise<void> {
    // Guard against double-submit
    if (isLoading || isStreaming) return;

    setPlayerEcho(action);
    setChoices([]);
    setIsLoading(true);
    setGameError(null);

    try {
      // Triggers the ConnectionAdapter in useGameChat, which:
      //  1. POSTs action to /api/adventures/:id/action
      //  2. Yields socket chunks until game:response-complete
      // Game state updates happen via the socket listeners above.
      await sendMessage(action, choiceId);
      // isLoading/isStreaming are already reset by socket event handlers
    } catch {
      setIsLoading(false);
      setIsStreaming(false);
      setPlayerEcho(null);
      setGameError("Impossible d'envoyer votre action. Veuillez réessayer.");
    }
  }

  // Verify socket is reachable (runtime guard for sendAction)
  // This is separate from the effect lifecycle to avoid stale closure issues
  const sendActionWrapped = async (action: string, choiceId?: string): Promise<void> => {
    const sock = getSocket();
    if (!sock?.connected) {
      setGameError("La connexion au serveur de jeu est perdue.");
      return;
    }
    await sendAction(action, choiceId);
  };

  // ---------------------------------------------------------------------------
  // Story 6.5 — Pause menu actions
  // ---------------------------------------------------------------------------

  function openPauseMenu() {
    setIsPauseMenuOpen(true);
  }

  function closePauseMenu() {
    setIsPauseMenuOpen(false);
  }

  // ---------------------------------------------------------------------------
  // Story 6.6 — History drawer actions
  // ---------------------------------------------------------------------------

  function openHistoryDrawer() {
    setIsHistoryDrawerOpen(true);
  }

  function closeHistoryDrawer() {
    setIsHistoryDrawerOpen(false);
  }

  // ---------------------------------------------------------------------------
  // Story 6.5 — Manual save via POST /adventures/:id/save
  // ---------------------------------------------------------------------------

  async function manualSave(): Promise<void> {
    try {
      const result = await api.post<ApiResponse<{ savedAt: string }>>(
        `/api/v1/adventures/${adventureId}/save`,
        {},
      );
      if (result.data?.savedAt) {
        setLastSavedAt(new Date(result.data.savedAt));
      }
      triggerAutosaveIndicator();
    } catch {
      // Silent fail — auto-save already persists data; manual save is non-critical
    }
  }

  return {
    gameState,
    currentScene,
    streamingBuffer,
    playerEcho,
    choices,
    isLoading,
    isStreaming,
    gameError,
    isInGameSession,
    currentHp,
    maxHp,
    lastSavedAt,
    showAutosaveIndicator,
    isPauseMenuOpen,
    isAdventureComplete,
    isGameOver,
    showMilestoneOverlay,
    milestoneOverlayName,
    isHistoryDrawerOpen,
    isFirstLaunch,
    sendAction: sendActionWrapped,
    openPauseMenu,
    closePauseMenu,
    manualSave,
    openHistoryDrawer,
    closeHistoryDrawer,
  };
}
