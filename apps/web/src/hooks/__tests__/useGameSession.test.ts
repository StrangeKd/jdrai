/**
 * useGameSession — coordinator integration tests (Story 7.4 refactor)
 *
 * Verifies coordinator-level concerns ONLY:
 *  - REST query → gameState exposure
 *  - HP seeding from gameState + cross-domain onHpChange wiring
 *  - isAdventureComplete / isGameOver via onAdventureComplete wiring
 *  - isLocked composite
 *  - manualSave() — API call, lastSavedAt, autosave indicator, silent fail
 *  - Cross-domain wiring: game:response-complete → autosave indicator
 *  - Cross-domain wiring: milestone_complete → showMilestoneOverlay + timer
 *  - options passthrough: isFirstLaunch, isResume
 *  - UI delegation: pause menu, exit modal, history drawer, confirmExit, beforeunload
 *
 * Socket-level behavior (sendAction, streaming events) → useGameStreaming.test.ts
 * Resilience behavior (rate-limit, reconnect) → useGameResilience.test.ts
 * useGameUI unit behavior → useGameUI.test.ts (Story 7.4 C1)
 */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockGetSocket = vi.fn();
const mockSendMessage = vi.fn();
const mockApiPost = vi.fn();
const mockNavigate = vi.fn();
const mockUseQuery = vi.fn();

vi.mock("@/services/socket.service", () => ({
  connect: (...args: unknown[]) => mockConnect(...args),
  disconnect: (...args: unknown[]) => mockDisconnect(...args),
  getSocket: (...args: unknown[]) => mockGetSocket(...args),
  manualReconnect: vi.fn(),
}));

vi.mock("@/hooks/useGameChat", () => ({
  useGameChat: () => ({
    messages: [],
    sendMessage: mockSendMessage,
    isStreaming: false,
    stop: vi.fn(),
    error: null,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    post: (...args: unknown[]) => mockApiPost(...args),
  },
  rateLimitEmitter: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}));

vi.mock("@/lib/emitters", () => ({
  connectionStatusEmitter: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import type { ApiResponse, GameStateDTO } from "@jdrai/shared";

import { useGameSession } from "../useGameSession";

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

const gameStateResponse: ApiResponse<GameStateDTO> = {
  success: true,
  data: {
    adventure: {
      id: "adv-1",
      title: "La Forêt Maudite",
      status: "active",
      isGameOver: false,
      isTutorial: false,
      difficulty: "normal",
      estimatedDuration: "medium",
      startedAt: new Date().toISOString(),
      lastPlayedAt: "2026-03-01T12:00:00.000Z",
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

// ---------------------------------------------------------------------------
// Tests — gameState (REST query)
// ---------------------------------------------------------------------------

describe("useGameSession — gameState", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ data: gameStateResponse });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes gameState from the REST query", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));
    expect(result.current.gameState).toEqual(gameStateResponse.data);
  });

  it("seeds currentHp and maxHp from gameState.adventure.character", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));
    expect(result.current.currentHp).toBe(20);
    expect(result.current.maxHp).toBe(20);
  });

  it("seeds lastSavedAt from gameState.adventure.lastPlayedAt", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));
    expect(result.current.lastSavedAt?.toISOString()).toBe("2026-03-01T12:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// Tests — cross-domain wiring: HP & adventure completion
// ---------------------------------------------------------------------------

describe("useGameSession — cross-domain: HP & completion", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ data: gameStateResponse });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates currentHp and maxHp on game:state-update hp_change (onHpChange wiring)", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      mockSocket.trigger("game:state-update", { type: "hp_change", currentHp: 12, maxHp: 20 });
    });

    expect(result.current.currentHp).toBe(12);
    expect(result.current.maxHp).toBe(20);
  });

  it("sets isAdventureComplete=true, isGameOver=false on adventure_complete (onAdventureComplete wiring)", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      mockSocket.trigger("game:state-update", { type: "adventure_complete" });
    });

    expect(result.current.isAdventureComplete).toBe(true);
    expect(result.current.isGameOver).toBe(false);
  });

  it("sets isAdventureComplete=true, isGameOver=true on game_over (onAdventureComplete wiring)", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      mockSocket.trigger("game:state-update", { type: "game_over" });
    });

    expect(result.current.isAdventureComplete).toBe(true);
    expect(result.current.isGameOver).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests — cross-domain wiring: autosave indicator
// ---------------------------------------------------------------------------

