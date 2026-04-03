import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdventureDTO } from "@jdrai/shared";

import { ApiError } from "@/services/api";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockMutateAsync = vi.fn();
const mockSetHideNav = vi.fn();
const mockInvalidateQueries = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@/hooks/useAdventures", () => ({
  useCreateAdventure: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

vi.mock("@/stores/ui.store", () => ({
  useUIStore: (selector: (s: { hideNav: boolean; setHideNav: typeof mockSetHideNav }) => unknown) =>
    selector({ hideNav: false, setHideNav: mockSetHideNav }),
}));

import { AdventureLoadingScreen } from "../AdventureLoadingScreen";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockInvalidateQueries.mockReset();
});

const MOCK_ADVENTURE: AdventureDTO = {
  id: "adv-1",
  title: "La Forêt Maudite",
  status: "active",
  isGameOver: false,
  isTutorial: false,
  difficulty: "normal",
  estimatedDuration: "medium",
  startedAt: "2026-02-27T00:00:00Z",
  lastPlayedAt: "2026-02-27T00:00:00Z",
  character: {
    id: "char-1",
    name: "Aventurier",
    className: "Aventurier",
    raceName: "Humain",
    stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
    currentHp: 20,
    maxHp: 20,
  },
};

const BASE_CONFIG = { difficulty: "normal" as const, estimatedDuration: "medium" as const };

describe("AdventureLoadingScreen (WF-E9-04)", () => {
  beforeEach(() => {
    // Default: mutateAsync resolves successfully (navigate handled by hook)
    mockMutateAsync.mockResolvedValue(MOCK_ADVENTURE);
  });

  it("renders the loading message", () => {
    render(
      <AdventureLoadingScreen
        config={BASE_CONFIG}
        hiddenParams={false}
        onError={vi.fn()}
      />,
    );
    expect(screen.getByText(/Le Maître du Jeu prépare votre aventure/i)).toBeInTheDocument();
  });

  it("shows params when hiddenParams = false", () => {
    render(
      <AdventureLoadingScreen
        config={BASE_CONFIG}
        hiddenParams={false}
        durationLabel="Moyenne (~45 min)"
        difficultyLabel="Normal"
        onError={vi.fn()}
      />,
    );
    expect(screen.getByText(/Heroic Fantasy/i)).toBeInTheDocument();
    expect(screen.getByText(/Moyenne/i)).toBeInTheDocument();
    expect(screen.getByText(/Normal/i)).toBeInTheDocument();
  });

  it("shows mystery message when hiddenParams = true", () => {
    render(
      <AdventureLoadingScreen
        config={BASE_CONFIG}
        hiddenParams={true}
        onError={vi.fn()}
      />,
    );
    expect(screen.getByText(/Le destin est en marche/i)).toBeInTheDocument();
    expect(screen.queryByText(/Heroic Fantasy/i)).not.toBeInTheDocument();
  });

  it("calls setHideNav(true) on mount and false on unmount", () => {
    const { unmount } = render(
      <AdventureLoadingScreen config={BASE_CONFIG} hiddenParams={false} onError={vi.fn()} />,
    );
    expect(mockSetHideNav).toHaveBeenCalledWith(true);
    unmount();
    expect(mockSetHideNav).toHaveBeenCalledWith(false);
  });

  it("calls mutateAsync on mount", async () => {
    render(
      <AdventureLoadingScreen config={BASE_CONFIG} hiddenParams={false} onError={vi.fn()} />,
    );
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(BASE_CONFIG);
    });
  });

  it("calls onError after 3 consecutive failures", async () => {
    vi.useFakeTimers();
    mockMutateAsync.mockRejectedValue(new Error("Network error"));
    const onError = vi.fn();

    render(
      <AdventureLoadingScreen config={BASE_CONFIG} hiddenParams={false} onError={onError} />,
    );

    // Let first attempt settle (flush microtasks from useEffect + mutateAsync rejection)
    await vi.advanceTimersByTimeAsync(0);
    expect(mockMutateAsync).toHaveBeenCalledTimes(1);

    // Advance past first retry delay → 2nd attempt settles
    await vi.advanceTimersByTimeAsync(1600);
    expect(mockMutateAsync).toHaveBeenCalledTimes(2);

    // Advance past second retry delay → 3rd attempt → onError
    await vi.advanceTimersByTimeAsync(1600);
    expect(mockMutateAsync).toHaveBeenCalledTimes(3);
    expect(onError).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("invalidates cache and calls onLimitReached on MAX_ACTIVE_ADVENTURES error (AC-4)", async () => {
    const limitError = new ApiError("MAX_ACTIVE_ADVENTURES", "Limite atteinte");
    mockMutateAsync.mockRejectedValue(limitError);
    const onLimitReached = vi.fn();

    render(
      <AdventureLoadingScreen
        config={BASE_CONFIG}
        hiddenParams={false}
        onError={vi.fn()}
        onLimitReached={onLimitReached}
      />,
    );

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["adventures", "active"] });
    });
    expect(onLimitReached).toHaveBeenCalledOnce();
  });

  it("does NOT retry on MAX_ACTIVE_ADVENTURES (limit callback only)", async () => {
    const limitError = new ApiError("MAX_ACTIVE_ADVENTURES", "Limite atteinte");
    mockMutateAsync.mockRejectedValue(limitError);
    const onError = vi.fn();
    const onLimitReached = vi.fn();

    render(
      <AdventureLoadingScreen
        config={BASE_CONFIG}
        hiddenParams={false}
        onError={onError}
        onLimitReached={onLimitReached}
      />,
    );

    await waitFor(() => {
      expect(onLimitReached).toHaveBeenCalledOnce();
    });
    // Only 1 attempt — no retry on limit error
    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("shows delay message after 15 seconds", async () => {
    vi.useFakeTimers();
    // Keep mutateAsync pending so we stay on loading screen
    mockMutateAsync.mockReturnValue(new Promise(() => {}));

    render(
      <AdventureLoadingScreen config={BASE_CONFIG} hiddenParams={false} onError={vi.fn()} />,
    );

    expect(screen.queryByText(/Cela prend plus de temps/i)).not.toBeInTheDocument();

    // Advance past 15s threshold — React re-renders synchronously in fake timer context
    await vi.advanceTimersByTimeAsync(15_001);

    expect(screen.getByText(/Cela prend plus de temps/i)).toBeInTheDocument();

    vi.useRealTimers();
  });
});
