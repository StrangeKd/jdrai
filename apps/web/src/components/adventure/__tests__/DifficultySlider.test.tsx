import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DifficultySlider } from "../DifficultySlider";

afterEach(() => cleanup());

describe("DifficultySlider (Story 5.2 AC-2)", () => {
  it("renders extreme labels Facile and Cauchemar", () => {
    render(<DifficultySlider value="normal" onChange={vi.fn()} />);
    expect(screen.getByText("Facile")).toBeInTheDocument();
    expect(screen.getByText("Cauchemar")).toBeInTheDocument();
  });

  it("shows current cran label centered above slider (Normal by default)", () => {
    render(<DifficultySlider value="normal" onChange={vi.fn()} />);
    // The centered label is in a <p> tag (not the extreme labels)
    const labels = screen.getAllByText("Normal");
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it("shows correct description for Normal", () => {
    render(<DifficultySlider value="normal" onChange={vi.fn()} />);
    expect(
      screen.getByText(/Équilibre narration et défi/i),
    ).toBeInTheDocument();
  });

  it("shows correct description for easy", () => {
    render(<DifficultySlider value="easy" onChange={vi.fn()} />);
    expect(screen.getByText(/L'histoire avant le défi/i)).toBeInTheDocument();
  });

  it("shows correct description for nightmare", () => {
    render(<DifficultySlider value="nightmare" onChange={vi.fn()} />);
    expect(screen.getByText(/Survie narrative/i)).toBeInTheDocument();
  });

  it("renders a slider input with min=1, max=4, step=1", () => {
    render(<DifficultySlider value="normal" onChange={vi.fn()} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuemin", "1");
    expect(slider).toHaveAttribute("aria-valuemax", "4");
  });
});
