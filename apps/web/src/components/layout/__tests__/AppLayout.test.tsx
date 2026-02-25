import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { shouldHideNav } from "../AppLayout";

// Mock child components that have their own router/store dependencies
vi.mock("../Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));
vi.mock("../BottomTabBar", () => ({
  BottomTabBar: () => <div data-testid="bottom-tab-bar" />,
}));
vi.mock("@/components/hub/AdventureModal", () => ({
  AdventureModal: () => <div data-testid="adventure-modal" />,
}));

// Mock TanStack Router — useRouterState returns controlled location
let mockPathname = "/hub";
vi.mock("@tanstack/react-router", () => ({
  useRouterState: () => ({ location: { pathname: mockPathname } }),
}));

// Import after mocks are set up
import { AppLayout } from "../AppLayout";

afterEach(cleanup);

// ─────────────────────────────────────────────────────────────────
// shouldHideNav — pure function tests (AC-1, AC-7)
// ─────────────────────────────────────────────────────────────────
describe("shouldHideNav", () => {
  it("returns false for /hub", () => {
    expect(shouldHideNav("/hub")).toBe(false);
  });

  it("returns false for /hub/", () => {
    expect(shouldHideNav("/hub/")).toBe(false);
  });

  it("returns false for /settings", () => {
    expect(shouldHideNav("/settings")).toBe(false);
  });

  it("returns true for /onboarding/welcome (AC-1)", () => {
    expect(shouldHideNav("/onboarding/welcome")).toBe(true);
  });

  it("returns true for /onboarding/profile-setup (AC-1)", () => {
    expect(shouldHideNav("/onboarding/profile-setup")).toBe(true);
  });

  it("returns true for /onboarding/tutorial (AC-1)", () => {
    expect(shouldHideNav("/onboarding/tutorial")).toBe(true);
  });

  it("returns true for game session /adventure/:id (AC-7)", () => {
    expect(shouldHideNav("/adventure/abc123")).toBe(true);
  });

  it("returns false for /adventure/new — not a session route (AC-7)", () => {
    expect(shouldHideNav("/adventure/new")).toBe(false);
  });

  it("returns false for /adventure/:id/summary — summary shows nav (AC-7)", () => {
    expect(shouldHideNav("/adventure/abc123/summary")).toBe(false);
  });

  it("returns false for /adventure with no id", () => {
    expect(shouldHideNav("/adventure")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// AppLayout component tests (AC-1, AC-2, AC-3, AC-7)
// ─────────────────────────────────────────────────────────────────
describe("AppLayout", () => {
  it("renders Sidebar + BottomTabBar on a normal authenticated route (AC-1)", () => {
    mockPathname = "/hub";
    render(<AppLayout>content</AppLayout>);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-tab-bar")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders AdventureModal when nav is visible (AC-4)", () => {
    mockPathname = "/hub";
    render(<AppLayout>content</AppLayout>);
    expect(screen.getByTestId("adventure-modal")).toBeInTheDocument();
  });

  it("hides Sidebar and BottomTabBar on onboarding routes (AC-1)", () => {
    mockPathname = "/onboarding/welcome";
    render(<AppLayout>onboarding content</AppLayout>);
    expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bottom-tab-bar")).not.toBeInTheDocument();
    expect(screen.getByText("onboarding content")).toBeInTheDocument();
  });

  it("hides nav on game session route (AC-7)", () => {
    mockPathname = "/adventure/abc123";
    render(<AppLayout>session</AppLayout>);
    expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bottom-tab-bar")).not.toBeInTheDocument();
  });

  it("shows nav on adventure summary route (AC-7)", () => {
    mockPathname = "/adventure/abc123/summary";
    render(<AppLayout>summary</AppLayout>);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-tab-bar")).toBeInTheDocument();
  });
});
