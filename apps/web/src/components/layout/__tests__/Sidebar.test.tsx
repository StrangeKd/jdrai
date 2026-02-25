import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock TanStack Router
let mockPathname = "/hub";
const mockLinkOnClick = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouterState: () => ({ location: { pathname: mockPathname } }),
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className} onClick={mockLinkOnClick}>
      {children}
    </a>
  ),
}));

// Mock useAuth
const mockLogout = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

// Mock UIStore
const mockSetAdventureModalOpen = vi.fn();
vi.mock("@/stores/ui.store", () => ({
  useUIStore: (selector: (s: { setAdventureModalOpen: typeof mockSetAdventureModalOpen }) => unknown) =>
    selector({ setAdventureModalOpen: mockSetAdventureModalOpen }),
}));

import { Sidebar } from "../Sidebar";

afterEach(cleanup);

describe("Sidebar (AC-2, AC-6)", () => {
  beforeEach(() => {
    mockPathname = "/hub";
    mockLogout.mockClear();
    mockSetAdventureModalOpen.mockClear();
  });

  it("renders Hub nav link (AC-2)", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /hub/i })).toBeInTheDocument();
  });

  it("renders JDRAI brand label (AC-2)", () => {
    render(<Sidebar />);
    expect(screen.getByText("JDRAI")).toBeInTheDocument();
  });

  it("Hub link has active class when on /hub (AC-2)", () => {
    mockPathname = "/hub";
    render(<Sidebar />);
    const hubLink = screen.getByRole("link", { name: /hub/i });
    expect(hubLink.className).toContain("bg-amber-900/40");
  });

  it("Hub link has inactive class when not on /hub (AC-2)", () => {
    mockPathname = "/settings";
    render(<Sidebar />);
    const hubLink = screen.getByRole("link", { name: /hub/i });
    expect(hubLink.className).not.toContain("bg-amber-900/40");
  });

  it("Profil button is disabled P2 placeholder (AC-2)", () => {
    render(<Sidebar />);
    const profilBtn = screen.getByRole("button", { name: /profil/i });
    expect(profilBtn).toBeDisabled();
  });

  it("Paramètres button is disabled P2 placeholder (AC-2)", () => {
    render(<Sidebar />);
    const settingsBtn = screen.getByRole("button", { name: /paramètres/i });
    expect(settingsBtn).toBeDisabled();
  });

  it("Aventure button opens AdventureModal on click (AC-2)", () => {
    render(<Sidebar />);
    const aventureBtn = screen.getByRole("button", { name: /aventure/i });
    fireEvent.click(aventureBtn);
    expect(mockSetAdventureModalOpen).toHaveBeenCalledWith(true);
  });

  it("Déconnexion button calls logout (AC-6)", () => {
    mockLogout.mockResolvedValue(undefined);
    render(<Sidebar />);
    const logoutBtn = screen.getByRole("button", { name: /déconnexion/i });
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
