import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdventureDTO, AdventureTemplateDTO, UserDTO } from "@jdrai/shared";

// ---------------------------------------------------------------------------
// Hoisted mocks (must be defined before vi.mock calls)
// ---------------------------------------------------------------------------

const mockRouteState = vi.hoisted(() => ({ mode: "custom" as string }));
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  createFileRoute:
    (_path: string) =>
    (opts: unknown): unknown => ({
      ...(opts as object),
      useSearch: () => ({ mode: mockRouteState.mode }),
    }),
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...props }: { to: string; children: ReactNode; [k: string]: unknown }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Hooks mocks
// ---------------------------------------------------------------------------

const mockUseActiveAdventures = vi.hoisted(() => vi.fn());
const mockUseTemplates = vi.hoisted(() => vi.fn());
const mockUseCurrentUser = vi.hoisted(() => vi.fn());
const mockMutateAsync = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAdventures", () => ({
  useActiveAdventures: () => mockUseActiveAdventures(),
  useTemplates: () => mockUseTemplates(),
  useAbandonAdventure: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useCreateAdventure: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// Mock AdventureLoadingScreen to isolate step-machine tests from API logic
// (AdventureLoadingScreen has its own dedicated test suite)
vi.mock("@/components/adventure/AdventureLoadingScreen", () => ({
  AdventureLoadingScreen: ({ onError }: { onError: () => void }) => (
    <div data-testid="loading-screen">
      <button type="button" onClick={onError} aria-label="simuler erreur">
        simuler erreur
      </button>
    </div>
  ),
}));

vi.mock("@/hooks/useUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER: UserDTO = {
  id: "u1",
  email: "test@example.com",
  emailVerified: true,
  username: "Ragnar",
  role: "user",
  onboardingCompleted: true,
  createdAt: "2025-01-01T00:00:00Z",
};

function makeAdventure(n: number): AdventureDTO {
  return {
    id: `adv-${n}`,
    title: `Adventure ${n}`,
    status: "active",
    isGameOver: false,
    isTutorial: false,
    difficulty: "normal",
    estimatedDuration: "medium",
    startedAt: "2025-01-01T00:00:00Z",
    lastPlayedAt: "2025-01-01T00:00:00Z",
    character: {
      id: `char-${n}`,
      name: "Aventurier",
      className: "Aventurier",
      raceName: "Humain",
      stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
      currentHp: 20,
      maxHp: 20,
    },
  };
}

const MOCK_TEMPLATE: AdventureTemplateDTO = {
  id: "tpl-1",
  name: "La Forêt Maudite",
  description: "Une aventure en forêt sombre pleine de dangers",
  genre: "heroic_fantasy",
  difficulty: "normal",
  estimatedDuration: "medium",
};

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { NewAdventurePage } from "../new";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockRouteState.mode = "custom";
});

// ---------------------------------------------------------------------------
// Default hook setup helper
// ---------------------------------------------------------------------------

function setupDefaultHooks() {
  mockUseCurrentUser.mockReturnValue({ data: MOCK_USER });
  mockUseActiveAdventures.mockReturnValue({ data: [], isLoading: false });
  mockUseTemplates.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NewAdventurePage — Route setup (AC-1)", () => {
  beforeEach(() => {
    setupDefaultHooks();
  });

  it("renders page header with back button (AC-1)", () => {
    render(<NewAdventurePage />);
    expect(screen.getByText(/Nouvelle aventure/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retour au hub/i })).toBeInTheDocument();
  });

  it("back button navigates to /hub (AC-1)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /retour au hub/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/hub" });
  });
});

