import { cleanup,fireEvent, render, screen } from "@testing-library/react";
import { afterEach,beforeEach, describe, expect, it, vi } from "vitest";

// Mock TanStack Router hooks — route component uses useNavigate
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useNavigate: () => mockNavigate,
}));

// Import after mock is set up — WelcomePage is exported for testability
import { WelcomePage } from "../welcome";

afterEach(cleanup);

describe("WelcomePage (E5 — /onboarding/welcome)", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders the welcome headline (AC-3)", () => {
    render(<WelcomePage />);
    expect(
      screen.getByRole("heading", { name: /votre aventure commence ici/i }),
    ).toBeInTheDocument();
  });

  it("renders the body text without technical jargon (AC-3)", () => {
    render(<WelcomePage />);
    expect(
      screen.getByText(/un maître du jeu propulsé par l['']ia/i),
    ).toBeInTheDocument();
  });

  it("renders the ENTRER CTA button (AC-4)", () => {
    render(<WelcomePage />);
    expect(screen.getByRole("button", { name: /entrer/i })).toBeInTheDocument();
  });

  it("navigates to /onboarding/profile-setup on CTA click (AC-4)", () => {
    render(<WelcomePage />);
    fireEvent.click(screen.getByRole("button", { name: /entrer/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/onboarding/profile-setup" });
  });

  it("renders WelcomeHero with JDRAI branding (AC-2)", () => {
    render(<WelcomePage />);
    expect(screen.getByText("JDRAI")).toBeInTheDocument();
  });

  it("full-screen dark background class present on root element (AC-5)", () => {
    const { container } = render(<WelcomePage />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("min-h-screen");
    expect(root.className).toContain("bg-stone-950");
  });

  it("inner card respects max-width constraint for desktop centering (AC-6)", () => {
    const { container } = render(<WelcomePage />);
    const card = container.querySelector(".max-w-\\[480px\\]");
    expect(card).toBeInTheDocument();
  });
});
