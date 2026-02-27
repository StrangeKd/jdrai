import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RandomChoiceView } from "../RandomChoiceView";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RandomChoiceView (WF-E9-03b)", () => {
  it("renders the title and question", () => {
    render(<RandomChoiceView onReveal={vi.fn()} onAccept={vi.fn()} />);
    expect(screen.getByText("Le destin a parlé.")).toBeInTheDocument();
    expect(screen.getByText(/Souhaitez-vous connaître/i)).toBeInTheDocument();
  });

  it("renders both CTAs", () => {
    render(<RandomChoiceView onReveal={vi.fn()} onAccept={vi.fn()} />);
    expect(screen.getByRole("button", { name: /RÉVÉLER MON DESTIN/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ACCEPTER L'INCONNU/i })).toBeInTheDocument();
  });

  it("calls onReveal when RÉVÉLER MON DESTIN is clicked", () => {
    const onReveal = vi.fn();
    render(<RandomChoiceView onReveal={onReveal} onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /RÉVÉLER MON DESTIN/i }));
    expect(onReveal).toHaveBeenCalledOnce();
  });

  it("calls onAccept when ACCEPTER L'INCONNU is clicked", () => {
    const onAccept = vi.fn();
    render(<RandomChoiceView onReveal={vi.fn()} onAccept={onAccept} />);
    fireEvent.click(screen.getByRole("button", { name: /ACCEPTER L'INCONNU/i }));
    expect(onAccept).toHaveBeenCalledOnce();
  });
});
