import { redirect } from "@tanstack/react-router";

import type { RouterContext } from "@/routes/__root";
import { hasSeenWelcome } from "@/routes/_authenticated/onboarding/onboarding.utils";

export function getNoUsernameOnboardingTarget(
  userId: string | null | undefined,
): "/onboarding/welcome" | "/onboarding/profile-setup" {
  return hasSeenWelcome(userId) ? "/onboarding/profile-setup" : "/onboarding/welcome";
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
    if (context.auth.user?.username) {
      throw redirect({ to: "/hub" });
    }
    throw redirect({ to: getNoUsernameOnboardingTarget(context.auth.user?.id) });
  }
}
