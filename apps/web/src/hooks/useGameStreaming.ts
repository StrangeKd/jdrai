/**
 * useGameStreaming — Socket.io lifecycle + LLM streaming for the game session.
 *
 * Responsibilities:
 *  - Establish and teardown the Socket.io connection (connect/disconnect)
 *  - Handle all socket events: response-start, chunk, response-complete,
 *    state-update, error, state-snapshot
 *  - Manage streaming display state: currentScene, streamingBuffer, playerEcho, choices
 *  - Manage loading flags: isLoading, isStreaming, gameError
 *  - Manage LLM error state: hasLLMError + retryLastAction
 *  - Expose consolidated sendAction() (includes socket connection guard)
 *  - Auto-trigger first GM narration on new adventures (no messages yet)
 *
 * Cross-domain side-effects are delegated to the coordinator via callbacks.
 * Used as a sub-hook by useGameSession (Story 7.4).
 */
import { useEffect, useRef, useState } from "react";

import type { GameStateDTO, SuggestedAction } from "@jdrai/shared";

import { getErrorMessage, isErrorCode } from "@/lib/error-messages";
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
export function stripStreamingSignals(text: string): string {
  return text
    .replace(/\[HP_CHANGE:[+-]?\d+\]/g, "")
    .replace(/\[MILESTONE_COMPLETE:[^\]]+\]/g, "")
    .replace(/\[ADVENTURE_COMPLETE\]/g, "")
    .replace(/\[GAME_OVER\]/g, "")
    .replace(/\[CHOIX\][\s\S]*?\[\/CHOIX\]/g, "")
    .replace(/\[[A-Z_][^\]]*$/, "")
    .replace(/\n{3,}/g, "\n\n");
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GameStreamingCallbacks {
  onHpChange: (currentHp: number, maxHp: number) => void;
  onAdventureComplete: (isGameOver: boolean) => void;
  onMilestoneComplete: (nextMilestone: string | null) => void;
  onResponseComplete: (savedAt: Date) => void;
  /** Called on game:error and sendAction network error — used to dismiss intro */
  onGameError: () => void;
}

