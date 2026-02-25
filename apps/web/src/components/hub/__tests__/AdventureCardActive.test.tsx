import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdventureDTO } from "@jdrai/shared";

import { AdventureCardActive, AdventureCardActiveSkeleton } from "../AdventureCardActive";

// formatRelativeTime depends on Date.now() — freeze time
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-01T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const activeAdventure: AdventureDTO = {
  id: "adv-1",
  userId: "u1",
  title: "La Crypte des Ombres",
  status: "active",
  currentMilestone: "Entrée dans la crypte",
  lastPlayedAt: "2025-01-01T10:00:00Z", // 2h ago
  createdAt: "2024-12-01T00:00:00Z",
};

describe("AdventureCardActive (AC-3)", () => {
  it("renders adventure title (AC-3)", () => {
    render(<AdventureCardActive adventure={activeAdventure} onResume={vi.fn()} />);
    expect(screen.getByText("La Crypte des Ombres")).toBeInTheDocument();
  });

  it("renders milestone name without number (AC-3)", () => {
    render(<AdventureCardActive adventure={activeAdventure} onResume={vi.fn()} />);
    expect(screen.getByText(/Entrée dans la crypte/)).toBeInTheDocument();
    expect(screen.queryByText(/\/\d/)).not.toBeInTheDocument();
  });

  it("omits milestone line when currentMilestone is absent (AC-3)", () => {
    const { currentMilestone: _omit, ...adventureNoMilestone } = activeAdventure;
    render(<AdventureCardActive adventure={adventureNoMilestone} onResume={vi.fn()} />);
    expect(screen.queryByText(/🏴/)).not.toBeInTheDocument();
  });

  it("shows relative save time (AC-3)", () => {
    render(<AdventureCardActive adventure={activeAdventure} onResume={vi.fn()} />);
    expect(screen.getByText(/il y a 2h/)).toBeInTheDocument();
  });

  it("calls onResume when REPRENDRE is clicked (AC-3)", () => {
    const onResume = vi.fn();
    render(<AdventureCardActive adventure={activeAdventure} onResume={onResume} />);
    fireEvent.click(screen.getByRole("button", { name: /reprendre/i }));
    expect(onResume).toHaveBeenCalledOnce();
  });
});

describe("AdventureCardActiveSkeleton (AC-7)", () => {
  it("renders skeleton with pulse animation", () => {
    const { container } = render(<AdventureCardActiveSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
