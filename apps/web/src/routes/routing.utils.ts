import { redirect } from "@tanstack/react-router";

import type { RouterContext } from "@/routes/__root";
import { hasSeenWelcome } from "@/routes/_authenticated/onboarding/onboarding.utils";

// Inline type to avoid circular import through router/routeTree.
type AuthSnapshot = {
  isAuthenticated: boolean;
  user: { id?: string | null; username?: string | null } | null;
};

export function getNoUsernameOnboardingTarget(
  userId: string | null | undefined,
): "/onboarding/welcome" | "/onboarding/profile-setup" {
  return hasSeenWelcome(userId) ? "/onboarding/profile-setup" : "/onboarding/welcome";
}

// Single source of truth for "where should this user go?" routing decisions.
// Caller must ensure isLoading is false before calling.
export function getAuthDestination(
  auth: AuthSnapshot,
): "/auth/login" | "/hub" | "/onboarding/welcome" | "/onboarding/profile-setup" {
  if (!auth.isAuthenticated) return "/auth/login";
  if (!auth.user?.username) return getNoUsernameOnboardingTarget(auth.user?.id);
  return "/hub";
}

// Redirects authenticated users away from public auth pages (login, register, forgot/reset password).
// Called from beforeLoad on every /auth/* route.
export function redirectIfAuthenticated({
  context,
  location: _location,
}: {
  context: RouterContext;
  location: { pathname: string };
}) {
  if (context.auth.isLoading) return;

  if (context.auth.isAuthenticated) {
    throw redirect({ to: getAuthDestination(context.auth) });
  }
}