export interface GameStreamingState {
  currentScene: string;
  streamingBuffer: string;
  playerEcho: string | null;
  choices: SuggestedAction[];
  /** presetSelector value from the last game:response-complete event (tutorial only). */
  presetSelector: "race" | "class" | undefined;
  isLoading: boolean;
  isStreaming: boolean;
  gameError: string | null;
  hasLLMError: boolean;
  sendAction: (action: string, choiceId?: string, choiceType?: "race" | "class") => Promise<void>;
  retryLastAction: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameStreaming(
  adventureId: string,
  gameState: GameStateDTO | null,
  callbacks: GameStreamingCallbacks,
  options?: { isResume?: boolean },
  /** Incremented by useGameResilience on manual reconnect — forces socket re-init */
  reconnectKey?: number,
): GameStreamingState {
  const [currentScene, setCurrentScene] = useState("");
  const [streamingBuffer, setStreamingBuffer] = useState("");
  const [playerEcho, setPlayerEcho] = useState<string | null>(null);
  const [choices, setChoices] = useState<SuggestedAction[]>([]);
  const [presetSelector, setPresetSelector] = useState<"race" | "class" | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [hasLLMError, setHasLLMError] = useState(false);

  // Stores the last player action for LLM error retry
  const lastActionRef = useRef<{ action: string; choiceId?: string; choiceType?: "race" | "class" } | null>(null);
  // Prevents double-triggering the intro request across re-renders
  const hasAutoStarted = useRef(false);

  // Stable refs for callbacks — prevents stale closures in socket handlers
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const { sendMessage } = useGameChat(adventureId);

  // ---------------------------------------------------------------------------
  // Seed currentScene and choices from initial game state
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!gameState) return;
    const lastAssistant = [...(gameState.messages ?? [])]
      .reverse()
      .find((m) => m.role === "assistant");
    if (lastAssistant) {
      setCurrentScene(lastAssistant.content);
      setChoices(lastAssistant.choices ?? []);
    }
  }, [gameState]);

  // ---------------------------------------------------------------------------
  // sendAction (consolidated — includes socket connection guard)
  // ---------------------------------------------------------------------------

  async function sendAction(action: string, choiceId?: string, choiceType?: "race" | "class"): Promise<void> {
    const sock = getSocket();
    if (!sock?.connected) {
      setGameError("La connexion au serveur de jeu est perdue.");
      callbacksRef.current.onGameError();
      return;
    }
    if (isLoading || isStreaming) return;

    // Store last action for retry; reset LLM error state on new action
    lastActionRef.current = { action, ...(choiceId !== undefined ? { choiceId } : {}), ...(choiceType ? { choiceType } : {}) };
    setHasLLMError(false);
    setPresetSelector(undefined);

    setPlayerEcho(action);
    setChoices([]);
    setIsLoading(true);
    setGameError(null);

    try {
      if (choiceType) {
        await sendMessage(action, choiceId, choiceType);
      } else {
        await sendMessage(action, choiceId);
      }
      // isLoading/isStreaming are reset by socket event handlers
    } catch {
      setIsLoading(false);
      setIsStreaming(false);
      setPlayerEcho(null);
      setGameError("Impossible d'envoyer votre action. Veuillez réessayer.");
      callbacksRef.current.onGameError();
    }
  }

  // ---------------------------------------------------------------------------
  // retryLastAction
  // ---------------------------------------------------------------------------

  function retryLastAction(): void {
    if (!lastActionRef.current) return;
    setHasLLMError(false);
    const { action, choiceId, choiceType } = lastActionRef.current;
    if (choiceType) {
      void sendAction(action, choiceId, choiceType);
    } else {
      void sendAction(action, choiceId);
    }
  }

  // ---------------------------------------------------------------------------
  // Auto-trigger first GM narration on new adventures (no messages yet)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!gameState) return;
    if (hasAutoStarted.current) return;
    const shouldAutoStart = !options?.isResume && (gameState.messages ?? []).length === 0;
    if (shouldAutoStart) {
      hasAutoStarted.current = true;
      void sendAction("Commencer l'aventure");
    }
  }, [gameState, options?.isResume]);

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

    const onChunk = (data: { adventureId: string; chunk: string }) => {
      if (data.adventureId !== adventureId) return;
      setStreamingBuffer((prev) => stripStreamingSignals(prev + data.chunk));
    };

    const onResponseComplete = (data: {
      adventureId?: string;
      cleanText: string;
      choices?: SuggestedAction[];
      presetSelector?: "race" | "class";
    }) => {
      if (data.adventureId && data.adventureId !== adventureId) return;
      setCurrentScene(data.cleanText);
      setStreamingBuffer("");
      setChoices(data.choices ?? []);
      setPresetSelector(data.presetSelector);
      setIsStreaming(false);
      setIsLoading(false);
      setPlayerEcho(null);
      callbacksRef.current.onResponseComplete(new Date());
    };

    const onStateUpdate = (data: {
      type?: string;
      currentHp?: number;
      maxHp?: number;
      nextMilestone?: string | null;
    }) => {
      if (data.type === "hp_change") {
        if (data.currentHp !== undefined && data.maxHp !== undefined) {
          callbacksRef.current.onHpChange(data.currentHp, data.maxHp);
        }
        // If maxHp is absent, skip: displaying 0/0 is worse than showing stale HP
      } else if (data.type === "adventure_complete") {
        setChoices([]);
        callbacksRef.current.onAdventureComplete(false);
      } else if (data.type === "game_over") {
        setChoices([]);
        callbacksRef.current.onAdventureComplete(true);
      } else if (data.type === "milestone_complete") {
        callbacksRef.current.onMilestoneComplete(data.nextMilestone ?? null);
      }
    };

    const onError = (data: { adventureId?: string; error: string } | string) => {
      if (typeof data !== "string" && data.adventureId && data.adventureId !== adventureId) return;
      const rawError = typeof data === "string" ? data : (data.error ?? "INTERNAL_ERROR");
      const message = isErrorCode(rawError) ? getErrorMessage(rawError) : rawError;
      setGameError(message);
      setHasLLMError(true);
      setIsLoading(false);
      setIsStreaming(false);
      callbacksRef.current.onGameError();
    };

    const onStateSnapshot = (snapshot: GameStateDTO) => {
      const lastMsg = [...(snapshot.messages ?? [])].reverse().find((m) => m.role === "assistant");
      if (lastMsg) {
        setCurrentScene(lastMsg.content);
        setChoices(lastMsg.choices ?? []);
      }
      if (snapshot.adventure?.character) {
        const char = snapshot.adventure.character;
        callbacksRef.current.onHpChange(char.currentHp, char.maxHp);
      }
      if (snapshot.adventure?.lastPlayedAt) {
        callbacksRef.current.onResponseComplete(new Date(snapshot.adventure.lastPlayedAt));
      }
      setHasLLMError(false);
      setIsLoading(false);
      setIsStreaming(false);
    };

    sock.on("game:response-start", onResponseStart as (...args: unknown[]) => void);
    sock.on("game:chunk", onChunk as (...args: unknown[]) => void);
    sock.on("game:response-complete", onResponseComplete as (...args: unknown[]) => void);
    sock.on("game:state-update", onStateUpdate as (...args: unknown[]) => void);
    sock.on("game:error", onError as (...args: unknown[]) => void);
    sock.on("game:state-snapshot", onStateSnapshot as (...args: unknown[]) => void);

    return () => {
      sock.off("game:response-start", onResponseStart as (...args: unknown[]) => void);
      sock.off("game:chunk", onChunk as (...args: unknown[]) => void);
      sock.off("game:response-complete", onResponseComplete as (...args: unknown[]) => void);
      sock.off("game:state-update", onStateUpdate as (...args: unknown[]) => void);
      sock.off("game:error", onError as (...args: unknown[]) => void);
      sock.off("game:state-snapshot", onStateSnapshot as (...args: unknown[]) => void);
      disconnect();
    };
    // reconnectKey triggers a full socket re-init on manual reconnect after reconnect_failed
  }, [adventureId, reconnectKey]);

  return {
    currentScene,
    streamingBuffer,
    playerEcho,
    choices,
    presetSelector,
    isLoading,
    isStreaming,
    gameError,
    hasLLMError,
    sendAction,
    retryLastAction,
  };
}
