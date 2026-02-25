import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EmptyState } from "../EmptyState";

afterEach(cleanup);

describe("EmptyState (AC-6)", () => {
  it("renders thematic icon and static text (AC-6)", () => {
    render(<EmptyState onLaunch={vi.fn()} onTemplate={vi.fn()} />);
    expect(screen.getByText("✒️")).toBeInTheDocument();
    expect(screen.getByText(/c'est trop calme/i)).toBeInTheDocument();
    expect(screen.getByText(/et si on partait/i)).toBeInTheDocument();
  });

  it("renders primary CTA button (AC-6)", () => {
    render(<EmptyState onLaunch={vi.fn()} onTemplate={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /lancer ma première aventure/i }),
    ).toBeInTheDocument();
  });

  it("calls onLaunch when primary CTA clicked (AC-6)", () => {
    const onLaunch = vi.fn();
    render(<EmptyState onLaunch={onLaunch} onTemplate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /lancer ma première aventure/i }));
    expect(onLaunch).toHaveBeenCalledOnce();
  });

  it("renders secondary scenario link (AC-6)", () => {
    render(<EmptyState onLaunch={vi.fn()} onTemplate={vi.fn()} />);
    expect(screen.getByText(/ou choisir un scénario/i)).toBeInTheDocument();
  });

  it("calls onTemplate when secondary link clicked (AC-6)", () => {
    const onTemplate = vi.fn();
    render(<EmptyState onLaunch={vi.fn()} onTemplate={onTemplate} />);
    fireEvent.click(screen.getByText(/ou choisir un scénario/i));
    expect(onTemplate).toHaveBeenCalledOnce();
  });
});
