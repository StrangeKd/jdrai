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
    queryClient: {
      getQueryData: vi.fn().mockReturnValue(undefined),
      fetchQuery: vi.fn().mockResolvedValue({ username: null }),
    },
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

  it("returns /auth/login when not authenticated", async () => {
    const context = {
      queryClient: { getQueryData: vi.fn().mockReturnValue(undefined) },
      auth: { isAuthenticated: false, user: null, isLoading: false },
    };
    await expect(getResolvedAuthDestination(context as unknown as RouterContext)).resolves.toBe(
      "/auth/login",
    );
  });

  it("returns /onboarding/welcome when authenticated, no username, welcome not seen", async () => {
    await expect(
      getResolvedAuthDestination(makeContext(makeUser({ username: null })) as RouterContext),
    ).resolves.toBe("/onboarding/welcome");
  });

  it("returns /onboarding/profile-setup when authenticated, no username, welcome seen", async () => {
    markWelcomeSeen("u1");
    await expect(
      getResolvedAuthDestination(makeContext(makeUser({ username: null })) as RouterContext),
    ).resolves.toBe("/onboarding/profile-setup");
  });

  it("returns /hub when authenticated with session username", async () => {
    await expect(
      getResolvedAuthDestination(makeContext(makeUser({ username: "ryan" })) as RouterContext),
    ).resolves.toBe("/hub");
  });

  it("returns /hub when session username is null but cache has username", async () => {
    const context = {
      queryClient: {
        getQueryData: vi.fn().mockReturnValue({ username: "ryan" }),
        fetchQuery: vi.fn().mockResolvedValue({ username: null }),
      },
      auth: { isAuthenticated: true, user: makeUser({ username: null }), isLoading: false },
    };
    await expect(getResolvedAuthDestination(context as unknown as RouterContext)).resolves.toBe(
      "/hub",
    );
  });
});

describe("redirectIfAuthenticated", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("redirects authed + username to /hub", async () => {
    await expect(
      redirectIfAuthenticated({
        context: makeContext(makeUser({ username: "ryan" })) as RouterContext,
        location: { pathname: "/auth/login" },
      }),
    ).rejects.toMatchObject({ to: "/hub" });
  });

  it("redirects authed + no username to /onboarding/welcome if not seen", async () => {
    await expect(
      redirectIfAuthenticated({
        context: makeContext(makeUser({ username: null })) as RouterContext,
        location: { pathname: "/auth/login" },
      }),
    ).rejects.toMatchObject({ to: "/onboarding/welcome" });
  });

  it("redirects authed + no username to /onboarding/profile-setup if seen", async () => {
    markWelcomeSeen("u1");
    await expect(
      redirectIfAuthenticated({
        context: makeContext(makeUser({ username: null })) as RouterContext,
        location: { pathname: "/auth/login" },
      }),
    ).rejects.toMatchObject({ to: "/onboarding/profile-setup" });
  });
});
