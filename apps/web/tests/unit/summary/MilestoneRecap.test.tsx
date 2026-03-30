/**
 * MilestoneRecap tests — Story 7.2 Task 11
 *
 * Covers:
 *  - Success: renders all milestones
 *  - Game Over / Abandoned: renders only completed milestones (no spoil)
 *  - Loading: renders skeleton rows
 *  - Empty state: "Aucun jalon atteint."
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { MilestoneDTO } from "@jdrai/shared";

import { MilestoneRecap } from "@/components/summary/MilestoneRecap";

afterEach(cleanup);

const milestones: MilestoneDTO[] = [
  { id: "m1", name: "Prologue", sortOrder: 1, status: "completed" },
  { id: "m2", name: "La Forêt Maudite", sortOrder: 2, status: "completed" },
  { id: "m3", name: "Le Boss Final", sortOrder: 3, status: "active" },
];

describe("MilestoneRecap", () => {
  it("renders all milestones in success state", () => {
    render(<MilestoneRecap milestones={milestones} isLoading={false} screenState="success" />);

    expect(screen.getByText("Prologue")).toBeInTheDocument();
    expect(screen.getByText("La Forêt Maudite")).toBeInTheDocument();
    expect(screen.getByText("Le Boss Final")).toBeInTheDocument();
  });

  it("renders only completed milestones in game_over state (no spoil)", () => {
    render(<MilestoneRecap milestones={milestones} isLoading={false} screenState="game_over" />);

    expect(screen.getByText("Prologue")).toBeInTheDocument();
    expect(screen.getByText("La Forêt Maudite")).toBeInTheDocument();
    expect(screen.queryByText("Le Boss Final")).not.toBeInTheDocument();
  });

  it("renders only completed milestones in abandoned state (no spoil)", () => {
    render(<MilestoneRecap milestones={milestones} isLoading={false} screenState="abandoned" />);

    expect(screen.getByText("Prologue")).toBeInTheDocument();
    expect(screen.getByText("La Forêt Maudite")).toBeInTheDocument();
    expect(screen.queryByText("Le Boss Final")).not.toBeInTheDocument();
  });

  it("renders skeleton rows while loading", () => {
    render(<MilestoneRecap milestones={undefined} isLoading={true} screenState="success" />);

    const loading = screen.getByLabelText("Chargement des jalons");
    expect(loading).toBeInTheDocument();
    expect(loading.children).toHaveLength(3);
  });

  it("renders empty state when no milestones match filter", () => {
    const pending: MilestoneDTO[] = [
      { id: "m1", name: "Prologue", sortOrder: 1, status: "pending" },
    ];
    render(<MilestoneRecap milestones={pending} isLoading={false} screenState="game_over" />);

    expect(screen.getByText("Aucun jalon atteint.")).toBeInTheDocument();
  });

  it("renders checkmarks next to each milestone", () => {
    render(<MilestoneRecap milestones={milestones.slice(0, 2)} isLoading={false} screenState="success" />);

    const checkmarks = screen.getAllByText("✓");
    expect(checkmarks).toHaveLength(2);
  });
});
