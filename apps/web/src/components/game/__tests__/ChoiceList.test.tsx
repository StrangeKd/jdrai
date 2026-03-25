/**
 * ChoiceList tests — AC: #6, #8
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SuggestedAction } from "@jdrai/shared";

import { ChoiceList } from "../ChoiceList";

afterEach(cleanup);

const choices: SuggestedAction[] = [
  { id: "c1", label: "Attaquer le garde", type: "suggested" },
  { id: "c2", label: "Fuir par la porte", type: "suggested" },
  { id: "c3", label: "Négocier un passage", type: "suggested" },
];

describe("ChoiceList", () => {
  it("renders all provided choices", () => {
    render(<ChoiceList choices={choices} disabled={false} onSelect={vi.fn()} />);
    expect(screen.getByText("Attaquer le garde")).toBeInTheDocument();
    expect(screen.getByText("Fuir par la porte")).toBeInTheDocument();
    expect(screen.getByText("Négocier un passage")).toBeInTheDocument();
  });

  it("renders choice index prefix (1., 2., 3.)", () => {
    render(<ChoiceList choices={choices} disabled={false} onSelect={vi.fn()} />);
    const prefixes = screen.getAllByText(/^\d\.$/, { exact: true });
    expect(prefixes).toHaveLength(3);
    expect(prefixes[0]).toHaveTextContent("1.");
    expect(prefixes[1]).toHaveTextContent("2.");
    expect(prefixes[2]).toHaveTextContent("3.");
  });

  it("calls onSelect with the correct choice when clicked", () => {
    const onSelect = vi.fn();
    render(<ChoiceList choices={choices} disabled={false} onSelect={onSelect} />);
    // Click the button containing "Fuir par la porte"
    fireEvent.click(screen.getByRole("button", { name: /fuir par la porte/i }));
    expect(onSelect).toHaveBeenCalledWith(choices[1]);
  });

  it("does not fire onSelect when disabled (buttons are disabled)", () => {
    const onSelect = vi.fn();
    render(<ChoiceList choices={choices} disabled={true} onSelect={onSelect} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it("renders nothing when choices is empty", () => {
    const { container } = render(<ChoiceList choices={[]} disabled={false} onSelect={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
