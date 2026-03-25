/**
 * IntroSession tests — Story 6.6 Task 8
 *
 * Covers:
 *  - Renders full-screen when visible=true and shows intro text
 *  - Hidden (opacity-0) when visible=false
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { IntroSession } from "@/components/game/IntroSession";

afterEach(cleanup);

describe("IntroSession", () => {
  it("renders intro text when visible=true", () => {
    render(<IntroSession visible={true} />);

    expect(screen.getByText("Il était une fois...")).toBeInTheDocument();
    expect(screen.getByText(/une âme en quête/)).toBeInTheDocument();
  });

  it("is opacity-100 when visible=true", () => {
    const { container } = render(<IntroSession visible={true} />);

    const intro = container.firstChild as HTMLElement;
    expect(intro.className).toContain("opacity-100");
  });

  it("becomes opacity-0 when visible=false", () => {
    const { rerender, container } = render(<IntroSession visible={true} />);
    rerender(<IntroSession visible={false} />);

    const intro = container.firstChild as HTMLElement;
    expect(intro.className).toContain("opacity-0");
  });

  it("does not render when visible starts false", () => {
    render(<IntroSession visible={false} />);

    expect(screen.queryByText("Il était une fois...")).not.toBeInTheDocument();
  });

  it("unmounts after transition ends when visible=false", () => {
    const { rerender, container } = render(<IntroSession visible={true} />);
    rerender(<IntroSession visible={false} />);

    const intro = container.firstChild as HTMLElement;

    act(() => {
      intro.dispatchEvent(new Event("transitionend", { bubbles: true }));
    });

    expect(screen.queryByText("Il était une fois...")).not.toBeInTheDocument();
  });
});
