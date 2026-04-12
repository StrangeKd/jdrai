import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdventureDTO, UserDTO } from "@jdrai/shared";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useNavigate: () => mockNavigate,
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const mockUseCurrentUser = vi.fn();
vi.mock("@/hooks/useUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

const mockUseActiveAdventures = vi.fn();
const mockUseCompletedAdventures = vi.fn();
const mockUseAbandonedAdventures = vi.fn();
vi.mock("@/hooks/useAdventures", () => ({
  useActiveAdventures: () => mockUseActiveAdventures(),
  useCompletedAdventures: () => mockUseCompletedAdventures(),
  useAbandonedAdventures: () => mockUseAbandonedAdventures(),
}));

// Mock AbandonModal to avoid deep rendering complexity in Hub tests
vi.mock("@/components/adventure/AbandonModal", () => ({
  AbandonModal: ({ adventure, onClose }: { adventure: AdventureDTO | null; onClose: () => void }) =>
    adventure ? (
      <div data-testid="abandon-modal">
        <span>{adventure.title}</span>
        <button onClick={onClose}>close-modal</button>
      </div>
    ) : null,
}));

// Mock sonner to avoid import issues in jsdom
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

// Mock react-query — useQuery for metaCharacterQuery (Story 8.2) returns null by default
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null, isLoading: false }),
}));

// Mock authClient for EmailVerificationBanner
vi.mock("@/lib/auth-client", () => ({
  authClient: { sendVerificationEmail: vi.fn().mockResolvedValue({ data: null, error: null }) },
}));

import { HubPage } from "../index";

afterEach(() => {
  cleanup();
});

const mockUser: UserDTO = {
  id: "u1",
  email: "test@example.com",
  emailVerified: true,
  username: "Ragnar",
  role: "user",
  onboardingCompleted: true,
  createdAt: "2025-01-01T00:00:00Z",
};

