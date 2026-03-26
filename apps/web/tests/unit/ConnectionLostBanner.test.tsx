/**
 * ConnectionLostBanner tests — Story 6.8 Task 8
 *
 * Covers:
 *  - Not rendered when visible=false
 *  - Renders reconnecting state when visible=true, failed=false
 *  - Renders failure state when visible=true, failed=true
 *  - Calls onRetry when Réessayer button is clicked
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConnectionLostBanner } from "@/components/game/ConnectionLostBanner";

afterEach(cleanup);

describe("ConnectionLostBanner", () => {
  it("renders nothing when visible=false", () => {
    const { container } = render(
      <ConnectionLostBanner visible={false} failed={false} onRetry={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders reconnecting message when visible=true and failed=false", () => {
    render(<ConnectionLostBanner visible={true} failed={false} onRetry={vi.fn()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Connexion perdue/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders failure state with Réessayer button when visible=true and failed=true", () => {
    render(<ConnectionLostBanner visible={true} failed={true} onRetry={vi.fn()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Connexion impossible/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Réessayer/i })).toBeInTheDocument();
  });

  it("calls onRetry when Réessayer button is clicked", () => {
    const onRetry = vi.fn();
    render(<ConnectionLostBanner visible={true} failed={true} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /Réessayer/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
