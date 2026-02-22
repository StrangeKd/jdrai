import { redirect } from "@tanstack/react-router";

import type { RouterContext } from "@/routes/__root";

// Redirects authenticated users away from public auth pages (login, register, forgot/reset password).
// Called from beforeLoad on every /auth/* route.
export function redirectIfAuthenticated({ context }: { context: RouterContext }) {
  if (context.auth.isLoading) return;
  if (context.auth.isAuthenticated) {
    throw redirect({ to: context.auth.user?.username ? "/hub" : "/onboarding/profile-setup" });
  }
}
