/**
 * IntroSession tests — Story 6.6 Task 8
 *
 * Covers:
 *  - Renders full-screen when visible=true and shows intro text
 *  - Hidden (opacity-0) when visible=false
 *  - Skip button appears when isClickable=true and visible=true
 *  - Clicking the overlay or button calls onDismiss when isClickable
 *  - No dismiss when not isClickable
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IntroSession } from "@/components/game/IntroSession";

afterEach(cleanup);

const noop = () => {};

describe("IntroSession", () => {
  it("renders intro text when visible=true", () => {
    render(<IntroSession visible={true} isClickable={false} onDismiss={noop} />);

    expect(screen.getByText("Il était une fois")).toBeInTheDocument();
    expect(screen.getByText(/une âme en quête/)).toBeInTheDocument();
  });

  it("is opacity-100 when visible=true", () => {
    const { container } = render(<IntroSession visible={true} isClickable={false} onDismiss={noop} />);

    const intro = container.firstChild as HTMLElement;
    expect(intro.className).toContain("opacity-100");
  });

  it("becomes opacity-0 when visible=false", () => {
    const { rerender, container } = render(<IntroSession visible={true} isClickable={false} onDismiss={noop} />);
    rerender(<IntroSession visible={false} isClickable={false} onDismiss={noop} />);

    const intro = container.firstChild as HTMLElement;
    expect(intro.className).toContain("opacity-0");
  });

  it("does not render when visible starts false", () => {
    render(<IntroSession visible={false} isClickable={false} onDismiss={noop} />);

    expect(screen.queryByText("Il était une fois...")).not.toBeInTheDocument();
  });

  it("unmounts after transition ends when visible=false", () => {
    const { rerender, container } = render(<IntroSession visible={true} isClickable={false} onDismiss={noop} />);
    rerender(<IntroSession visible={false} isClickable={false} onDismiss={noop} />);

    const intro = container.firstChild as HTMLElement;

    act(() => {
      intro.dispatchEvent(new Event("transitionend", { bubbles: true }));
    });

    expect(screen.queryByText("Il était une fois...")).not.toBeInTheDocument();
  });

  it("shows skip button when isClickable=true and visible=true", () => {
    render(<IntroSession visible={true} isClickable={true} onDismiss={noop} />);

    expect(screen.getByRole("button", { name: "Passer l'introduction" })).toBeInTheDocument();
  });

  it("does not show skip button when isClickable=false", () => {
    render(<IntroSession visible={true} isClickable={false} onDismiss={noop} />);

    expect(screen.queryByRole("button", { name: "Passer l'introduction" })).not.toBeInTheDocument();
  });

  it("calls onDismiss when overlay is clicked and isClickable=true", () => {
    const onDismiss = vi.fn();
    const { container } = render(<IntroSession visible={true} isClickable={true} onDismiss={onDismiss} />);

    fireEvent.click(container.firstChild as HTMLElement);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when skip button is clicked", () => {
    const onDismiss = vi.fn();
    render(<IntroSession visible={true} isClickable={true} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: "Passer l'introduction" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not call onDismiss when overlay is clicked and isClickable=false", () => {
    const onDismiss = vi.fn();
    const { container } = render(<IntroSession visible={true} isClickable={false} onDismiss={onDismiss} />);

    fireEvent.click(container.firstChild as HTMLElement);

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
