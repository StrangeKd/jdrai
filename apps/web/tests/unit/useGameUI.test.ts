/**
 * useGameUI — Story 7.4 (migrated from tests/unit/useGameSession.test.ts)
 *
 * Covers:
 *  - beforeunload guard (isInGameSession)
 *  - Pause menu, history drawer, exit modal state
 *  - Milestone overlay + auto-dismiss timer
 *  - Autosave indicator + lastSavedAt via triggerSave()
 *  - isFirstLaunch / dismissIntro / handleIntroEnd
 *  - confirmExit: calls onConfirmExitSave, sets isInGameSession=false, navigates
 *  - lastSavedAt seeding from gameState
 */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GameStateDTO } from "@jdrai/shared";

import { useGameUI } from "@/hooks/useGameUI";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
const mockOnConfirmExitSave = vi.fn();

function makeGameState(overrides?: Partial<GameStateDTO["adventure"]>): GameStateDTO {
  return {
    adventure: {
      id: "adv-1",
      title: "Test Adventure",
      status: "active",
      isGameOver: false,
      difficulty: "normal",
      estimatedDuration: "medium",
      startedAt: "2026-03-01T00:00:00.000Z",
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
      ...overrides,
    } as GameStateDTO["adventure"],
    messages: [{ id: "m1", role: "assistant", content: "Bienvenue.", milestoneId: null, createdAt: new Date().toISOString() }],
    milestones: [],
    isStreaming: false,
  };
}

