/**
 * StreamingText tests — AC: #3
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StreamingText } from "../StreamingText";

describe("StreamingText", () => {
  it("renders text content", () => {
    render(<StreamingText text="Vous entrez dans la forêt." active={false} />);
    expect(screen.getByText(/Vous entrez dans la forêt/)).toBeInTheDocument();
  });

  it("shows blinking cursor when active=true", () => {
    const { container } = render(<StreamingText text="Streaming..." active={true} />);
    // Cursor is a span with aria-hidden and animate-pulse
    const cursor = container.querySelector('[aria-hidden="true"]');
    expect(cursor).toBeInTheDocument();
    expect(cursor).toHaveClass("animate-pulse");
  });

  it("hides cursor when active=false", () => {
    const { container } = render(<StreamingText text="Done text" active={false} />);
    const cursor = container.querySelector('[aria-hidden="true"]');
    expect(cursor).not.toBeInTheDocument();
  });

  it("renders empty text without error", () => {
    const { container } = render(<StreamingText text="" active={true} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