describe("useGameSession — cross-domain: autosave indicator", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ data: gameStateResponse });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("game:response-complete triggers autosave indicator (onResponseComplete → ui.triggerSave wiring)", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGameSession("adv-1"));
    const initialSavedAt = result.current.lastSavedAt?.getTime() ?? 0;

    expect(result.current.showAutosaveIndicator).toBe(false);

    act(() => {
      mockSocket.trigger("game:response-complete", {
        adventureId: "adv-1",
        cleanText: "La suite…",
        choices: [],
      });
    });

    expect(result.current.showAutosaveIndicator).toBe(true);
    expect((result.current.lastSavedAt?.getTime() ?? 0) > initialSavedAt).toBe(true);

    act(() => { vi.advanceTimersByTime(2000); });

    expect(result.current.showAutosaveIndicator).toBe(false);

    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// Tests — cross-domain wiring: milestone overlay
// ---------------------------------------------------------------------------

describe("useGameSession — cross-domain: milestone overlay", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ data: gameStateResponse });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("milestone_complete with name sets showMilestoneOverlay=true (onMilestoneComplete → ui.showMilestone wiring)", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      mockSocket.trigger("game:state-update", {
        type: "milestone_complete",
        nextMilestone: "La Forêt Sombre",
      });
    });

    expect(result.current.showMilestoneOverlay).toBe(true);
    expect(result.current.milestoneOverlayName).toBe("La Forêt Sombre");
  });

  it("milestone_complete with nextMilestone=null does NOT show overlay", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => {
      mockSocket.trigger("game:state-update", {
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
      mockSocket.trigger("game:state-update", {
        type: "milestone_complete",
        nextMilestone: "Prologue",
      });
    });

    expect(result.current.showMilestoneOverlay).toBe(true);

    act(() => { vi.advanceTimersByTime(2500); });

    expect(result.current.showMilestoneOverlay).toBe(false);
    expect(result.current.milestoneOverlayName).toBeNull();

    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// Tests — isLocked composite
// ---------------------------------------------------------------------------

describe("useGameSession — isLocked", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ data: gameStateResponse });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("isLocked=false on mount", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));
    expect(result.current.isLocked).toBe(false);
  });

  it("isLocked=true when isStreaming (game:response-start event)", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => { mockSocket.trigger("game:response-start"); });

    expect(result.current.isStreaming).toBe(true);
    expect(result.current.isLocked).toBe(true);
  });

  it("isLocked=true when isAdventureComplete (adventure_complete event)", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    act(() => { mockSocket.trigger("game:state-update", { type: "adventure_complete" }); });

    expect(result.current.isAdventureComplete).toBe(true);
    expect(result.current.isLocked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests — manualSave
// ---------------------------------------------------------------------------

describe("useGameSession — manualSave", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ data: gameStateResponse });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls POST /api/v1/adventures/:id/save and updates lastSavedAt", async () => {
    const savedAt = "2026-03-25T10:00:00.000Z";
    mockApiPost.mockResolvedValue({ success: true, data: { savedAt } });

    const { result } = renderHook(() => useGameSession("adv-1"));

    await act(async () => { await result.current.manualSave(); });

    expect(mockApiPost).toHaveBeenCalledWith("/api/v1/adventures/adv-1/save", {});
    expect(result.current.lastSavedAt?.toISOString()).toBe(savedAt);
  });

  it("triggers autosave indicator for 2s after successful save", async () => {
    vi.useFakeTimers();
    mockApiPost.mockResolvedValue({ success: true, data: { savedAt: "2026-03-25T10:00:00.000Z" } });

    const { result } = renderHook(() => useGameSession("adv-1"));

    await act(async () => { await result.current.manualSave(); });

    expect(result.current.showAutosaveIndicator).toBe(true);

    act(() => { vi.advanceTimersByTime(2000); });

    expect(result.current.showAutosaveIndicator).toBe(false);

    vi.useRealTimers();
  });

  it("silently fails when API throws — lastSavedAt stays seeded from gameState", async () => {
    mockApiPost.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGameSession("adv-1"));

    await act(async () => { await result.current.manualSave(); });

    expect(result.current.lastSavedAt?.toISOString()).toBe("2026-03-01T12:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// Tests — options passthrough (isFirstLaunch / isResume / auto-start)
// ---------------------------------------------------------------------------

describe("useGameSession — options passthrough", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ data: gameStateResponse });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("no options → isFirstLaunch=false, no auto-start (messages already exist)", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));
    expect(result.current.isFirstLaunch).toBe(false);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("isNew=true → isFirstLaunch=true", () => {
    const { result } = renderHook(() => useGameSession("adv-1", { isNew: true }));
    expect(result.current.isFirstLaunch).toBe(true);
  });

  it("isResume=true → isFirstLaunch=false", () => {
    const { result } = renderHook(() => useGameSession("adv-1", { isResume: true }));
    expect(result.current.isFirstLaunch).toBe(false);
  });

  it("isResume=true overrides isNew=true → isFirstLaunch=false", () => {
    const { result } = renderHook(() => useGameSession("adv-1", { isNew: true, isResume: true }));
    expect(result.current.isFirstLaunch).toBe(false);
  });

  it("isResume=true + empty messages → no auto-start, isFirstLaunch=false", () => {
    mockUseQuery.mockReturnValue({
      data: { ...gameStateResponse, data: { ...gameStateResponse.data, messages: [] } },
    });
    const { result } = renderHook(() => useGameSession("adv-1", { isResume: true }));
    expect(result.current.isFirstLaunch).toBe(false);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("auto-start when no messages (delegates to useGameStreaming)", () => {
    mockUseQuery.mockReturnValue({
      data: { ...gameStateResponse, data: { ...gameStateResponse.data, messages: [] } },
    });
    renderHook(() => useGameSession("adv-1"));
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Tests — UI delegation (pause menu, history drawer, exit modal, confirmExit, beforeunload)
// ---------------------------------------------------------------------------

describe("useGameSession — UI delegation", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockConnect.mockReturnValue(mockSocket);
    mockGetSocket.mockReturnValue(mockSocket);
    mockSendMessage.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ data: gameStateResponse });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("openPauseMenu / closePauseMenu toggle isPauseMenuOpen", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    expect(result.current.isPauseMenuOpen).toBe(false);
    act(() => result.current.openPauseMenu());
    expect(result.current.isPauseMenuOpen).toBe(true);
    act(() => result.current.closePauseMenu());
    expect(result.current.isPauseMenuOpen).toBe(false);
  });

  it("openHistoryDrawer / closeHistoryDrawer toggle isHistoryDrawerOpen", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    expect(result.current.isHistoryDrawerOpen).toBe(false);
    act(() => result.current.openHistoryDrawer());
    expect(result.current.isHistoryDrawerOpen).toBe(true);
    act(() => result.current.closeHistoryDrawer());
    expect(result.current.isHistoryDrawerOpen).toBe(false);
  });

  it("openExitModal / closeExitModal toggle isExitModalOpen", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));

    expect(result.current.isExitModalOpen).toBe(false);
    act(() => result.current.openExitModal());
    expect(result.current.isExitModalOpen).toBe(true);
    act(() => result.current.closeExitModal());
    expect(result.current.isExitModalOpen).toBe(false);
  });

  it("dismissIntro() immediately sets isFirstLaunch=false", () => {
    const { result } = renderHook(() => useGameSession("adv-1", { isNew: true }));

    expect(result.current.isFirstLaunch).toBe(true);
    act(() => result.current.dismissIntro());
    expect(result.current.isFirstLaunch).toBe(false);
  });

  it("isInGameSession=true on mount", () => {
    const { result } = renderHook(() => useGameSession("adv-1"));
    expect(result.current.isInGameSession).toBe(true);
  });

  it("beforeunload is prevented when isInGameSession=true", () => {
    renderHook(() => useGameSession("adv-1"));

    const event = new Event("beforeunload") as BeforeUnloadEvent;
    Object.defineProperty(event, "returnValue", { writable: true, value: "" });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    act(() => { window.dispatchEvent(event); });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("confirmExit() calls POST save, sets isInGameSession=false, navigates to /hub", async () => {
    mockApiPost.mockResolvedValue({ success: true, data: { savedAt: "2026-03-25T10:00:00.000Z" } });

    const { result } = renderHook(() => useGameSession("adv-1"));

    await act(async () => { await result.current.confirmExit(); });

    expect(mockApiPost).toHaveBeenCalledWith("/api/v1/adventures/adv-1/save", {});
    expect(result.current.isInGameSession).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/hub" });
  });

  it("confirmExit(onNavigate) calls onNavigate instead of navigate", async () => {
    mockApiPost.mockResolvedValue({ success: true, data: { savedAt: "2026-03-25T10:00:00.000Z" } });
    const { result } = renderHook(() => useGameSession("adv-1"));
    const onNavigate = vi.fn();

    await act(async () => { await result.current.confirmExit(onNavigate); });

    expect(onNavigate).toHaveBeenCalledOnce();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("confirmExit() still navigates when manualSave fails", async () => {
    mockApiPost.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGameSession("adv-1"));

    await act(async () => { await result.current.confirmExit(); });

    expect(result.current.isInGameSession).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/hub" });
  });
});
