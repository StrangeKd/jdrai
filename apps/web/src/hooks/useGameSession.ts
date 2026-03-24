/**
 * useGameSession — single composable hook for the game session screen (Story 6.4 Task 2).
 *
 * Responsibilities:
 *  - Establish and teardown the Socket.io connection (via connect/disconnect)
 *  - Load initial game state via GET /adventures/:id/state
 *  - Handle all socket events: response-start, chunk, response-complete, state-update, error
 *  - Manage game display state: currentScene, streamingBuffer, playerEcho, choices
 *  - Expose sendAction() which submits the player action via useGameChat
 *
 * Consumed by the /$id game session route (Story 6.4 Task 3).
 */
import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { ApiResponse, GameStateDTO, SuggestedAction } from "@jdrai/shared";

import { api } from "@/services/api";
import { connect, disconnect, getSocket } from "@/services/socket.service";

import { useGameChat } from "./useGameChat";

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
  /** Submit a player action (free text or choice label) */
  sendAction: (action: string, choiceId?: string) => Promise<void>;
}

export function useGameSession(adventureId: string): GameSessionState {
  const [currentScene, setCurrentScene] = useState("");
  const [streamingBuffer, setStreamingBuffer] = useState("");
  const [playerEcho, setPlayerEcho] = useState<string | null>(null);
  const [choices, setChoices] = useState<SuggestedAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [isInGameSession, setIsInGameSession] = useState(true);

  // TanStack AI streaming layer — handles HTTP action POST + chunk streaming
  const { sendMessage } = useGameChat(adventureId);

  // ---------------------------------------------------------------------------
  // Initial state load — GET /adventures/:id/state
  // ---------------------------------------------------------------------------

  const { data: gameStateResponse } = useQuery<ApiResponse<GameStateDTO>>({
    queryKey: ["adventure", adventureId, "state"],
    queryFn: () => api.get<ApiResponse<GameStateDTO>>(`/api/adventures/${adventureId}/state`),
    staleTime: Infinity, // Real-time state comes via Socket.io; REST is initial load only
  });

  const gameState = gameStateResponse?.data ?? null;

  // Seed currentScene from the last assistant message on initial load
  useEffect(() => {
    if (!gameState) return;
    const lastAssistant = [...(gameState.messages ?? [])].reverse().find((m) => m.role === "assistant");
    if (lastAssistant) {
      setCurrentScene(lastAssistant.content);
    }
  }, [gameState]);

  // ---------------------------------------------------------------------------
  // Socket connection lifecycle + game event handlers
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const sock = connect(adventureId);

    const onResponseStart = () => {
      setIsLoading(false);
      setIsStreaming(true);
      setStreamingBuffer("");
    };

    // game:chunk payload: { adventureId, chunk }
    const onChunk = (data: { adventureId: string; chunk: string }) => {
      setStreamingBuffer((prev) => prev + data.chunk);
    };

    // game:response-complete payload: { adventureId, messageId, cleanText, choices, stateChanges }
    const onResponseComplete = (data: {
      cleanText: string;
      choices?: SuggestedAction[];
    }) => {
      setCurrentScene(data.cleanText);
      setStreamingBuffer("");
      setChoices(data.choices ?? []);
      setIsStreaming(false);
      setIsLoading(false);
      setPlayerEcho(null);
    };

    // game:state-update — log only; CharacterPanel (Story 6.5) will consume this
    const onStateUpdate = (data: unknown) => {
      console.debug("[useGameSession] game:state-update", data);
    };

    const onError = (data: { error: string } | string) => {
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
      disconnect();
      setIsInGameSession(false);
    };
  }, [adventureId]);

  // ---------------------------------------------------------------------------
  // sendAction
  // ---------------------------------------------------------------------------

  async function sendAction(action: string, _choiceId?: string): Promise<void> {
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
      await sendMessage(action);
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
    sendAction: sendActionWrapped,
  };
}
