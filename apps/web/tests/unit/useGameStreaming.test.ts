/**
 * useGameStreaming — Story 7.4 (migrated from hooks/__tests__/useGameSession.test.ts
 * and parts of tests/unit/useGameSession.test.ts)
 *
 * Covers:
 *  - Socket connect/disconnect lifecycle
 *  - Initial seeding from gameState (currentScene, choices)
 *  - sendAction: isLoading, playerEcho, sendMessage call, socket guard
 *  - game:response-start / chunk / response-complete events
 *  - game:state-update: hp_change (callback), adventure_complete, game_over, milestone_complete
 *  - game:error: hasLLMError, gameError, callbacks
 *  - game:state-snapshot: currentScene, HP callback, onResponseComplete callback
 *  - Auto-start (no messages): calls sendAction once
 *  - retryLastAction
 *  - stripStreamingSignals unit tests
 */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockGetSocket = vi.fn();

vi.mock("@/services/socket.service", () => ({
  connect: (...args: unknown[]) => mockConnect(...args),
  disconnect: (...args: unknown[]) => mockDisconnect(...args),
  getSocket: (...args: unknown[]) => mockGetSocket(...args),
  manualReconnect: vi.fn(),
}));

const mockSendMessage = vi.fn();

vi.mock("@/hooks/useGameChat", () => ({
  useGameChat: () => ({
    messages: [],
    sendMessage: mockSendMessage,
    isStreaming: false,
    stop: vi.fn(),
    error: null,
  }),
}));

vi.mock("@/lib/error-messages", () => ({
  isErrorCode: (code: string) => code === "LLM_ERROR",
  getErrorMessage: (code: string) => {
    if (code === "LLM_ERROR") return "Le MJ rencontre des difficultés…";
    return code;
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import type { GameStateDTO, SuggestedAction } from "@jdrai/shared";

import { stripStreamingSignals, useGameStreaming } from "@/hooks/useGameStreaming";

// ---------------------------------------------------------------------------
// Mock socket factory
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
      handlers.set(event, current.filter((h) => h !== handler));
    },
    emit: vi.fn(),
    trigger: (event: string, ...args: unknown[]) => {
      (handlers.get(event) ?? []).forEach((h) => h(...args));
    },
  };
}

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const baseGameState: GameStateDTO = {
  adventure: {
    id: "adv-1",
    title: "La Forêt Maudite",
    status: "active",
    isGameOver: false,
    isTutorial: false,
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
};

const noopCallbacks = {
  onHpChange: vi.fn(),
  onAdventureComplete: vi.fn(),
  onMilestoneComplete: vi.fn(),
  onResponseComplete: vi.fn(),
  onGameError: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests — socket lifecycle
// ---------------------------------------------------------------------------

describe("useGameStreaming — socket lifecycle", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("connects socket on mount and disconnects on unmount", () => {
    const { unmount } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );
    expect(mockConnect).toHaveBeenCalledWith("adv-1");
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("seeds currentScene from last assistant message in gameState", () => {
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );
    expect(result.current.currentScene).toBe("Vous vous réveillez dans une forêt sombre.");
  });

  it("seeds choices from last assistant message on reload", () => {
    const restoredChoices: SuggestedAction[] = [
      { id: "c1", label: "Explorer la grotte", type: "suggested" },
      { id: "c2", label: "Rebrousser chemin", type: "suggested" },
    ];
    const gameStateWithChoices: GameStateDTO = {
      ...baseGameState,
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
    };
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", gameStateWithChoices, noopCallbacks),
    );
    expect(result.current.choices).toHaveLength(2);
    expect(result.current.choices[0]!.label).toBe("Explorer la grotte");
  });

  it("sendAction calls sendMessage", async () => {
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );

    await act(async () => {
      await result.current.sendAction("J'avance prudemment");
    });

    expect(mockSendMessage).toHaveBeenCalledWith("J'avance prudemment", undefined);
  });

  it("forwards choiceId when submitting a suggested action", async () => {
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );

    await act(async () => {
      await result.current.sendAction("Attaquer", "choice-1");
    });

    expect(mockSendMessage).toHaveBeenCalledWith("Attaquer", "choice-1");
  });

  it("sendAction sets playerEcho immediately", async () => {
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );

    await act(async () => {
      void result.current.sendAction("Je cours");
    });

    expect(mockSendMessage).toHaveBeenCalled();
  });

  it("sendAction does nothing when socket is not connected", async () => {
    mockGetSocket.mockReturnValue({ connected: false });
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );

    await act(async () => {
      await result.current.sendAction("Action");
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(result.current.gameError).toBeTruthy();
    expect(noopCallbacks.onGameError).toHaveBeenCalledOnce();
  });

  it("does not call sendMessage when already loading", async () => {
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );

    act(() => {
      void result.current.sendAction("Première action");
    });

    await act(async () => {
      await result.current.sendAction("Deuxième action");
    });

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it("game:chunk event appends to streamingBuffer", () => {
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );

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
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );

    act(() => {
      mockSocket.trigger("game:response-start", { adventureId: "adv-1" });
      mockSocket.trigger("game:chunk", { adventureId: "adv-2", chunk: "Intrus" });
    });

    expect(result.current.streamingBuffer).toBe("");
  });

  it("game:response-complete replaces streamingBuffer with cleanText and sets choices", () => {
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );

    act(() => { mockSocket.trigger("game:response-start"); });
    act(() => {
      mockSocket.trigger("game:chunk", { adventureId: "adv-1", chunk: "Texte brut." });
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

  it("game:response-complete calls onResponseComplete callback", () => {
    const mockCallbacks = { ...noopCallbacks, onResponseComplete: vi.fn() };
    renderHook(() => useGameStreaming("adv-1", baseGameState, mockCallbacks));

    act(() => {
      mockSocket.trigger("game:response-complete", {
        adventureId: "adv-1",
        cleanText: "Texte.",
        choices: [],
      });
    });

    expect(mockCallbacks.onResponseComplete).toHaveBeenCalledOnce();
    expect(mockCallbacks.onResponseComplete.mock.calls[0]![0]).toBeInstanceOf(Date);
  });

  it("ignores response-complete from another adventureId", () => {
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );

    act(() => {
      mockSocket.trigger("game:response-start", { adventureId: "adv-1" });
      mockSocket.trigger("game:chunk", { adventureId: "adv-1", chunk: "Texte local" });
      mockSocket.trigger("game:response-complete", {
        adventureId: "adv-2",
        cleanText: "Ne doit pas remplacer",
        choices: [{ id: "x", label: "X", type: "suggested" }],
      });
    });

    expect(result.current.streamingBuffer).toBe("Texte local");
  });

  it("game:error sets gameError, hasLLMError, resets loading flags, calls onGameError", () => {
    const mockCallbacks = { ...noopCallbacks, onGameError: vi.fn() };
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, mockCallbacks),
    );

    act(() => {
      mockSocket.trigger("game:error", { error: "Connexion perdue." });
    });

    expect(result.current.gameError).toBe("Connexion perdue.");
    expect(result.current.hasLLMError).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(mockCallbacks.onGameError).toHaveBeenCalledOnce();
  });

  it("game:error with LLM_ERROR code maps to friendly message", () => {
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );

    act(() => {
      mockSocket.trigger("game:error", { adventureId: "adv-1", error: "LLM_ERROR" });
    });

    expect(result.current.hasLLMError).toBe(true);
    expect(result.current.gameError).toBe("Le MJ rencontre des difficultés…");
  });
});

