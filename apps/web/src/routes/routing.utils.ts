import { redirect } from "@tanstack/react-router";

import type { UserDTO } from "@jdrai/shared";

import type { RouterContext } from "@/routes/__root";
import { hasSeenWelcome } from "@/routes/_authenticated/onboarding/onboarding.utils";

export function getNoUsernameOnboardingTarget(
  userId: string | null | undefined,
): "/onboarding/welcome" | "/onboarding/profile-setup" {
  return hasSeenWelcome(userId) ? "/onboarding/profile-setup" : "/onboarding/welcome";
}

// Single source of truth for routing decisions with full context access.
// Synchronous — no API call needed:
//   1. Primary: session username (populated by Better Auth cookieCache after PATCH /users/me
//      forwards the refreshed Set-Cookie header).
//   2. Fallback: TanStack Query cache (set by useUpdateProfile.onSuccess via setQueryData),
//      covers the brief window where React hasn't re-rendered App with the fresh session yet.
export function getResolvedAuthDestination(
  context: RouterContext,
): "/auth/login" | "/hub" | "/onboarding/welcome" | "/onboarding/profile-setup" {
  if (!context.auth.isAuthenticated) return "/auth/login";

  const sessionUsername = context.auth.user?.username;
  if (sessionUsername) return "/hub";

  const cached = context.queryClient.getQueryData<UserDTO>([
    "user",
    "me",
    context.auth.user?.id ?? "",
  ]);
  if (cached?.username) return "/hub";

  return getNoUsernameOnboardingTarget(context.auth.user?.id);
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
    const destination = getResolvedAuthDestination(context);
    throw redirect({ to: destination });
  }
}
