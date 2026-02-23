import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SkipButton } from "../SkipButton";

afterEach(cleanup);

describe("SkipButton", () => {
  it("renders children label", () => {
    render(<SkipButton onClick={vi.fn()}>Passer et aller au Hub</SkipButton>);
    expect(screen.getByText("Passer et aller au Hub")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<SkipButton onClick={handleClick}>Passer</SkipButton>);
    fireEvent.click(screen.getByText("Passer"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as a button element", () => {
    render(<SkipButton onClick={vi.fn()}>Passer</SkipButton>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