// ---------------------------------------------------------------------------
// Tests — game:state-update
// ---------------------------------------------------------------------------

describe("useGameStreaming — game:state-update", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
  });

  it("hp_change fires onHpChange callback with new values", () => {
    const mockCallbacks = { ...noopCallbacks, onHpChange: vi.fn() };
    renderHook(() => useGameStreaming("adv-1", baseGameState, mockCallbacks));

    act(() => {
      mockSocket.trigger("game:state-update", { type: "hp_change", currentHp: 12, maxHp: 20 });
    });

    expect(mockCallbacks.onHpChange).toHaveBeenCalledWith(12, 20);
  });

  it("adventure_complete fires onAdventureComplete(false) and clears choices", () => {
    const gameStateWithChoices: GameStateDTO = {
      ...baseGameState,
      messages: [{
        id: "m1",
        role: "assistant",
        content: "Victoire!",
        milestoneId: null,
        createdAt: new Date().toISOString(),
        choices: [{ id: "c1", label: "Continuer", type: "suggested" }],
      }],
    };
    const mockCallbacks = { ...noopCallbacks, onAdventureComplete: vi.fn() };
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", gameStateWithChoices, mockCallbacks),
    );

    act(() => {
      mockSocket.trigger("game:state-update", { type: "adventure_complete" });
    });

    expect(mockCallbacks.onAdventureComplete).toHaveBeenCalledWith(false);
    expect(result.current.choices).toHaveLength(0);
  });

  it("game_over fires onAdventureComplete(true) and clears choices", () => {
    const mockCallbacks = { ...noopCallbacks, onAdventureComplete: vi.fn() };
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, mockCallbacks),
    );

    act(() => {
      mockSocket.trigger("game:state-update", { type: "game_over" });
    });

    expect(mockCallbacks.onAdventureComplete).toHaveBeenCalledWith(true);
    expect(result.current.choices).toHaveLength(0);
  });

  it("milestone_complete with nextMilestone fires onMilestoneComplete(name)", () => {
    const mockCallbacks = { ...noopCallbacks, onMilestoneComplete: vi.fn() };
    renderHook(() => useGameStreaming("adv-1", baseGameState, mockCallbacks));

    act(() => {
      mockSocket.trigger("game:state-update", {
        type: "milestone_complete",
        nextMilestone: "La Forêt Sombre",
      });
    });

    expect(mockCallbacks.onMilestoneComplete).toHaveBeenCalledWith("La Forêt Sombre");
  });

  it("milestone_complete with nextMilestone=null fires onMilestoneComplete(null)", () => {
    const mockCallbacks = { ...noopCallbacks, onMilestoneComplete: vi.fn() };
    renderHook(() => useGameStreaming("adv-1", baseGameState, mockCallbacks));

    act(() => {
      mockSocket.trigger("game:state-update", {
        type: "milestone_complete",
        nextMilestone: null,
      });
    });

    expect(mockCallbacks.onMilestoneComplete).toHaveBeenCalledWith(null);
  });
});

