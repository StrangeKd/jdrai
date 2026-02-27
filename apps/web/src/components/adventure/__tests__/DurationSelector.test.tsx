import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DurationSelector } from "../DurationSelector";

afterEach(() => cleanup());

describe("DurationSelector (Story 5.2 AC-2)", () => {
  it("renders 3 duration options (short, medium, long)", () => {
    render(<DurationSelector value="medium" onChange={vi.fn()} />);
    expect(screen.getByText("Courte")).toBeInTheDocument();
    expect(screen.getByText("Moyenne")).toBeInTheDocument();
    expect(screen.getByText("Longue")).toBeInTheDocument();
  });

  it("renders time estimates for each option", () => {
    render(<DurationSelector value="medium" onChange={vi.fn()} />);
    expect(screen.getByText("~20 min")).toBeInTheDocument();
    expect(screen.getByText("~45 min")).toBeInTheDocument();
    expect(screen.getByText("~1h+")).toBeInTheDocument();
  });

  it("marks selected option with aria-pressed=true", () => {
    render(<DurationSelector value="medium" onChange={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /moyenne/i });
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("unselected buttons have aria-pressed=false", () => {
    render(<DurationSelector value="medium" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /courte/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /longue/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onChange with correct value when clicked", () => {
    const onChange = vi.fn();
    render(<DurationSelector value="medium" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /courte/i }));
    expect(onChange).toHaveBeenCalledWith("short");
  });

  it("selected option has accent styling class", () => {
    render(<DurationSelector value="short" onChange={vi.fn()} />);
    const shortBtn = screen.getByRole("button", { name: /courte/i });
    expect(shortBtn.className).toMatch(/amber/);
  });
});
