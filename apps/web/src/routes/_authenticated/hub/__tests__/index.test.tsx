import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdventureDTO, UserDTO } from "@jdrai/shared";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useNavigate: () => mockNavigate,
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

import { HubPage } from "../index";

afterEach(() => {
  cleanup();
});

const mockUser: UserDTO = {
  id: "u1",
  email: "test@example.com",
  username: "Ragnar",
  role: "user",
  onboardingCompleted: true,
  createdAt: "2025-01-01T00:00:00Z",
};

function makeAdventure(n: number, lastPlayedAt: string): AdventureDTO {
  return {
    id: `adv-${n}`,
    userId: "u1",
    title: `Adventure ${n}`,
    status: "active",
    currentMilestone: `Milestone ${n}`,
    lastPlayedAt,
    createdAt: "2025-01-01T00:00:00Z",
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

