/**
 * HistoryDrawer tests — Story 6.6 Task 8
 *
 * Covers:
 *  - Opens when isOpen=true and renders milestone groups
 *  - Active milestone has "● en cours" badge
 *  - Shows loading skeleton while messages fetch
 *  - Shows empty state when no messages
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GameMessageDTO, MilestoneDTO } from "@jdrai/shared";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { useQueryMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("@/services/adventure.service", () => ({
  fetchMessages: vi.fn(),
}));

import { HistoryDrawer } from "@/components/game/HistoryDrawer";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const milestones: MilestoneDTO[] = [
  { id: "m1", name: "Prologue", sortOrder: 0, status: "completed" },
  { id: "m2", name: "La Forêt Sombre", sortOrder: 1, status: "active" },
];

const messages: GameMessageDTO[] = [
  {
    id: "msg1",
    role: "assistant",
    content: "Le Chroniqueur narre votre arrivée.",
    milestoneId: "m1",
    createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "msg2",
    role: "user",
    content: "Je cherche une auberge.",
    milestoneId: "m1",
    createdAt: "2026-03-01T00:01:00Z",
  },
  {
    id: "msg3",
    role: "assistant",
    content: "Vous entrez dans la forêt sombre.",
    milestoneId: "m2",
    createdAt: "2026-03-01T00:02:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("HistoryDrawer", () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue({
      data: messages,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("renders milestone groups with messages when open", () => {
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        adventureId="adv-1"
        milestones={milestones}
      />,
    );

    expect(screen.getByText("🏴 Prologue")).toBeInTheDocument();
    expect(screen.getByText("🏴 La Forêt Sombre")).toBeInTheDocument();
    expect(screen.getByText("Le Chroniqueur narre votre arrivée.")).toBeInTheDocument();
    expect(screen.getByText("▸ Je cherche une auberge.")).toBeInTheDocument();
  });

  it("shows ● en cours badge on the active milestone", () => {
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        adventureId="adv-1"
        milestones={milestones}
      />,
    );

    // "La Forêt Sombre" is status="active"
    expect(screen.getByText("● en cours")).toBeInTheDocument();
    // "Prologue" is completed, no badge
    expect(screen.getAllByText("● en cours")).toHaveLength(1);
  });

  it("shows loading skeleton while messages are loading", () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        adventureId="adv-1"
        milestones={milestones}
      />,
    );

    // Sheet portal renders into document.body
    const loadingContainer = document.body.querySelector("[aria-busy='true']");
    expect(loadingContainer).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        adventureId="adv-1"
        milestones={milestones}
      />,
    );

    expect(screen.getByText("Aucun message dans cette aventure.")).toBeInTheDocument();
  });

  it("calls onClose when ← Retour button is clicked", () => {
    const onClose = vi.fn();
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={onClose}
        adventureId="adv-1"
        milestones={milestones}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Fermer l'historique" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("truncates long assistant messages to 200 chars", () => {
    const longContent = "A".repeat(300);
    useQueryMock.mockReturnValue({
      data: [{ id: "x", role: "assistant", content: longContent, milestoneId: "m1", createdAt: "2026-03-01T00:00:00Z" }],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        adventureId="adv-1"
        milestones={milestones}
      />,
    );

    const displayed = screen.getByText(/^A+\.\.\./);
    expect(displayed.textContent).toHaveLength(203); // 200 chars + "..."
  });

  it("shows error state and retries when message fetch fails", () => {
    const refetch = vi.fn();
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch,
    });

    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        adventureId="adv-1"
        milestones={milestones}
      />,
    );

    expect(screen.getByText("Impossible de charger l'historique.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
