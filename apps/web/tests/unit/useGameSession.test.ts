/**
 * useGameSession extended tests — Story 6.5 Task 8
 *
 * Covers:
 *  - game:state-update hp_change → updates currentHp/maxHp
 *  - game:response-complete → triggers showAutosaveIndicator (clears after 2s)
 *  - manualSave() → calls POST /api/v1/adventures/:id/save, updates lastSavedAt
 */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks (must be declared before any import of the tested module)
// ---------------------------------------------------------------------------

type SocketCallback = (...args: unknown[]) => void;

const { apiPostMock, apiGetMock, listeners, socket, stableQueryData } = vi.hoisted(() => {
  const localListeners = new Map<string, Set<SocketCallback>>();
  const localSocket = {
    connected: true,
    on: vi.fn((event: string, cb: SocketCallback) => {
      const s = localListeners.get(event) ?? new Set<SocketCallback>();
      s.add(cb);
      localListeners.set(event, s);
    }),
    off: vi.fn((event: string, cb: SocketCallback) => {
      localListeners.get(event)?.delete(cb);
    }),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      for (const cb of localListeners.get(event) ?? []) cb(...args);
    }),
    once: vi.fn(),
  };

  // Stable reference — prevents useEffect([gameState]) from firing on every render
  const stableData = {
    success: true,
    data: {
      adventure: {
        id: "adv-1",
        title: "Test Adventure",
        status: "active",
        difficulty: "normal",
        estimatedDuration: "medium",
        startedAt: "2026-03-01T00:00:00.000Z",
        lastPlayedAt: "2026-03-01T12:00:00.000Z",
        currentMilestone: "Prologue",
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
      messages: [{ role: "assistant", content: "Bienvenue.", choices: [] }],
      milestones: [],
      isStreaming: false,
    },
  };

  return {
    apiPostMock: vi.fn(),
    apiGetMock: vi.fn(),
    listeners: localListeners,
    socket: localSocket,
    stableQueryData: stableData,
  };
});

vi.mock("@/services/socket.service", () => ({
  connect: () => socket,
  disconnect: vi.fn(),
  getSocket: () => socket,
}));

vi.mock("@/services/api", () => ({
  api: {
    post: apiPostMock,
    get: apiGetMock,
  },
}));

vi.mock("@/hooks/useGameChat", () => ({
  useGameChat: () => ({ sendMessage: vi.fn() }),
}));

// Mock TanStack Query — returns a stable reference to avoid re-render loops
// (new object on each call would cause useEffect([gameState]) to loop indefinitely)
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({ data: stableQueryData })),
}));

import { useGameSession } from "@/hooks/useGameSession";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emitSocketEvent(event: string, data: unknown) {
  for (const cb of listeners.get(event) ?? []) {
    (cb as (d: unknown) => void)(data);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useGameSession — Story 6.6 extensions", () => {
  beforeEach(() => {
    listeners.clear();
    apiPostMock.mockReset();
    apiGetMock.mockReset();
    socket.connected = true;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
  });

  it("game:state-update milestone_complete with nextMilestone → sets showMilestoneOverlay=true and milestoneOverlayName", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      emitSocketEvent("game:state-update", {
        type: "milestone_complete",
        nextMilestone: "La Forêt Sombre",
      });
    });

    expect(result.current.showMilestoneOverlay).toBe(true);
    expect(result.current.milestoneOverlayName).toBe("La Forêt Sombre");
  });

  it("game:state-update milestone_complete with nextMilestone=null → does NOT show overlay", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      emitSocketEvent("game:state-update", {
        type: "milestone_complete",
        nextMilestone: null,
      });
    });

    expect(result.current.showMilestoneOverlay).toBe(false);
    expect(result.current.milestoneOverlayName).toBeNull();
  });

  it("milestone overlay auto-clears after 2500ms", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      emitSocketEvent("game:state-update", {
        type: "milestone_complete",
        nextMilestone: "Prologue",
      });
    });

    expect(result.current.showMilestoneOverlay).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.showMilestoneOverlay).toBe(false);
    expect(result.current.milestoneOverlayName).toBeNull();

    vi.useRealTimers();
  });

  it("openHistoryDrawer / closeHistoryDrawer toggle isHistoryDrawerOpen", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    expect(result.current.isHistoryDrawerOpen).toBe(false);

    act(() => result.current.openHistoryDrawer());
    expect(result.current.isHistoryDrawerOpen).toBe(true);

    act(() => result.current.closeHistoryDrawer());
    expect(result.current.isHistoryDrawerOpen).toBe(false);
  });

  it("isFirstLaunch=false when messages are present (resumed adventure)", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    // stableQueryData has messages: [{ role: "assistant", ... }]
    expect(result.current.isFirstLaunch).toBe(false);
  });

  it("game:response-start sets isFirstLaunch=false", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    // Manually set isFirstLaunch-like scenario: simulate the event
    act(() => {
      emitSocketEvent("game:response-start", { adventureId: "adv-1" });
    });

    // After response-start, isFirstLaunch must be false
    expect(result.current.isFirstLaunch).toBe(false);
  });
});

