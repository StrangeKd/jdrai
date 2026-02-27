import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RandomRevealedView } from "../RandomRevealedView";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RandomRevealedView (WF-E9-03c)", () => {
  it("renders the heading", () => {
    render(
      <RandomRevealedView
        difficulty="normal"
        estimatedDuration="medium"
        onLaunch={vi.fn()}
        onReroll={vi.fn()}
      />,
    );
    expect(screen.getByText(/Le destin a choisi pour vous/i)).toBeInTheDocument();
  });

  it("displays Heroic Fantasy theme", () => {
    render(
      <RandomRevealedView
        difficulty="easy"
        estimatedDuration="short"
        onLaunch={vi.fn()}
        onReroll={vi.fn()}
      />,
    );
    expect(screen.getByText(/Heroic Fantasy/i)).toBeInTheDocument();
  });

  it("displays the duration label", () => {
    render(
      <RandomRevealedView
        difficulty="normal"
        estimatedDuration="long"
        onLaunch={vi.fn()}
        onReroll={vi.fn()}
      />,
    );
    expect(screen.getByText(/Longue/i)).toBeInTheDocument();
  });

  it("displays the difficulty label", () => {
    render(
      <RandomRevealedView
        difficulty="hard"
        estimatedDuration="medium"
        onLaunch={vi.fn()}
        onReroll={vi.fn()}
      />,
    );
    expect(screen.getByText(/Difficile/i)).toBeInTheDocument();
  });

  it("calls onLaunch when LANCER L'AVENTURE is clicked", () => {
    const onLaunch = vi.fn();
    render(
      <RandomRevealedView
        difficulty="normal"
        estimatedDuration="medium"
        onLaunch={onLaunch}
        onReroll={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /LANCER L'AVENTURE/i }));
    expect(onLaunch).toHaveBeenCalledOnce();
  });

  it("calls onReroll when Retirer les dés is clicked", () => {
    const onReroll = vi.fn();
    render(
      <RandomRevealedView
        difficulty="normal"
        estimatedDuration="medium"
        onLaunch={vi.fn()}
        onReroll={onReroll}
      />,
    );
    fireEvent.click(screen.getByText(/Retirer les dés/i));
    expect(onReroll).toHaveBeenCalledOnce();
  });

  it("can call onReroll multiple times", () => {
    const onReroll = vi.fn();
    render(
      <RandomRevealedView
        difficulty="easy"
        estimatedDuration="short"
        onLaunch={vi.fn()}
        onReroll={onReroll}
      />,
    );
    const btn = screen.getByText(/Retirer les dés/i);
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onReroll).toHaveBeenCalledTimes(3);
  });
});
