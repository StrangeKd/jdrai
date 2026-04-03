import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdventureDTO } from "@jdrai/shared";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Radix DropdownMenu to expose items directly in DOM (avoids jsdom pointer event limitations)
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
  }) => (
    <button type="button" onClick={() => onSelect?.()}>
      {children}
    </button>
  ),
}));

import { AdventureCardActive, AdventureCardActiveSkeleton } from "../AdventureCardActive";

// formatRelativeTime depends on Date.now() — freeze time
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-01T12:00:00Z"));
  mockNavigate.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const activeAdventure: AdventureDTO = {
  id: "adv-1",
  title: "La Crypte des Ombres",
  status: "active",
  isGameOver: false,
  isTutorial: false,
  difficulty: "normal",
  estimatedDuration: "medium",
  startedAt: "2024-12-01T00:00:00Z",
  currentMilestone: "Entrée dans la crypte",
  lastPlayedAt: "2025-01-01T10:00:00Z", // 2h ago
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

describe("AdventureCardActive (Story 4.2 / Story 7.3 AC-1, AC-5)", () => {
  it("renders adventure title", () => {
    render(<AdventureCardActive adventure={activeAdventure} onAbandon={vi.fn()} />);
    expect(screen.getByText("La Crypte des Ombres")).toBeInTheDocument();
  });

  it("renders milestone name (AC-3)", () => {
    render(<AdventureCardActive adventure={activeAdventure} onAbandon={vi.fn()} />);
    expect(screen.getByText(/Entrée dans la crypte/)).toBeInTheDocument();
  });

  it("omits milestone line when currentMilestone is absent", () => {
    const { currentMilestone: _omit, ...adventureNoMilestone } = activeAdventure;
    render(<AdventureCardActive adventure={adventureNoMilestone} onAbandon={vi.fn()} />);
    expect(screen.queryByText(/🏴/)).not.toBeInTheDocument();
  });

  it("shows relative save time", () => {
    render(<AdventureCardActive adventure={activeAdventure} onAbandon={vi.fn()} />);
    expect(screen.getByText(/il y a 2h/)).toBeInTheDocument();
  });

  it("renders [⋮] options trigger (AC-1)", () => {
    render(<AdventureCardActive adventure={activeAdventure} onAbandon={vi.fn()} />);
    expect(screen.getByRole("button", { name: /options/i })).toBeInTheDocument();
  });

  it("renders Reprendre and Abandonner dropdown items (AC-1)", () => {
    render(<AdventureCardActive adventure={activeAdventure} onAbandon={vi.fn()} />);
    expect(screen.getByText(/▶ Reprendre/)).toBeInTheDocument();
    expect(screen.getByText(/✕ Abandonner/)).toBeInTheDocument();
  });

  it("REPRENDRE CTA navigates with isResume=true (AC-5)", () => {
    render(<AdventureCardActive adventure={activeAdventure} onAbandon={vi.fn()} />);
    // Primary CTA button (the bottom REPRENDRE button)
    const allReprendre = screen.getAllByRole("button", { name: /reprendre/i });
    // The CTA is the last REPRENDRE (the shadcn Button, not the DropdownMenuItem)
    fireEvent.click(allReprendre[allReprendre.length - 1]!);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/adventure/$id",
      params: { id: "adv-1" },
      state: { isResume: true },
    });
  });

  it("[⋮] Reprendre dropdown item navigates with isResume=true (AC-1)", () => {
    render(<AdventureCardActive adventure={activeAdventure} onAbandon={vi.fn()} />);
    fireEvent.click(screen.getByText(/▶ Reprendre/));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/adventure/$id",
      params: { id: "adv-1" },
      state: { isResume: true },
    });
  });

  it("[⋮] Abandonner dropdown item calls onAbandon with adventure DTO (AC-1)", () => {
    const onAbandon = vi.fn();
    render(<AdventureCardActive adventure={activeAdventure} onAbandon={onAbandon} />);
    fireEvent.click(screen.getByText(/✕ Abandonner/));
    expect(onAbandon).toHaveBeenCalledWith(activeAdventure);
  });
});

describe("AdventureCardActiveSkeleton", () => {
  it("renders skeleton with pulse animation", () => {
    const { container } = render(<AdventureCardActiveSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
