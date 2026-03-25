/**
 * MilestoneOverlay tests — Story 6.6 Task 8
 *
 * Covers:
 *  - Renders when visible=true and shows milestone name
 *  - Does not render when visible=false (after transition)
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MilestoneOverlay } from "@/components/game/MilestoneOverlay";

afterEach(cleanup);

describe("MilestoneOverlay", () => {
  it("renders with milestone name when visible=true", () => {
    render(<MilestoneOverlay visible={true} milestoneName="La Forêt Maudite" />);

    expect(screen.getByText("✦ La Forêt Maudite ✦")).toBeInTheDocument();
    expect(screen.getByText("Un nouveau chapitre commence...")).toBeInTheDocument();
  });

  it("is visible (opacity-100) when visible=true", () => {
    render(<MilestoneOverlay visible={true} milestoneName="Prologue" />);

    const overlay = screen.getByLabelText("Nouveau chapitre : Prologue");
    expect(overlay.className).toContain("opacity-100");
  });

  it("becomes opacity-0 when visible=false", () => {
    const { rerender } = render(
      <MilestoneOverlay visible={true} milestoneName="Prologue" />,
    );
    rerender(<MilestoneOverlay visible={false} milestoneName="Prologue" />);

    const overlay = screen.getByLabelText("Nouveau chapitre : Prologue");
    expect(overlay.className).toContain("opacity-0");
  });

  it("does not render when visible starts false", () => {
    render(<MilestoneOverlay visible={false} milestoneName={null} />);

    expect(screen.queryByText("Un nouveau chapitre commence...")).not.toBeInTheDocument();
  });

  it("unmounts after transition ends when visible=false", () => {
    const { rerender } = render(
      <MilestoneOverlay visible={true} milestoneName="Prologue" />,
    );
    rerender(<MilestoneOverlay visible={false} milestoneName="Prologue" />);

    const overlay = screen.getByLabelText("Nouveau chapitre : Prologue");

    act(() => {
      overlay.dispatchEvent(new Event("transitionend", { bubbles: true }));
    });

    expect(screen.queryByLabelText("Nouveau chapitre : Prologue")).not.toBeInTheDocument();
  });
});
