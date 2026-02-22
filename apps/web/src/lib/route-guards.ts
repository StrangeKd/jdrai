import { redirect } from "@tanstack/react-router";

import type { RouterContext } from "@/routes/__root";

// Redirects authenticated users away from public auth pages (login, register, forgot/reset password).
// Called from beforeLoad on every /auth/* route.
export function redirectIfAuthenticated({
  context,
  location,
}: {
  context: RouterContext;
  location: { pathname: string };
}) {
  if (context.auth.isLoading) return;

  if (context.auth.isAuthenticated) {
    if (context.auth.user?.username) {
      throw redirect({ to: "/hub" });
    }
    // On /auth/register: guard may fire due to router.invalidate() race after signup — new user
    // must still see the welcome splash (E5) before profile-setup (E6).
    // On any other auth page (e.g. /auth/login): authenticated user without username is a
    // returning user who has already seen E5 — send directly to profile-setup.
    throw redirect({
      to:
        location.pathname === "/auth/register"
          ? "/onboarding/welcome"
          : "/onboarding/profile-setup",
    });
  }
}
