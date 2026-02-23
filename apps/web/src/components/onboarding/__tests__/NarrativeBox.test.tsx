import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { NarrativeBox } from "../NarrativeBox";

afterEach(cleanup);

describe("NarrativeBox", () => {
  it("renders children content", () => {
    render(<NarrativeBox>Un texte narratif</NarrativeBox>);
    expect(screen.getByText("Un texte narratif")).toBeInTheDocument();
  });

  it("renders the quill icon", () => {
    const { container } = render(<NarrativeBox>text</NarrativeBox>);
    expect(container.textContent).toContain("✒️");
  });
});
