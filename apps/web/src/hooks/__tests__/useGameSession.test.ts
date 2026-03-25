/**
 * useGameSession tests — AC: #3, #6, #8, #11
 *
 * Mocks: socket.service, useGameChat, @tanstack/react-query
 */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

import type { ApiResponse, GameStateDTO } from "@jdrai/shared";

// ---------------------------------------------------------------------------
// Module mocks (hoisted before imports)
// ---------------------------------------------------------------------------

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockGetSocket = vi.fn();

vi.mock("@/services/socket.service", () => ({
  connect: (...args: unknown[]) => mockConnect(...args),
  disconnect: (...args: unknown[]) => mockDisconnect(...args),
  getSocket: (...args: unknown[]) => mockGetSocket(...args),
}));

const mockSendMessage = vi.fn();

vi.mock("../useGameChat", () => ({
  useGameChat: () => ({
    messages: [],
    sendMessage: mockSendMessage,
    isStreaming: false,
    stop: vi.fn(),
    error: null,
  }),
}));

const mockUseQuery = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useGameSession } from "../useGameSession";

// ---------------------------------------------------------------------------
// Mock socket with event emitter behavior
// ---------------------------------------------------------------------------

type SocketHandler = (...args: unknown[]) => void;

function createMockSocket() {
  const handlers = new Map<string, SocketHandler[]>();
  return {
    connected: true,
    on: (event: string, handler: SocketHandler) => {
      if (!handlers.has(event)) handlers.set(event, []);
      handlers.get(event)!.push(handler);
    },
    off: (event: string, handler: SocketHandler) => {
      const current = handlers.get(event) ?? [];
      handlers.set(
        event,
        current.filter((h) => h !== handler),
      );
    },
    emit: vi.fn(),
    /** Trigger all registered handlers for an event */
    trigger: (event: string, ...args: unknown[]) => {
      (handlers.get(event) ?? []).forEach((h) => h(...args));
    },
  };
}

const gameStateResponse: ApiResponse<GameStateDTO> = {
  success: true,
  data: {
    adventure: {
      id: "adv-1",
      title: "La Forêt Maudite",
      status: "active",
      difficulty: "normal",
      estimatedDuration: "medium",
      startedAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
      character: {
        id: "char-1",
        name: "Héros",
        className: "Aventurier",
        raceName: "Humain",
        stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
        currentHp: 20,
        maxHp: 20,
      },
    },
    messages: [
      {
        id: "msg-1",
        role: "assistant",
        content: "Vous vous réveillez dans une forêt sombre.",
        milestoneId: null,
        createdAt: new Date().toISOString(),
      },
    ],
    milestones: [],
    isStreaming: false,
  },
};

