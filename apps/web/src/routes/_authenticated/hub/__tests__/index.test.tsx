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
vi.mock("@/hooks/useAdventures", () => ({
  useActiveAdventures: () => mockUseActiveAdventures(),
  useCompletedAdventures: () => mockUseCompletedAdventures(),
}));

// Mock sonner to avoid import issues in jsdom
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

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

function makeAdventure(n: number, lastPlayedAt: string): AdventureDTO {
  return {
    id: `adv-${n}`,
    title: `Adventure ${n}`,
    status: "active",
    isGameOver: false,
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

describe("HubPage (Story 4.2)", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseCurrentUser.mockReset();
    mockUseActiveAdventures.mockReset();
    mockUseCompletedAdventures.mockReset();

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
  });

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
      data: [
        {
          id: "c1",
          userId: "u1",
          title: "Completed 1",
          status: "completed",
          lastPlayedAt: "2025-01-01T10:00:00Z",
          completedAt: "2025-01-01T10:00:00Z",
          createdAt: "2025-01-01T00:00:00Z",
        },
      ],
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
});

describe("HubBanner priority (Story 4.3 AC-3)", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseActiveAdventures.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
    mockUseCompletedAdventures.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
  });

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

