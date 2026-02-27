import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GenerationErrorView } from "../GenerationErrorView";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GenerationErrorView (WF-E9-05)", () => {
  it("renders the error message", () => {
    render(<GenerationErrorView onRetry={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText(/Le Maître du Jeu n'a pas pu préparer/i)).toBeInTheDocument();
  });

  it("renders RÉESSAYER and back link", () => {
    render(<GenerationErrorView onRetry={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole("button", { name: /RÉESSAYER/i })).toBeInTheDocument();
    expect(screen.getByText(/Retour à la configuration/i)).toBeInTheDocument();
  });

  it("calls onRetry when RÉESSAYER is clicked", () => {
    const onRetry = vi.fn();
    render(<GenerationErrorView onRetry={onRetry} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /RÉESSAYER/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("calls onBack when Retour à la configuration is clicked", () => {
    const onBack = vi.fn();
    render(<GenerationErrorView onRetry={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByText(/Retour à la configuration/i));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("does not display the raw API error message (immersive French message only)", () => {
    render(<GenerationErrorView onRetry={vi.fn()} onBack={vi.fn()} />);
    // No technical error codes or messages should be visible
    expect(screen.queryByText(/INTERNAL_ERROR/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/500/i)).not.toBeInTheDocument();
  });
});