// ---------------------------------------------------------------------------
// Tests — game:state-snapshot
// ---------------------------------------------------------------------------

describe("useGameStreaming — game:state-snapshot", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
  });

  it("game:state-snapshot updates currentScene and calls HP + save callbacks", () => {
    const mockCallbacks = {
      ...noopCallbacks,
      onHpChange: vi.fn(),
      onResponseComplete: vi.fn(),
    };
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, mockCallbacks),
    );

    const snapshot: Partial<GameStateDTO> = {
      adventure: {
        ...baseGameState.adventure,
        character: { ...baseGameState.adventure.character, currentHp: 8, maxHp: 20 },
        lastPlayedAt: "2026-03-26T10:00:00.000Z",
      },
      messages: [
        { id: "u1", role: "user", content: "J'attaque!", milestoneId: null, createdAt: new Date().toISOString() },
        { id: "a1", role: "assistant", content: "Le dragon rugit...", milestoneId: null, createdAt: new Date().toISOString(), choices: [] },
      ],
    };

    act(() => {
      mockSocket.trigger("game:state-snapshot", snapshot);
    });

    expect(result.current.currentScene).toBe("Le dragon rugit...");
    expect(mockCallbacks.onHpChange).toHaveBeenCalledWith(8, 20);
    expect(mockCallbacks.onResponseComplete).toHaveBeenCalledOnce();
    expect(result.current.hasLLMError).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStreaming).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests — auto-start
// ---------------------------------------------------------------------------

describe("useGameStreaming — auto-start", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
  });

  it("calls sendMessage when adventure has no messages", async () => {
    const emptyGameState: GameStateDTO = { ...baseGameState, messages: [] };

    renderHook(() => useGameStreaming("adv-1", emptyGameState, noopCallbacks));

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it("does not auto-start when isResume=true", () => {
    const emptyGameState: GameStateDTO = { ...baseGameState, messages: [] };

    renderHook(() =>
      useGameStreaming("adv-1", emptyGameState, noopCallbacks, { isResume: true }),
    );

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("does not call sendMessage twice on re-render (hasAutoStarted guard)", async () => {
    const emptyGameState: GameStateDTO = { ...baseGameState, messages: [] };

    const { rerender } = renderHook(() =>
      useGameStreaming("adv-1", emptyGameState, noopCallbacks),
    );
    rerender();

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it("does not auto-start when messages already exist", () => {
    renderHook(() => useGameStreaming("adv-1", baseGameState, noopCallbacks));
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests — retryLastAction
// ---------------------------------------------------------------------------

describe("useGameStreaming — retryLastAction", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
  });

  it("retryLastAction is a no-op when no previous action was sent", () => {
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );

    act(() => {
      result.current.retryLastAction();
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("retryLastAction resets hasLLMError and re-sends last action", async () => {
    const { result } = renderHook(() =>
      useGameStreaming("adv-1", baseGameState, noopCallbacks),
    );

    // Send an action first (stores in lastActionRef)
    await act(async () => {
      await result.current.sendAction("Attaquer le gobelin");
    });

    // Simulate LLM error
    act(() => {
      mockSocket.trigger("game:error", { adventureId: "adv-1", error: "LLM_ERROR" });
    });
    expect(result.current.hasLLMError).toBe(true);

    mockSendMessage.mockClear();

    // Retry
    act(() => {
      result.current.retryLastAction();
    });

    expect(result.current.hasLLMError).toBe(false);
    expect(mockSendMessage).toHaveBeenCalledWith("Attaquer le gobelin", undefined);
  });
});

// ---------------------------------------------------------------------------
// Tests — stripStreamingSignals (unit)
// ---------------------------------------------------------------------------

describe("stripStreamingSignals", () => {
  it("removes complete HP_CHANGE signals", () => {
    expect(stripStreamingSignals("Vous perdez [HP_CHANGE:-5] des points.")).toBe(
      "Vous perdez  des points.",
    );
  });

  it("removes complete MILESTONE_COMPLETE signals", () => {
    expect(stripStreamingSignals("Bravo! [MILESTONE_COMPLETE:Prologue] Continuez.")).toBe(
      "Bravo!  Continuez.",
    );
  });

  it("removes ADVENTURE_COMPLETE and GAME_OVER signals", () => {
    expect(stripStreamingSignals("Fin. [ADVENTURE_COMPLETE]")).toBe("Fin. ");
    expect(stripStreamingSignals("Mort. [GAME_OVER]")).toBe("Mort. ");
  });

  it("hides trailing partial signal", () => {
    expect(stripStreamingSignals("Le dragon rugit [HP_CH")).toBe("Le dragon rugit ");
  });

  it("passes through clean text unchanged", () => {
    const text = "Le vent souffle dans la forêt sombre.";
    expect(stripStreamingSignals(text)).toBe(text);
  });
});
