/**
 * SummaryCard tests — Story 7.2 Task 11
 *
 * Covers:
 *  - text=null → skeleton
 *  - text=undefined → inline error with Réessayer button
 *  - text=string → renders narrative content
 *  - abandoned state → static text regardless of API data
 *  - label variants per screen state
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SummaryCard } from "@/components/summary/SummaryCard";

afterEach(cleanup);

describe("SummaryCard", () => {
  it("shows skeleton when text is null (polling)", () => {
    render(<SummaryCard text={null} screenState="success" />);

    expect(screen.getByLabelText("Chargement du résumé")).toBeInTheDocument();
  });

  it("shows inline error when text is undefined", () => {
    const onRetry = vi.fn();
    render(<SummaryCard text={undefined} screenState="success" onRetry={onRetry} />);

    expect(screen.getByText(/Le résumé n'a pas pu être généré/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders narrative text when provided", () => {
    render(<SummaryCard text="Tu as triomphé dans une aventure épique." screenState="success" />);

    expect(screen.getByText("Tu as triomphé dans une aventure épique.")).toBeInTheDocument();
  });

  it("renders 'Résumé de l'aventure' label for success state", () => {
    render(<SummaryCard text="Résumé" screenState="success" />);
    expect(screen.getByText("📜 Résumé de l'aventure")).toBeInTheDocument();
  });

  it("renders 'Votre héritage' label for game_over state", () => {
    render(<SummaryCard text="Héritage" screenState="game_over" />);
    expect(screen.getByText("📜 Votre héritage")).toBeInTheDocument();
  });

  it("renders static abandonment text for abandoned state regardless of API data", () => {
    render(<SummaryCard text={null} screenState="abandoned" />);

    expect(screen.getByText(/Vous avez quitté cette aventure avant sa conclusion/)).toBeInTheDocument();
    // Should NOT show skeleton
    expect(screen.queryByLabelText("Chargement du résumé")).not.toBeInTheDocument();
  });
});
