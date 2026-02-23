import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WelcomeHero } from "../WelcomeHero";

afterEach(cleanup);

describe("WelcomeHero", () => {
  it("renders the JDRAI brand name", () => {
    render(<WelcomeHero />);
    expect(screen.getByText("JDRAI")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<WelcomeHero />);
    expect(screen.getAllByText("Jeu de Rôle IA").length).toBeGreaterThan(0);
  });

  it("accepts an optional className prop", () => {
    const { container } = render(<WelcomeHero className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
