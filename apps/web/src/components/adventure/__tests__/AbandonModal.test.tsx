import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdventureDTO } from "@jdrai/shared";

const mockMutateAsync = vi.fn();
const mockIsPending = { value: false };

vi.mock("@/hooks/useAdventures", () => ({
  useAbandonAdventure: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending.value,
  }),
}));

import { AbandonModal } from "../AbandonModal";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const MOCK_ADVENTURE: AdventureDTO = {
  id: "adv-1",
  title: "La Forêt Maudite",
  status: "active",
  difficulty: "normal",
  estimatedDuration: "medium",
  startedAt: "2026-02-26T00:00:00Z",
  lastPlayedAt: "2026-02-26T00:00:00Z",
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

describe("AbandonModal (Story 5.2 AC-6)", () => {
  beforeEach(() => {
    mockIsPending.value = false;
  });

  it("does not render when adventure is null (closed state)", () => {
    render(<AbandonModal adventure={null} onClose={vi.fn()} />);
    expect(screen.queryByText(/Abandonner l'aventure/i)).not.toBeInTheDocument();
  });

  it("renders title and adventure name when open", () => {
    render(<AbandonModal adventure={MOCK_ADVENTURE} onClose={vi.fn()} />);
    expect(screen.getByText(/Abandonner l'aventure/i)).toBeInTheDocument();
    expect(screen.getByText(/La Forêt Maudite/i)).toBeInTheDocument();
  });

  it("renders the irreversible warning text", () => {
    render(<AbandonModal adventure={MOCK_ADVENTURE} onClose={vi.fn()} />);
    expect(screen.getByText(/sera perdue/i)).toBeInTheDocument();
    expect(screen.getByText(/irréversible/i)).toBeInTheDocument();
  });

  it("calls mutateAsync and onClose when ABANDONNER is clicked", async () => {
    const onClose = vi.fn();
    mockMutateAsync.mockResolvedValueOnce(undefined);

    render(<AbandonModal adventure={MOCK_ADVENTURE} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /abandonner/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith("adv-1");
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it("calls onClose when Annuler is clicked", () => {
    const onClose = vi.fn();
    render(<AbandonModal adventure={MOCK_ADVENTURE} onClose={onClose} />);
    fireEvent.click(screen.getByText("Annuler"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
