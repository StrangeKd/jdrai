import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StepIndicator } from "../StepIndicator";

afterEach(cleanup);

describe("StepIndicator", () => {
  it("renders 2 dots by default", () => {
    const { container } = render(<StepIndicator currentStep={1} />);
    const dots = container.querySelectorAll(".rounded-full");
    expect(dots.length).toBe(2);
  });

  it("step 1: first dot is amber, second is stone (● ○)", () => {
    const { container } = render(<StepIndicator currentStep={1} />);
    const dots = container.querySelectorAll(".rounded-full");
    expect(dots[0]).toHaveClass("bg-amber-400");
    expect(dots[1]).toHaveClass("bg-stone-600");
  });

  it("step 2: first dot is stone, second is amber (○ ●)", () => {
    const { container } = render(<StepIndicator currentStep={2} />);
    const dots = container.querySelectorAll(".rounded-full");
    expect(dots[0]).toHaveClass("bg-stone-600");
    expect(dots[1]).toHaveClass("bg-amber-400");
  });

  it("has accessible aria-label", () => {
    render(<StepIndicator currentStep={1} />);
    expect(screen.getByLabelText(/étape 1 sur 2/i)).toBeInTheDocument();
  });
});