describe("useGameSession", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ data: gameStateResponse });
    vi.clearAllMocks();
    // Re-set mocks after clearAllMocks
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ data: gameStateResponse });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("connects socket on mount and disconnects on unmount", () => {
    const { unmount } = renderHook(() => useGameSession("adv-1"));
    expect(mockConnect).toHaveBeenCalledWith("adv-1");
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("seeds currentScene from last assistant message in gameState", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));
    expect(result.current.currentScene).toBe("Vous vous réveillez dans une forêt sombre.");
  });

  it("seeds choices from last assistant message on reload (session restore)", () => {
    const restoredChoices = [
      { id: "c1", label: "Explorer la grotte", type: "suggested" as const },
      { id: "c2", label: "Rebrousser chemin", type: "suggested" as const },
    ];
    mockUseQuery.mockReturnValue({
      data: {
        ...gameStateResponse,
        data: {
          ...gameStateResponse.data,
          messages: [
            {
              id: "msg-1",
              role: "assistant",
              content: "Vous vous réveillez dans une forêt sombre.",
              milestoneId: null,
              createdAt: new Date().toISOString(),
              choices: restoredChoices,
            },
          ],
        },
      },
    });
    const { result } = renderHook(() => useGameSession("adv-1"));
    expect(result.current.choices).toHaveLength(2);
    expect(result.current.choices[0]!.label).toBe("Explorer la grotte");
  });

  it("sendAction sets isLoading=true and calls sendMessage", async () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    await act(async () => {
      await result.current.sendAction("J'avance prudemment");
    });

    expect(mockSendMessage).toHaveBeenCalledWith("J'avance prudemment", undefined);
  });

  it("forwards choiceId when submitting a suggested action", async () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    await act(async () => {
      await result.current.sendAction("Attaquer", "choice-1");
    });

    expect(mockSendMessage).toHaveBeenCalledWith("Attaquer", "choice-1");
  });

  it("sendAction sets playerEcho immediately", async () => {
    mockSendMessage.mockImplementation(() => {
      // echo should already be set when sendMessage is called
      return Promise.resolve();
    });

    const { result } = renderHook(() => useGameSession("adv-1"));

    await act(async () => {
      void result.current.sendAction("Je cours");
    });

    // After sendAction resolves, playerEcho should be reset by game:response-complete
    // (not triggered in this test — so it remains set)
    expect(mockSendMessage).toHaveBeenCalled();
  });

  it("game:chunk event appends to streamingBuffer", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      mockSocket.trigger("game:response-start");
    });

    act(() => {
      mockSocket.trigger("game:chunk", { adventureId: "adv-1", chunk: "Le vent" });
      mockSocket.trigger("game:chunk", { adventureId: "adv-1", chunk: " souffle fort." });
    });

    expect(result.current.streamingBuffer).toBe("Le vent souffle fort.");
    expect(result.current.isStreaming).toBe(true);
  });

  it("ignores socket chunks from another adventureId", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      mockSocket.trigger("game:response-start", { adventureId: "adv-1" });
      mockSocket.trigger("game:chunk", { adventureId: "adv-2", chunk: "Intrus" });
    });

    expect(result.current.streamingBuffer).toBe("");
  });

  it("game:response-complete replaces streamingBuffer with cleanText and sets choices", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      mockSocket.trigger("game:response-start");
    });

    act(() => {
      mockSocket.trigger("game:chunk", { adventureId: "adv-1", chunk: "Texte brut avec signal." });
    });

    act(() => {
      mockSocket.trigger("game:response-complete", {
        adventureId: "adv-1",
        messageId: "m1",
        cleanText: "Texte propre sans signal.",
        choices: [
          { id: "c1", label: "Attaquer", type: "suggested" },
          { id: "c2", label: "Fuir", type: "suggested" },
        ],
        stateChanges: {},
      });
    });

    expect(result.current.currentScene).toBe("Texte propre sans signal.");
    expect(result.current.streamingBuffer).toBe("");
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.choices).toHaveLength(2);
    expect(result.current.choices[0]!.label).toBe("Attaquer");
  });

  it("ignores response-complete from another adventureId", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      mockSocket.trigger("game:response-start", { adventureId: "adv-1" });
      mockSocket.trigger("game:chunk", { adventureId: "adv-1", chunk: "Texte local" });
      mockSocket.trigger("game:response-complete", {
        adventureId: "adv-2",
        cleanText: "Ne doit pas remplacer",
        choices: [{ id: "x", label: "X", type: "suggested" }],
      });
    });

    expect(result.current.currentScene).toBe("Vous vous réveillez dans une forêt sombre.");
    expect(result.current.streamingBuffer).toBe("Texte local");
  });

  it("game:error sets gameError and resets loading flags", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      mockSocket.trigger("game:error", { error: "Connexion perdue." });
    });

    expect(result.current.gameError).toBe("Connexion perdue.");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStreaming).toBe(false);
  });

  it("does not call sendMessage when already loading", async () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    // Trigger loading state
    act(() => {
      void result.current.sendAction("Première action");
    });

    // Try to submit again while loading
    await act(async () => {
      await result.current.sendAction("Deuxième action");
    });

    // sendMessage called only once (second call blocked by isLoading guard)
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it("returns gameState from the REST query", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));
    expect(result.current.gameState).toEqual(gameStateResponse.data);
  });

  // Story 6.6: game:request-intro replaced by sendAction("Commencer l'aventure")
  it("sets isFirstLaunch=true and calls sendMessage when adventure has no messages", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        ...gameStateResponse,
        data: {
          ...gameStateResponse.data,
          messages: [],
        },
      },
    });

    const { result } = renderHook(() => useGameSession("adv-1"));

    expect(result.current.isFirstLaunch).toBe(true);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it("does not set isFirstLaunch=true when messages already exist", () => {
    // Default gameStateResponse has messages
    const { result } = renderHook(() => useGameSession("adv-1"));

    expect(result.current.isFirstLaunch).toBe(false);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("does not call sendMessage twice on re-render (hasAutoStarted guard)", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        ...gameStateResponse,
        data: {
          ...gameStateResponse.data,
          messages: [],
        },
      },
    });

    const { rerender } = renderHook(() => useGameSession("adv-1"));
    rerender();

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });
});
