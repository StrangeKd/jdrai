/**
 * AdventureSummaryPage tests — Story 7.2 Task 11
 *
 * Covers AC #1, #3, #4, #5, #6, #7, #8, #9
 */
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdventureDTO, MilestoneDTO } from "@jdrai/shared";

// ---------------------------------------------------------------------------
// Router mock — must be before component import
// ---------------------------------------------------------------------------
const mockRouterState = { fromGameSession: false as boolean };
vi.mock("@tanstack/react-router", () => ({
  createFileRoute:
    (_path: string) =>
    (opts: unknown): unknown => ({
      ...(opts as object),
      useParams: () => ({ id: "adv-1" }),
    }),
  useRouterState: ({ select }: { select: (s: { location: { state: unknown } }) => unknown }) =>
    select({ location: { state: mockRouterState } }),
  Link: ({
    to,
    children,
    ...props
  }: { to: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// TanStack Query mock
// ---------------------------------------------------------------------------
const mockUseQuery = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQuery: (opts: { queryKey: unknown[]; refetchInterval?: unknown }) => mockUseQuery(opts),
}));

// ---------------------------------------------------------------------------
// canvas-confetti mock (no-op in tests)
// ---------------------------------------------------------------------------
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

// ---------------------------------------------------------------------------
// adventure.service mock
// ---------------------------------------------------------------------------
vi.mock("@/services/adventure.service", () => ({
  getAdventureById: vi.fn(),
  getMilestones: vi.fn(),
}));

// Import after mocks
import { AdventureSummaryPage } from "../$id_.summary";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const baseAdventure: AdventureDTO = {
  id: "adv-1",
  title: "Les Ruines d'Eldoria",
  status: "completed",
  difficulty: "normal",
  estimatedDuration: "medium",
  startedAt: "2026-01-01",
  lastPlayedAt: "2026-01-02",
  character: {
    id: "c1",
    name: "Aldric",
    className: "Aventurier",
    raceName: "Humain",
    stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
    currentHp: 20,
    maxHp: 20,
  },
  narrativeSummary: "Tu as triomphé dans une aventure épique.",
  isGameOver: false,
};

const completedMilestones: MilestoneDTO[] = [
  { id: "m1", name: "Prologue", sortOrder: 1, status: "completed" },
  { id: "m2", name: "La Forêt Maudite", sortOrder: 2, status: "completed" },
];

function setupQueryMocks(
  adventure: AdventureDTO | undefined,
  adventureOpts: { isLoading?: boolean; isError?: boolean } = {},
  milestones: MilestoneDTO[] = completedMilestones,
) {
  mockUseQuery.mockImplementation((opts: { queryKey: unknown[]; refetchInterval?: unknown }) => {
    const queryKey = opts.queryKey;
    if (Array.isArray(queryKey) && queryKey[0] === "adventure") {
      return {
        data: adventure,
        isLoading: adventureOpts.isLoading ?? false,
        isError: adventureOpts.isError ?? false,
        refetch: vi.fn(),
      };
    }
    // milestones query
    return {
      data: milestones,
      isLoading: false,
      isError: false,
    };
  });
}

afterEach(cleanup);
beforeEach(() => {
  mockRouterState.fromGameSession = false;
  vi.clearAllMocks();
});

describe("AdventureSummaryPage", () => {
  it("renders success state — title, narrative, milestones (WF-E11-01)", () => {
    setupQueryMocks(baseAdventure);
    render(<AdventureSummaryPage />);

    expect(screen.getByText("Aventure terminée !")).toBeInTheDocument();
    expect(screen.getByText("Les Ruines d'Eldoria")).toBeInTheDocument();
    expect(screen.getByText("Tu as triomphé dans une aventure épique.")).toBeInTheDocument();
    expect(screen.getByText("Prologue")).toBeInTheDocument();
    expect(screen.getByText("La Forêt Maudite")).toBeInTheDocument();
    // Rewards visible for success
    expect(screen.getByText("Récompenses")).toBeInTheDocument();
    // CTA
    expect(screen.getByRole("link", { name: /retour au hub/i })).toBeInTheDocument();
    expect(screen.getByText("Rejouer ce scénario")).toBeInTheDocument();
  });

  it("renders game over state — solemn title, ☠️ icon, completed milestones only (WF-E11-02)", () => {
    const gameOverAdventure: AdventureDTO = { ...baseAdventure, isGameOver: true };
    setupQueryMocks(gameOverAdventure);
    render(<AdventureSummaryPage />);

    expect(screen.getByText("Votre quête s'achève ici.")).toBeInTheDocument();
    expect(screen.getByLabelText("Game Over")).toBeInTheDocument();
    expect(screen.getByText("📜 Votre héritage")).toBeInTheDocument();
    expect(screen.getByText("Retenter ce scénario")).toBeInTheDocument();
  });

  it("renders abandoned state — no rewards, teaser text, static summary (WF-E11-05)", () => {
    const abandonedAdventure: AdventureDTO = { ...baseAdventure, status: "abandoned" };
    setupQueryMocks(abandonedAdventure);
    render(<AdventureSummaryPage />);

    expect(screen.getByText("Aventure inachevée")).toBeInTheDocument();
    expect(
      screen.getByText(/Vous avez quitté cette aventure avant sa conclusion/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Cette histoire avait encore des chemins inexplorés/)).toBeInTheDocument();
    // No rewards section
    expect(screen.queryByText("Récompenses")).not.toBeInTheDocument();
    expect(screen.getByText("Retenter ce scénario")).toBeInTheDocument();
  });

  it("shows skeleton in SummaryCard when narrativeSummary is absent (polling) (WF-E11-03)", () => {
    const { narrativeSummary: _omit, ...adventureWithoutSummary } = baseAdventure;
    // narrativeSummary is undefined (not yet generated)
    setupQueryMocks(adventureWithoutSummary as AdventureDTO);
    render(<AdventureSummaryPage />);

    expect(screen.getByLabelText("Chargement du résumé")).toBeInTheDocument();
  });

  it("renders SummaryGlobalError when adventure fails to load (WF-E11-06)", () => {
    setupQueryMocks(undefined, { isError: true });
    render(<AdventureSummaryPage />);

    expect(
      screen.getByText("Impossible de charger le résumé de l'aventure."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /réessayer/i })).toBeInTheDocument();
  });

  it("does NOT play celebration animation when fromGameSession=false (history visit) (AC #9)", async () => {
    const confettiMock = await import("canvas-confetti");
    setupQueryMocks(baseAdventure);
    render(<AdventureSummaryPage />);

    await waitFor(() => {
      expect(confettiMock.default).not.toHaveBeenCalled();
    });
  });

  it("plays celebration animation when fromGameSession=true and success state (AC #9)", async () => {
    mockRouterState.fromGameSession = true;
    const confettiMock = await import("canvas-confetti");
    setupQueryMocks(baseAdventure);
    render(<AdventureSummaryPage />);

    await waitFor(() => {
      expect(confettiMock.default).toHaveBeenCalledTimes(1);
    });
  });

  it("does NOT play animation for game_over even with fromGameSession=true (AC #9)", async () => {
    mockRouterState.fromGameSession = true;
    const gameOverAdventure: AdventureDTO = { ...baseAdventure, isGameOver: true };
    const confettiMock = await import("canvas-confetti");
    setupQueryMocks(gameOverAdventure);
    render(<AdventureSummaryPage />);

    await waitFor(() => {
      expect(confettiMock.default).not.toHaveBeenCalled();
    });
  });

  it("does NOT play animation while adventure is still loading even with fromGameSession=true (AC #9)", async () => {
    mockRouterState.fromGameSession = true;
    const confettiMock = await import("canvas-confetti");
    // adventure=undefined + isLoading=true simulates the initial fetch (data not yet arrived)
    setupQueryMocks(undefined, { isLoading: true });
    render(<AdventureSummaryPage />);

    await waitFor(() => {
      expect(confettiMock.default).not.toHaveBeenCalled();
    });
  });

  it("renders loading skeleton for adventure title while loading", () => {
    setupQueryMocks(undefined, { isLoading: true });
    render(<AdventureSummaryPage />);

    expect(screen.getByLabelText("Chargement")).toBeInTheDocument();
  });

  it("stops summary polling after 15 attempts when summary remains undefined (AC #12)", () => {
    const { narrativeSummary: _omit, ...withoutSummary } = baseAdventure;
    setupQueryMocks(withoutSummary as AdventureDTO);
    render(<AdventureSummaryPage />);

    const adventureQueryCall = mockUseQuery.mock.calls.find(
      (call) => Array.isArray(call[0]?.queryKey) && call[0].queryKey[0] === "adventure",
    );
    const refetchInterval = adventureQueryCall?.[0]?.refetchInterval as
      | ((query: { state: { data: AdventureDTO | undefined } }) => number | false)
      | undefined;

    expect(typeof refetchInterval).toBe("function");

    const query = { state: { data: withoutSummary as AdventureDTO } };

    for (let i = 0; i < 14; i += 1) {
      expect(refetchInterval?.(query)).toBe(2000);
    }

    let finalResult: number | false = 2000;
    act(() => {
      finalResult = refetchInterval?.(query) ?? false;
    });
    expect(finalResult).toBe(false);
  });

  it("does not poll summary for abandoned adventures (AC #12)", () => {
    const { narrativeSummary: _omit, ...withoutSummary } = baseAdventure;
    const abandonedAdventure: AdventureDTO = {
      ...withoutSummary,
      status: "abandoned",
    };
    setupQueryMocks(abandonedAdventure);
    render(<AdventureSummaryPage />);

    const adventureQueryCall = mockUseQuery.mock.calls.find(
      (call) => Array.isArray(call[0]?.queryKey) && call[0].queryKey[0] === "adventure",
    );
    const refetchInterval = adventureQueryCall?.[0]?.refetchInterval as
      | ((query: { state: { data: AdventureDTO | undefined } }) => number | false)
      | undefined;

    expect(refetchInterval?.({ state: { data: abandonedAdventure } })).toBe(false);
  });
});