describe("NewAdventurePage — Custom config (AC-2)", () => {
  beforeEach(() => {
    mockRouteState.mode = "custom";
    setupDefaultHooks();
  });

  it("shows DurationSelector and DifficultySlider in custom mode (AC-2)", () => {
    render(<NewAdventurePage />);
    expect(screen.getByText("Courte")).toBeInTheDocument();
    expect(screen.getByText("Moyenne")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("default duration is medium (selected) (AC-2)", () => {
    render(<NewAdventurePage />);
    const medBtn = screen.getByRole("button", { name: /moyenne/i });
    expect(medBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("CTA 'LANCER L'AVENTURE' is visible (AC-2)", () => {
    render(<NewAdventurePage />);
    expect(screen.getByRole("button", { name: /lancer l'aventure/i })).toBeInTheDocument();
  });

  it("clicking CTA transitions to confirmation step (AC-4)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /lancer l'aventure/i }));
    expect(screen.getByText(/Confirmer l'aventure/i)).toBeInTheDocument();
  });
});

describe("NewAdventurePage — Templates mode (AC-3)", () => {
  beforeEach(() => {
    mockRouteState.mode = "templates";
    mockUseCurrentUser.mockReturnValue({ data: MOCK_USER });
    mockUseActiveAdventures.mockReturnValue({ data: [], isLoading: false });
  });

  it("shows skeleton cards while loading (AC-3)", () => {
    mockUseTemplates.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    const { container } = render(<NewAdventurePage />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows error message and retry on fetch error (AC-3)", () => {
    mockUseTemplates.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });
    render(<NewAdventurePage />);
    expect(screen.getByText(/Impossible de charger les scénarios/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /réessayer/i })).toBeInTheDocument();
  });

  it("renders template cards when loaded (AC-3)", () => {
    mockUseTemplates.mockReturnValue({
      data: [MOCK_TEMPLATE],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<NewAdventurePage />);
    expect(screen.getByText("La Forêt Maudite")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choisir/i })).toBeInTheDocument();
  });

  it("CHOISIR on template → transitions to confirmation with template name (AC-3, AC-4)", () => {
    mockUseTemplates.mockReturnValue({
      data: [MOCK_TEMPLATE],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /choisir/i }));
    expect(screen.getByText(/Confirmer l'aventure/i)).toBeInTheDocument();
    expect(screen.getByText("La Forêt Maudite")).toBeInTheDocument();
  });
});

describe("NewAdventurePage — Confirmation screen (AC-4)", () => {
  beforeEach(() => {
    mockRouteState.mode = "custom";
    setupDefaultHooks();
  });

  it("shows Heroic Fantasy, duration, difficulty, character name (AC-4)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /lancer l'aventure/i }));

    expect(screen.getByText("Heroic Fantasy")).toBeInTheDocument();
    expect(screen.getByText(/Moyenne/i)).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByText("Ragnar")).toBeInTheDocument();
  });

  it("'Modifier les paramètres' returns to config step (AC-4)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /lancer l'aventure/i }));
    fireEvent.click(screen.getByText(/Modifier les paramètres/i));
    expect(screen.getByText("Courte")).toBeInTheDocument();
  });

  it("back arrow from confirmation returns to config (AC-4)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /lancer l'aventure/i }));
    // Click the ← header button (first matching button with that aria-label)
    const backBtns = screen.getAllByRole("button", { name: /modifier les paramètres/i });
    fireEvent.click(backBtns[0]!);
    expect(screen.getByText("Courte")).toBeInTheDocument();
  });
});

describe("NewAdventurePage — Random mode (Story 5.3 AC-1, AC-2, AC-6)", () => {
  beforeEach(() => {
    mockRouteState.mode = "random";
    setupDefaultHooks();
  });

  it("starts directly on random-choice step — no config view (AC-1)", () => {
    render(<NewAdventurePage />);
    expect(screen.getByText("Le destin a parlé.")).toBeInTheDocument();
    expect(screen.queryByText("Courte")).not.toBeInTheDocument();
  });

  it("shows both random CTAs (AC-1)", () => {
    render(<NewAdventurePage />);
    expect(screen.getByRole("button", { name: /RÉVÉLER MON DESTIN/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ACCEPTER L'INCONNU/i })).toBeInTheDocument();
  });

  it("RÉVÉLER MON DESTIN → shows random-revealed step with params (AC-2)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /RÉVÉLER MON DESTIN/i }));
    expect(screen.getByText(/Le destin a choisi pour vous/i)).toBeInTheDocument();
    expect(screen.getByText(/Heroic Fantasy/i)).toBeInTheDocument();
    expect(screen.getByText(/Retirer les dés/i)).toBeInTheDocument();
  });

  it("Retirer les dés stays on random-revealed (can be clicked multiple times) (AC-2)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /RÉVÉLER MON DESTIN/i }));
    const reroll = screen.getByText(/Retirer les dés/i);
    fireEvent.click(reroll);
    fireEvent.click(reroll);
    // Still on random-revealed after multiple rerolls
    expect(screen.getByText(/Le destin a choisi pour vous/i)).toBeInTheDocument();
  });

  it("LANCER L'AVENTURE from random-revealed → loading step (AC-6)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /RÉVÉLER MON DESTIN/i }));
    fireEvent.click(screen.getByRole("button", { name: /LANCER L'AVENTURE/i }));
    expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
  });

  it("ACCEPTER L'INCONNU → loading step directly (AC-1)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /ACCEPTER L'INCONNU/i }));
    expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
  });

  it("error from loading → GenerationErrorView (AC-5)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /RÉVÉLER MON DESTIN/i }));
    fireEvent.click(screen.getByRole("button", { name: /LANCER L'AVENTURE/i }));
    fireEvent.click(screen.getByRole("button", { name: /simuler erreur/i }));
    expect(screen.getByText(/Le Maître du Jeu n'a pas pu préparer/i)).toBeInTheDocument();
  });

  it("RÉESSAYER from error → back to loading (AC-5)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /RÉVÉLER MON DESTIN/i }));
    fireEvent.click(screen.getByRole("button", { name: /LANCER L'AVENTURE/i }));
    fireEvent.click(screen.getByRole("button", { name: /simuler erreur/i }));
    fireEvent.click(screen.getByRole("button", { name: /RÉESSAYER/i }));
    expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
  });

  it("Retour à la configuration from error → random-choice (AC-5)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /RÉVÉLER MON DESTIN/i }));
    fireEvent.click(screen.getByRole("button", { name: /LANCER L'AVENTURE/i }));
    fireEvent.click(screen.getByRole("button", { name: /simuler erreur/i }));
    fireEvent.click(screen.getByText(/Retour à la configuration/i));
    // Back to random-choice (not config)
    expect(screen.getByText("Le destin a parlé.")).toBeInTheDocument();
  });
});

describe("NewAdventurePage — Loading step wiring for custom/template path (Story 5.3 AC-6)", () => {
  beforeEach(() => {
    mockRouteState.mode = "custom";
    setupDefaultHooks();
  });

  it("LANCER L'AVENTURE in confirmation → loading step (AC-6)", () => {
    render(<NewAdventurePage />);
    // Step 1: config → confirmation
    fireEvent.click(screen.getByRole("button", { name: /lancer l'aventure/i }));
    expect(screen.getByText(/Confirmer l'aventure/i)).toBeInTheDocument();
    // Step 2: confirmation → loading
    fireEvent.click(screen.getByRole("button", { name: /lancer l'aventure/i }));
    expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
  });

  it("error from loading → GenerationErrorView and Retour à la configuration → config (AC-5, AC-6)", () => {
    render(<NewAdventurePage />);
    fireEvent.click(screen.getByRole("button", { name: /lancer l'aventure/i }));
    fireEvent.click(screen.getByRole("button", { name: /lancer l'aventure/i }));
    fireEvent.click(screen.getByRole("button", { name: /simuler erreur/i }));
    fireEvent.click(screen.getByText(/Retour à la configuration/i));
    // Back to config (custom mode)
    expect(screen.getByText("Courte")).toBeInTheDocument();
  });
});

describe("NewAdventurePage — Limit screen (AC-5)", () => {
  beforeEach(() => {
    mockRouteState.mode = "custom";
    mockUseCurrentUser.mockReturnValue({ data: MOCK_USER });
    mockUseTemplates.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("shows limit banner when active count ≥ 5 (AC-5)", () => {
    mockUseActiveAdventures.mockReturnValue({
      data: [1, 2, 3, 4, 5].map(makeAdventure),
      isLoading: false,
    });
    render(<NewAdventurePage />);
    expect(screen.getByText(/limite de 5 aventures/i)).toBeInTheDocument();
  });

  it("hides config content when at limit (AC-5)", () => {
    mockUseActiveAdventures.mockReturnValue({
      data: [1, 2, 3, 4, 5].map(makeAdventure),
      isLoading: false,
    });
    render(<NewAdventurePage />);
    expect(screen.queryByText("Courte")).not.toBeInTheDocument();
  });

  it("lists active adventures in limit screen (AC-5)", () => {
    mockUseActiveAdventures.mockReturnValue({
      data: [1, 2, 3, 4, 5].map(makeAdventure),
      isLoading: false,
    });
    render(<NewAdventurePage />);
    expect(screen.getByText("Adventure 1")).toBeInTheDocument();
    expect(screen.getByText("Adventure 5")).toBeInTheDocument();
  });

  it("config is shown when active count < 5 (AC-5)", () => {
    mockUseActiveAdventures.mockReturnValue({
      data: [1, 2, 3, 4].map(makeAdventure),
      isLoading: false,
    });
    render(<NewAdventurePage />);
    expect(screen.getByText("Courte")).toBeInTheDocument();
  });

  it("also blocks random mode when active count ≥ 5", () => {
    mockRouteState.mode = "random";
    mockUseActiveAdventures.mockReturnValue({
      data: [1, 2, 3, 4, 5].map(makeAdventure),
      isLoading: false,
    });
    render(<NewAdventurePage />);
    expect(screen.getByText(/limite de 5 aventures/i)).toBeInTheDocument();
    expect(screen.queryByText("Le destin a parlé.")).not.toBeInTheDocument();
  });
});
