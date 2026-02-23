import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthUser } from "@/hooks/useAuth";
import type { RouterContext } from "@/routes/__root";
import { markWelcomeSeen } from "@/routes/_authenticated/onboarding/onboarding.utils";

vi.mock("@tanstack/react-router", () => ({
  redirect: (opts: unknown) => opts,
}));

import { getAuthDestination, redirectIfAuthenticated } from "@/routes/routing.utils";

function makeUser(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: "u1",
    email: "u1@example.com",
    name: "u1",
    emailVerified: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    username: null,
    ...overrides,
  };
}

function makeContext(user: AuthUser): unknown {
  return {
    queryClient: {},
    auth: {
      user,
      isAuthenticated: true,
      isLoading: false,
    },
  };
}

describe("getAuthDestination", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns /auth/login when not authenticated", () => {
    expect(getAuthDestination({ isAuthenticated: false, user: null })).toBe("/auth/login");
  });

  it("returns /onboarding/welcome when authenticated, no username, welcome not seen", () => {
    expect(getAuthDestination({ isAuthenticated: true, user: { id: "u1", username: null } })).toBe(
      "/onboarding/welcome",
    );
  });

  it("returns /onboarding/profile-setup when authenticated, no username, welcome seen", () => {
    markWelcomeSeen("u1");
    expect(getAuthDestination({ isAuthenticated: true, user: { id: "u1", username: null } })).toBe(
      "/onboarding/profile-setup",
    );
  });

  it("returns /hub when authenticated with username", () => {
    expect(
      getAuthDestination({ isAuthenticated: true, user: { id: "u1", username: "ryan" } }),
    ).toBe("/hub");
  });
});

describe("redirectIfAuthenticated", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("redirects authed + username to /hub", () => {
    try {
      redirectIfAuthenticated({
        context: makeContext(makeUser({ username: "ryan" })) as RouterContext,
        location: { pathname: "/auth/login" },
      });
      throw new Error("Expected redirect");
    } catch (e) {
      expect(e).toMatchObject({ to: "/hub" });
    }
  });

  it("redirects authed + no username to /onboarding/welcome if not seen", () => {
    try {
      redirectIfAuthenticated({
        context: makeContext(makeUser({ username: null })) as RouterContext,
        location: { pathname: "/auth/login" },
      });
      throw new Error("Expected redirect");
    } catch (e) {
      expect(e).toMatchObject({ to: "/onboarding/welcome" });
    }
  });

  it("redirects authed + no username to /onboarding/profile-setup if seen", () => {
    markWelcomeSeen("u1");
    try {
      redirectIfAuthenticated({
        context: makeContext(makeUser({ username: null })) as RouterContext,
        location: { pathname: "/auth/login" },
      });
      throw new Error("Expected redirect");
    } catch (e) {
      expect(e).toMatchObject({ to: "/onboarding/profile-setup" });
    }
  });
});