function makeAdventure(
  n: number,
  lastPlayedAt: string,
  status: "active" | "completed" | "abandoned" = "active",
): AdventureDTO {
  return {
    id: `adv-${n}`,
    title: `Adventure ${n}`,
    status,
    isGameOver: false,
    isTutorial: false,
    difficulty: "normal",
    estimatedDuration: "medium",
    startedAt: "2025-01-01T00:00:00Z",
    currentMilestone: `Milestone ${n}`,
    lastPlayedAt,
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

const defaultMocks = () => {
  mockNavigate.mockClear();
  mockUseCurrentUser.mockReset();
  mockUseActiveAdventures.mockReset();
  mockUseCompletedAdventures.mockReset();
  mockUseAbandonedAdventures.mockReset();

  mockUseCurrentUser.mockReturnValue({
    data: mockUser,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
  mockUseActiveAdventures.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
  mockUseCompletedAdventures.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
  mockUseAbandonedAdventures.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
};

describe("HubPage (Story 4.2)", () => {
  beforeEach(defaultMocks);

  it("renders ActionCards in a 3-column grid (AC-4)", () => {
    const { container } = render(<HubPage />);
    expect(container.querySelector(".grid.grid-cols-3.gap-3")).toBeInTheDocument();
  });

  it("shows at most 5 active adventures (AC-3)", () => {
    mockUseActiveAdventures.mockReturnValue({
      data: [
        makeAdventure(1, "2025-01-01T10:00:00Z"),
        makeAdventure(2, "2025-01-01T11:00:00Z"),
        makeAdventure(3, "2025-01-01T09:00:00Z"),
        makeAdventure(4, "2025-01-01T08:00:00Z"),
        makeAdventure(5, "2025-01-01T07:00:00Z"),
        makeAdventure(6, "2025-01-01T06:00:00Z"),
        makeAdventure(7, "2025-01-01T05:00:00Z"),
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<HubPage />);
    const titles = screen.getAllByText(/Adventure \d/);
    expect(titles).toHaveLength(5);
  });

  it("navigates when clicking 'Tout >' (AC-5)", () => {
    mockUseCompletedAdventures.mockReturnValue({
      data: [makeAdventure(1, "2025-01-01T10:00:00Z", "completed")],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<HubPage />);
    fireEvent.click(screen.getByRole("button", { name: /tout/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/hub" });
  });

  it("shows a history error state when completed adventures query fails (AC-8)", () => {
    const refetchCompleted = vi.fn();
    mockUseCompletedAdventures.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch: refetchCompleted,
    });

    render(<HubPage />);
    expect(screen.getByText(/impossible de charger votre historique/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /réessayer/i }));
    expect(refetchCompleted).toHaveBeenCalledOnce();
  });

  it("shows a history error state when abandoned adventures query fails", () => {
    const refetchAbandoned = vi.fn();
    mockUseAbandonedAdventures.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch: refetchAbandoned,
    });

    render(<HubPage />);
    expect(screen.getByText(/impossible de charger votre historique/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /réessayer/i }));
    expect(refetchAbandoned).toHaveBeenCalledOnce();
  });
});

describe("HubPage — Historique merged (Story 7.3 AC-3, AC-4)", () => {
  beforeEach(defaultMocks);

  it("shows history section label 'Historique' (AC-3)", () => {
    mockUseCompletedAdventures.mockReturnValue({
      data: [makeAdventure(1, "2025-01-01T10:00:00Z", "completed")],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<HubPage />);
    expect(screen.getByText(/Historique/i)).toBeInTheDocument();
  });

  it("merges completed and abandoned adventures in history section (AC-3)", () => {
    mockUseCompletedAdventures.mockReturnValue({
      data: [makeAdventure(1, "2025-01-01T10:00:00Z", "completed")],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseAbandonedAdventures.mockReturnValue({
      data: [makeAdventure(2, "2025-01-01T09:00:00Z", "abandoned")],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<HubPage />);
    expect(screen.getByText("Adventure 1")).toBeInTheDocument();
    expect(screen.getByText("Adventure 2")).toBeInTheDocument();
  });

  it("shows history section when only abandoned adventures exist (AC-3)", () => {
    mockUseAbandonedAdventures.mockReturnValue({
      data: [makeAdventure(3, "2025-01-01T08:00:00Z", "abandoned")],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<HubPage />);
    expect(screen.getByText("Adventure 3")).toBeInTheDocument();
  });

  it("sorts history by lastPlayedAt DESC (AC-3)", () => {
    mockUseCompletedAdventures.mockReturnValue({
      data: [makeAdventure(1, "2025-01-01T08:00:00Z", "completed")],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseAbandonedAdventures.mockReturnValue({
      data: [makeAdventure(2, "2025-01-01T10:00:00Z", "abandoned")],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<HubPage />);
    const cards = screen.getAllByRole("button", { name: /Adventure/i });
    // Adventure 2 is more recent (10h), should appear before Adventure 1 (8h)
    expect(cards[0]).toHaveTextContent("Adventure 2");
    expect(cards[1]).toHaveTextContent("Adventure 1");
  });

  it("hides history section when both completed and abandoned are empty", () => {
    render(<HubPage />);
    expect(screen.queryByText(/Historique/i)).not.toBeInTheDocument();
  });
});

describe("HubPage — AbandonModal integration (Story 7.3 AC-2)", () => {
  beforeEach(defaultMocks);

  it("does not show AbandonModal on initial render", () => {
    mockUseActiveAdventures.mockReturnValue({
      data: [makeAdventure(1, "2025-01-01T10:00:00Z")],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<HubPage />);
    expect(screen.queryByTestId("abandon-modal")).not.toBeInTheDocument();
  });
});

describe("HubBanner priority (Story 4.3 AC-3)", () => {
  beforeEach(defaultMocks);

  it("shows EmailVerificationBanner when email unverified (AC-3)", () => {
    mockUseCurrentUser.mockReturnValue({
      data: { ...mockUser, username: "Ragnar", emailVerified: false },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<HubPage />);
    expect(screen.getByText(/Vérifiez votre email/i)).toBeInTheDocument();
  });

  it("shows no banner when email verified (AC-3)", () => {
    mockUseCurrentUser.mockReturnValue({
      data: { ...mockUser, username: "Ragnar", emailVerified: true },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<HubPage />);
    expect(screen.queryByText(/Vérifiez votre email/i)).not.toBeInTheDocument();
  });
});
