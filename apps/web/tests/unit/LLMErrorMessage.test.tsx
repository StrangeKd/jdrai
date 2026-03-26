/**
 * LLMErrorMessage tests — Story 6.8 Task 8
 *
 * Covers:
 *  - Not rendered when visible=false
 *  - Renders thematic error text when visible=true
 *  - Calls onRetry when Réessayer button is clicked
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LLMErrorMessage } from "@/components/game/LLMErrorMessage";

afterEach(cleanup);

describe("LLMErrorMessage", () => {
  it("renders nothing when visible=false", () => {
    const { container } = render(<LLMErrorMessage visible={false} onRetry={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders thematic error message when visible=true", () => {
    render(<LLMErrorMessage visible={true} onRetry={vi.fn()} />);
    expect(screen.getByText(/Le MJ a renversé son encrier/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Réessayer/i })).toBeInTheDocument();
  });

  it("calls onRetry when Réessayer button is clicked", () => {
    const onRetry = vi.fn();
    render(<LLMErrorMessage visible={true} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /Réessayer/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
