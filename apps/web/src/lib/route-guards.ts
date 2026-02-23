import { redirect } from "@tanstack/react-router";

import type { RouterContext } from "@/routes/__root";
import { getNoUsernameOnboardingTarget } from "@/routes/_authenticated/onboarding/onboarding.utils";

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
