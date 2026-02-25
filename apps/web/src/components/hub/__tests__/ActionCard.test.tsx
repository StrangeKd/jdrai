import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionCard, ActionCardSkeleton } from "../ActionCard";

afterEach(cleanup);

describe("ActionCard (AC-4)", () => {
  it("renders icon, label and calls onClick when not disabled (AC-4)", () => {
    const onClick = vi.fn();
    render(
      <ActionCard icon="⚔️" label="Personnalisée" description="Desc" onClick={onClick} />,
    );
    expect(screen.getByText("⚔️")).toBeInTheDocument();
    expect(screen.getByText("Personnalisée")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /personnalisée/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled=true (AC-4)", () => {
    const onClick = vi.fn();
    render(
      <ActionCard
        icon="⚔️"
        label="Personnalisée"
        description="Desc"
        disabled={true}
        onClick={onClick}
      />,
    );
    const btn = screen.getByRole("button", { name: /personnalisée/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("disabled button has cursor-not-allowed class (AC-4)", () => {
    render(
      <ActionCard
        icon="📋"
        label="Scénario"
        description="Desc"
        disabled={true}
        onClick={vi.fn()}
      />,
    );
    const btn = screen.getByRole("button", { name: /scénario/i });
    expect(btn.className).toContain("cursor-not-allowed");
  });

  it("disabled button shows limit tooltip title (AC-4)", () => {
    render(
      <ActionCard
        icon="🎲"
        label="Aléatoire"
        description="Desc"
        disabled={true}
        onClick={vi.fn()}
      />,
    );
    const btn = screen.getByRole("button", { name: /aléatoire/i });
    expect(btn.getAttribute("title")).toMatch(/limite de 5/i);
  });
});

describe("ActionCardSkeleton (AC-7)", () => {
  it("renders 3 skeleton squares with pulse", () => {
    const { container } = render(<ActionCardSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(container.querySelectorAll(".rounded-xl")).toHaveLength(3);
  });
});
