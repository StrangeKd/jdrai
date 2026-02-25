import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock TanStack Router
let mockPathname = "/hub";
vi.mock("@tanstack/react-router", () => ({
  useRouterState: () => ({ location: { pathname: mockPathname } }),
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

// Mock UIStore
const mockSetAdventureModalOpen = vi.fn();
vi.mock("@/stores/ui.store", () => ({
  useUIStore: (selector: (s: { setAdventureModalOpen: typeof mockSetAdventureModalOpen }) => unknown) =>
    selector({ setAdventureModalOpen: mockSetAdventureModalOpen }),
}));

import { BottomTabBar } from "../BottomTabBar";

afterEach(cleanup);

describe("BottomTabBar (AC-3)", () => {
  beforeEach(() => {
    mockPathname = "/hub";
    mockSetAdventureModalOpen.mockClear();
  });

  it("renders Hub link (AC-3)", () => {
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: /hub/i })).toBeInTheDocument();
  });

  it("Hub tab is active (amber) when on /hub (AC-3)", () => {
    mockPathname = "/hub";
    render(<BottomTabBar />);
    const hubLink = screen.getByRole("link", { name: /hub/i });
    expect(hubLink.className).toContain("text-amber-400");
  });

  it("Hub tab is inactive when not on /hub (AC-3)", () => {
    mockPathname = "/settings";
    render(<BottomTabBar />);
    const hubLink = screen.getByRole("link", { name: /hub/i });
    expect(hubLink.className).toContain("text-amber-100/50");
    expect(hubLink.className).not.toContain("text-amber-400");
  });

  it("Profil tab is disabled P2 placeholder (AC-3)", () => {
    render(<BottomTabBar />);
    const profilBtn = screen.getByRole("button", { name: /profil/i });
    expect(profilBtn).toBeDisabled();
  });

  it("Aventure tab opens AdventureModal on click (AC-3)", () => {
    render(<BottomTabBar />);
    const aventureBtn = screen.getByRole("button", { name: /aventure/i });
    fireEvent.click(aventureBtn);
    expect(mockSetAdventureModalOpen).toHaveBeenCalledWith(true);
  });

  it("nav is fixed to bottom of viewport (AC-3)", () => {
    const { container } = render(<BottomTabBar />);
    const nav = container.querySelector("nav");
    expect(nav?.className).toContain("fixed");
    expect(nav?.className).toContain("bottom-0");
  });

  it("nav is hidden at tablet breakpoint via flex md:hidden classes (AC-3)", () => {
    const { container } = render(<BottomTabBar />);
    const nav = container.querySelector("nav");
    expect(nav?.className).toContain("flex");
    expect(nav?.className).toContain("md:hidden");
  });
});
