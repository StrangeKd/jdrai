import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: unknown;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

import { ProfileIncompleteBanner } from "../ProfileIncompleteBanner";

afterEach(cleanup);

describe("ProfileIncompleteBanner (AC-2, AC-4)", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders banner with correct text (AC-2)", () => {
    render(<ProfileIncompleteBanner />);
    expect(screen.getByText(/Complétez votre profil/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
  });

  it("renders a link to /onboarding/profile-setup (AC-2)", () => {
    render(<ProfileIncompleteBanner />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/onboarding/profile-setup");
  });

  it("dismiss hides the banner without navigating (AC-4)", () => {
    render(<ProfileIncompleteBanner />);
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.queryByText(/Complétez votre profil/i)).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