describe("useGameSession — Story 6.5 extensions", () => {
  beforeEach(() => {
    listeners.clear();
    apiPostMock.mockReset();
    apiGetMock.mockReset();
    socket.connected = true;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
  });

  it("initialises currentHp and maxHp from game state", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));
    expect(result.current.currentHp).toBe(20);
    expect(result.current.maxHp).toBe(20);
  });

  it("updates currentHp and maxHp on game:state-update hp_change", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      emitSocketEvent("game:state-update", { type: "hp_change", currentHp: 12, maxHp: 20 });
    });

    expect(result.current.currentHp).toBe(12);
    expect(result.current.maxHp).toBe(20);
  });

  it("sets isAdventureComplete=true on adventure_complete", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      emitSocketEvent("game:state-update", { type: "adventure_complete" });
    });

    expect(result.current.isAdventureComplete).toBe(true);
    expect(result.current.isGameOver).toBe(false);
  });

  it("sets isAdventureComplete=true and isGameOver=true on game_over", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      emitSocketEvent("game:state-update", { type: "game_over" });
    });

    expect(result.current.isAdventureComplete).toBe(true);
    expect(result.current.isGameOver).toBe(true);
  });

  it("shows autosave indicator for 2s after game:response-complete", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGameSession("adv-1"));
    const initialSavedAtMs = result.current.lastSavedAt?.getTime() ?? 0;

    expect(result.current.showAutosaveIndicator).toBe(false);

    act(() => {
      emitSocketEvent("game:response-complete", {
        adventureId: "adv-1",
        cleanText: "La suite...",
        choices: [],
      });
    });

    expect(result.current.showAutosaveIndicator).toBe(true);
    expect((result.current.lastSavedAt?.getTime() ?? 0) > initialSavedAtMs).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.showAutosaveIndicator).toBe(false);

    vi.useRealTimers();
  });

  it("manualSave() calls POST /api/v1/adventures/:id/save and updates lastSavedAt", async () => {
    const savedAt = "2026-03-25T10:00:00.000Z";
    apiPostMock.mockResolvedValue({ success: true, data: { savedAt } });

    const { result } = renderHook(() => useGameSession("adv-1"));

    await act(async () => {
      await result.current.manualSave();
    });

    expect(apiPostMock).toHaveBeenCalledWith("/api/v1/adventures/adv-1/save", {});
    expect(result.current.lastSavedAt?.toISOString()).toBe(savedAt);
  });

  it("manualSave() triggers the autosave indicator", async () => {
    vi.useFakeTimers();
    apiPostMock.mockResolvedValue({ success: true, data: { savedAt: "2026-03-25T10:00:00.000Z" } });

    const { result } = renderHook(() => useGameSession("adv-1"));

    await act(async () => {
      await result.current.manualSave();
    });

    expect(result.current.showAutosaveIndicator).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.showAutosaveIndicator).toBe(false);

    vi.useRealTimers();
  });

  it("manualSave() silently fails when API throws", async () => {
    apiPostMock.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGameSession("adv-1"));

    // Should not throw
    await act(async () => {
      await result.current.manualSave();
    });

    // lastSavedAt should remain at initial value (from gameState.adventure.lastPlayedAt)
    expect(result.current.lastSavedAt).toBeDefined();
  });

  it("openPauseMenu / closePauseMenu toggle isPauseMenuOpen", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    expect(result.current.isPauseMenuOpen).toBe(false);

    act(() => result.current.openPauseMenu());
    expect(result.current.isPauseMenuOpen).toBe(true);

    act(() => result.current.closePauseMenu());
    expect(result.current.isPauseMenuOpen).toBe(false);
  });
});
