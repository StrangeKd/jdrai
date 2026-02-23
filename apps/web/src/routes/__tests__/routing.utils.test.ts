import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthUser } from "@/hooks/useAuth";
import type { RouterContext } from "@/routes/__root";
import { markWelcomeSeen } from "@/routes/_authenticated/onboarding/onboarding.utils";

vi.mock("@tanstack/react-router", () => ({
  redirect: (opts: unknown) => opts,
}));

import { getResolvedAuthDestination, redirectIfAuthenticated } from "@/routes/routing.utils";

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
    queryClient: { getQueryData: vi.fn().mockReturnValue(undefined) },
    auth: {
      user,
      isAuthenticated: true,
      isLoading: false,
    },
  };
}

describe("getResolvedAuthDestination", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns /auth/login when not authenticated", () => {
    const context = {
      queryClient: { getQueryData: vi.fn().mockReturnValue(undefined) },
      auth: { isAuthenticated: false, user: null, isLoading: false },
    };
    expect(getResolvedAuthDestination(context as RouterContext)).toBe("/auth/login");
  });

  it("returns /onboarding/welcome when authenticated, no username, welcome not seen", () => {
    expect(getResolvedAuthDestination(makeContext(makeUser({ username: null })) as RouterContext)).toBe(
      "/onboarding/welcome",
    );
  });

  it("returns /onboarding/profile-setup when authenticated, no username, welcome seen", () => {
    markWelcomeSeen("u1");
    expect(getResolvedAuthDestination(makeContext(makeUser({ username: null })) as RouterContext)).toBe(
      "/onboarding/profile-setup",
    );
  });

  it("returns /hub when authenticated with session username", () => {
    expect(
      getResolvedAuthDestination(makeContext(makeUser({ username: "ryan" })) as RouterContext),
    ).toBe("/hub");
  });

  it("returns /hub when session username is null but cache has username", () => {
    const context = {
      queryClient: { getQueryData: vi.fn().mockReturnValue({ username: "ryan" }) },
      auth: { isAuthenticated: true, user: makeUser({ username: null }), isLoading: false },
    };
    expect(getResolvedAuthDestination(context as RouterContext)).toBe("/hub");
  });
});

describe("redirectIfAuthenticated", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("redirects authed + username to /hub", () => {
    expect(() =>
      redirectIfAuthenticated({
        context: makeContext(makeUser({ username: "ryan" })) as RouterContext,
        location: { pathname: "/auth/login" },
      }),
    ).toThrow(expect.objectContaining({ to: "/hub" }));
  });

  it("redirects authed + no username to /onboarding/welcome if not seen", () => {
    expect(() =>
      redirectIfAuthenticated({
        context: makeContext(makeUser({ username: null })) as RouterContext,
        location: { pathname: "/auth/login" },
      }),
    ).toThrow(expect.objectContaining({ to: "/onboarding/welcome" }));
  });

  it("redirects authed + no username to /onboarding/profile-setup if seen", () => {
    markWelcomeSeen("u1");
    expect(() =>
      redirectIfAuthenticated({
        context: makeContext(makeUser({ username: null })) as RouterContext,
        location: { pathname: "/auth/login" },
      }),
    ).toThrow(expect.objectContaining({ to: "/onboarding/profile-setup" }));
  });
});
