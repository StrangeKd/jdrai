import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdventureDTO } from "@jdrai/shared";

// Mock shadcn Dialog — avoid Radix UI portal/animation issues in jsdom
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

// Mock UIStore — full store, not selector
let mockAdventureModalOpen = false;
const mockSetAdventureModalOpen = vi.fn();
vi.mock("@/stores/ui.store", () => ({
  useUIStore: () => ({
    adventureModalOpen: mockAdventureModalOpen,
    setAdventureModalOpen: mockSetAdventureModalOpen,
  }),
}));

// Mock useActiveAdventures
const mockUseActiveAdventures = vi.fn();
vi.mock("@/hooks/useAdventures", () => ({
  useActiveAdventures: () => mockUseActiveAdventures(),
  useCompletedAdventures: () => ({ data: [], isLoading: false, isError: false }),
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Button
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

import { AdventureModal } from "../AdventureModal";

afterEach(cleanup);

function makeAdventure(overrides: Partial<AdventureDTO> = {}): AdventureDTO {
  return {
    id: "adv-1",
    title: "La Forêt Maudite",
    status: "active",
    isTutorial: false,
    difficulty: "normal",
    estimatedDuration: "medium",
    startedAt: "2025-01-01T00:00:00Z",
    currentMilestone: "Entrée dans la forêt",
    lastPlayedAt: "2025-01-10T10:00:00Z",
    character: {
      id: "char-1",
      name: "Aventurier",
      className: "Aventurier",
      raceName: "Humain",
      stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
      currentHp: 20,
      maxHp: 20,
    },
    ...overrides,
    isGameOver: overrides.isGameOver ?? false,
  };
}

describe("AdventureModal (AC-5)", () => {
  beforeEach(() => {
    mockAdventureModalOpen = false;
    mockSetAdventureModalOpen.mockClear();
    mockNavigate.mockClear();
    mockUseActiveAdventures.mockReturnValue({ data: [], isLoading: false, isError: false });
  });

  // AC-4 / AC-5 — open/close
  it("renders nothing when adventureModalOpen is false (AC-4)", () => {
    mockAdventureModalOpen = false;
    render(<AdventureModal />);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("renders the dialog when adventureModalOpen is true (AC-4)", () => {
    mockAdventureModalOpen = true;
    render(<AdventureModal />);
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
  });

  // Variant B — no adventures (AC-5)
  it("shows Variant B when no active adventures (AC-5)", () => {
    mockAdventureModalOpen = true;
    mockUseActiveAdventures.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<AdventureModal />);
    expect(screen.getByRole("heading", { name: /partir à l'aventure/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nouvelle aventure/i })).toBeInTheDocument();
  });

  it("Variant B CTA navigates to /adventure/new and closes modal (AC-5)", () => {
    mockAdventureModalOpen = true;
    mockUseActiveAdventures.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<AdventureModal />);
    fireEvent.click(screen.getByRole("button", { name: /nouvelle aventure/i }));
    expect(mockSetAdventureModalOpen).toHaveBeenCalledWith(false);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/adventure/new" });
  });

  // Variant A — adventure in progress (AC-5)
  it("shows Variant A when active adventure exists (AC-5)", () => {
    mockAdventureModalOpen = true;
    mockUseActiveAdventures.mockReturnValue({
      data: [makeAdventure()],
      isLoading: false,
      isError: false,
    });
    render(<AdventureModal />);
    expect(screen.getByRole("heading", { name: /reprendre une aventure/i })).toBeInTheDocument();
    expect(screen.getByText("La Forêt Maudite")).toBeInTheDocument();
    expect(screen.getByText(/entrée dans la forêt/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reprendre/i })).toBeInTheDocument();
  });

  it("Variant A CTA navigates to /adventure/:id and closes modal (AC-5)", () => {
    mockAdventureModalOpen = true;
    mockUseActiveAdventures.mockReturnValue({
      data: [makeAdventure({ id: "adv-42" })],
      isLoading: false,
      isError: false,
    });
    render(<AdventureModal />);
    fireEvent.click(screen.getByRole("button", { name: /reprendre/i }));
    expect(mockSetAdventureModalOpen).toHaveBeenCalledWith(false);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/adventure/$id",
      params: { id: "adv-42" },
    });
  });

  it("shows most recent adventure when multiple exist (AC-5)", () => {
    mockAdventureModalOpen = true;
    mockUseActiveAdventures.mockReturnValue({
      data: [
        makeAdventure({ id: "adv-old", title: "Vieille Quête", lastPlayedAt: "2025-01-01T00:00:00Z" }),
        makeAdventure({ id: "adv-new", title: "Nouvelle Quête", lastPlayedAt: "2025-06-01T00:00:00Z" }),
      ],
      isLoading: false,
      isError: false,
    });
    render(<AdventureModal />);
    // Only the most recent title should appear as the primary
    expect(screen.getByText("Nouvelle Quête")).toBeInTheDocument();
    // "Voir toutes les aventures" link shown when >1 adventure
    expect(screen.getByText(/voir toutes les aventures/i)).toBeInTheDocument();
  });

  it("does NOT show 'Voir toutes les aventures' with exactly 1 adventure (AC-5)", () => {
    mockAdventureModalOpen = true;
    mockUseActiveAdventures.mockReturnValue({
      data: [makeAdventure()],
      isLoading: false,
      isError: false,
    });
    render(<AdventureModal />);
    expect(screen.queryByText(/voir toutes les aventures/i)).not.toBeInTheDocument();
  });
});