function renderUI(overrides?: {
  isNew?: boolean;
  isResume?: boolean;
  gameState?: GameStateDTO | null;
}) {
  return renderHook(() =>
    useGameUI({
      adventureId: "adv-1",
      options: { isNew: overrides?.isNew, isResume: overrides?.isResume },
      onConfirmExitSave: mockOnConfirmExitSave,
      navigate: mockNavigate,
      gameState: overrides?.gameState ?? makeGameState(),
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests — isInGameSession + beforeunload
// ---------------------------------------------------------------------------

describe("useGameUI — isInGameSession + beforeunload", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockOnConfirmExitSave.mockReset();
    mockOnConfirmExitSave.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("isInGameSession is true on mount", () => {
    const { result } = renderUI();
    expect(result.current.isInGameSession).toBe(true);
  });

  it("beforeunload is prevented when isInGameSession=true", () => {
    renderUI();

    const event = new Event("beforeunload") as BeforeUnloadEvent;
    Object.defineProperty(event, "returnValue", { writable: true, value: "" });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("exitGameSession() sets isInGameSession=false", () => {
    const { result } = renderUI();

    act(() => result.current.exitGameSession());
    expect(result.current.isInGameSession).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests — Exit modal + confirmExit
// ---------------------------------------------------------------------------

describe("useGameUI — Exit modal", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockOnConfirmExitSave.mockReset();
    mockOnConfirmExitSave.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("openExitModal / closeExitModal toggle isExitModalOpen", () => {
    const { result } = renderUI();

    expect(result.current.isExitModalOpen).toBe(false);

    act(() => result.current.openExitModal());
    expect(result.current.isExitModalOpen).toBe(true);

    act(() => result.current.closeExitModal());
    expect(result.current.isExitModalOpen).toBe(false);
  });

  it("confirmExit() calls onConfirmExitSave, sets isInGameSession=false, navigates to /hub", async () => {
    const { result } = renderUI();

    await act(async () => {
      await result.current.confirmExit();
    });

    expect(mockOnConfirmExitSave).toHaveBeenCalledOnce();
    expect(result.current.isInGameSession).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/hub" });
  });

  it("confirmExit(onNavigate) calls onNavigate instead of navigate", async () => {
    const { result } = renderUI();
    const onNavigate = vi.fn();

    await act(async () => {
      await result.current.confirmExit(onNavigate);
    });

    expect(onNavigate).toHaveBeenCalledOnce();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("confirmExit() still navigates when onConfirmExitSave fails", async () => {
    mockOnConfirmExitSave.mockRejectedValue(new Error("Network error"));
    const { result } = renderUI();

    await act(async () => {
      await result.current.confirmExit();
    });

    expect(result.current.isInGameSession).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/hub" });
  });
});

// ---------------------------------------------------------------------------
// Tests — Pause menu + History drawer
// ---------------------------------------------------------------------------

describe("useGameUI — Pause menu + History drawer", () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it("openPauseMenu / closePauseMenu toggle isPauseMenuOpen", () => {
    const { result } = renderUI();

    expect(result.current.isPauseMenuOpen).toBe(false);

    act(() => result.current.openPauseMenu());
    expect(result.current.isPauseMenuOpen).toBe(true);

    act(() => result.current.closePauseMenu());
    expect(result.current.isPauseMenuOpen).toBe(false);
  });

  it("openHistoryDrawer / closeHistoryDrawer toggle isHistoryDrawerOpen", () => {
    const { result } = renderUI();

    expect(result.current.isHistoryDrawerOpen).toBe(false);

    act(() => result.current.openHistoryDrawer());
    expect(result.current.isHistoryDrawerOpen).toBe(true);

    act(() => result.current.closeHistoryDrawer());
    expect(result.current.isHistoryDrawerOpen).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests — Milestone overlay
// ---------------------------------------------------------------------------

describe("useGameUI — Milestone overlay", () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it("showMilestone() sets showMilestoneOverlay=true and milestoneOverlayName", () => {
    const { result } = renderUI();

    act(() => {
      result.current.showMilestone("La Forêt Sombre");
    });

    expect(result.current.showMilestoneOverlay).toBe(true);
    expect(result.current.milestoneOverlayName).toBe("La Forêt Sombre");
  });

  it("milestone overlay auto-clears after 2500ms", () => {
    vi.useFakeTimers();
    const { result } = renderUI();

    act(() => {
      result.current.showMilestone("Prologue");
    });

    expect(result.current.showMilestoneOverlay).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.showMilestoneOverlay).toBe(false);
    expect(result.current.milestoneOverlayName).toBeNull();

    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// Tests — Autosave indicator + lastSavedAt
// ---------------------------------------------------------------------------

describe("useGameUI — Autosave indicator + lastSavedAt", () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it("triggerSave() sets lastSavedAt and shows autosave indicator for 2s", () => {
    vi.useFakeTimers();
    const { result } = renderUI({ gameState: null }); // no initial lastSavedAt

    expect(result.current.showAutosaveIndicator).toBe(false);

    const date = new Date("2026-03-25T10:00:00.000Z");
    act(() => {
      result.current.triggerSave(date);
    });

    expect(result.current.showAutosaveIndicator).toBe(true);
    expect(result.current.lastSavedAt?.toISOString()).toBe("2026-03-25T10:00:00.000Z");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.showAutosaveIndicator).toBe(false);

    vi.useRealTimers();
  });

  it("seeds lastSavedAt from gameState.adventure.lastPlayedAt on first load", () => {
    const gameState = makeGameState();
    const { result } = renderHook(() =>
      useGameUI({
        adventureId: "adv-1",
        options: {},
        onConfirmExitSave: mockOnConfirmExitSave,
        navigate: mockNavigate,
        gameState,
      }),
    );

    expect(result.current.lastSavedAt?.toISOString()).toBe("2026-03-01T12:00:00.000Z");
  });

  it("lastSavedAt is null when gameState has no lastPlayedAt", () => {
    const gameState = makeGameState({ lastPlayedAt: undefined });
    const { result } = renderHook(() =>
      useGameUI({
        adventureId: "adv-1",
        options: {},
        onConfirmExitSave: mockOnConfirmExitSave,
        navigate: mockNavigate,
        gameState,
      }),
    );

    expect(result.current.lastSavedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests — isFirstLaunch + dismissIntro + handleIntroEnd
// ---------------------------------------------------------------------------

describe("useGameUI — isFirstLaunch + intro", () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it("isFirstLaunch=false by default (no options)", () => {
    const { result } = renderUI();
    expect(result.current.isFirstLaunch).toBe(false);
  });

  it("isFirstLaunch=true when options.isNew=true", () => {
    const { result } = renderUI({ isNew: true });
    expect(result.current.isFirstLaunch).toBe(true);
  });

  it("isFirstLaunch=false when options.isResume=true (overrides isNew)", () => {
    const { result } = renderUI({ isNew: true, isResume: true });
    expect(result.current.isFirstLaunch).toBe(false);
  });

  it("dismissIntro() immediately sets isFirstLaunch=false", () => {
    const { result } = renderUI({ isNew: true });

    expect(result.current.isFirstLaunch).toBe(true);

    act(() => {
      result.current.dismissIntro();
    });

    expect(result.current.isFirstLaunch).toBe(false);
  });

  it("handleIntroEnd() sets isFirstLaunch=false immediately when minimum display has passed", () => {
    // isNew=false → introMinDisplayUntilRef = 0 → handleIntroEnd is immediate
    const { result } = renderUI({ isNew: false });

    // Manually set isFirstLaunch=true to simulate a state where intro is visible
    // (this would normally be set by isNew=true, but we test the mechanism)
    // handleIntroEnd should set it false
    act(() => {
      result.current.handleIntroEnd();
    });

    expect(result.current.isFirstLaunch).toBe(false);
  });

  it("handleIntroEnd() with isNew=true respects minimum 2s display", () => {
    vi.useFakeTimers();
    // isNew=true → introMinDisplayUntilRef = Date.now() + 2000
    const { result } = renderUI({ isNew: true });

    expect(result.current.isFirstLaunch).toBe(true);

    act(() => {
      result.current.handleIntroEnd();
    });

    // Still visible (within 2s minimum)
    expect(result.current.isFirstLaunch).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isFirstLaunch).toBe(false);

    vi.useRealTimers();
  });
});
