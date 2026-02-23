import { redirect } from "@tanstack/react-router";

import type { UserDTO } from "@jdrai/shared";

import type { RouterContext } from "@/routes/__root";
import { hasSeenWelcome } from "@/routes/_authenticated/onboarding/onboarding.utils";
import { api } from "@/services/api";

export function getNoUsernameOnboardingTarget(
  userId: string | null | undefined,
): "/onboarding/welcome" | "/onboarding/profile-setup" {
  return hasSeenWelcome(userId) ? "/onboarding/profile-setup" : "/onboarding/welcome";
}

// Single source of truth for routing decisions. Three-tier username resolution:
//
//   1. Session  — populated by Better Auth once cookieCache is refreshed.
//   2. Cache    — set by useUpdateProfile.onSuccess via setQueryData; covers the brief
//                 race window between mutation completion and React re-rendering App
//                 with the fresh session (no API call).
//   3. API call — fallback for page reload: TanStack Query cache is in-memory and
//                 cleared on reload; calls GET /users/me which queries the DB directly.
export async function getResolvedAuthDestination(
  context: RouterContext,
): Promise<"/auth/login" | "/hub" | "/onboarding/welcome" | "/onboarding/profile-setup"> {
  if (!context.auth.isAuthenticated) return "/auth/login";

  // Tier 1: session
  if (context.auth.user?.username) return "/hub";

  // Tier 2: TanStack Query cache (no API call)
  const cached = context.queryClient.getQueryData<UserDTO>([
    "user",
    "me",
    context.auth.user?.id ?? "",
  ]);
  if (cached?.username) return "/hub";

  // Tier 3: fresh DB read via API (page reload — cache was cleared)
  if (!context.auth.user?.id) return getNoUsernameOnboardingTarget(context.auth.user?.id);
  try {
    const res = await context.queryClient.fetchQuery({
      queryKey: ["user", "me", context.auth.user.id],
      queryFn: () =>
        api
          .get<{ success: true; data: UserDTO }>("/api/v1/users/me")
          .then((payload) => payload.data),
      staleTime: 0,
    });
    if (res.username) return "/hub";
  } catch {
    // Keep routing resilient: if /users/me fails, fall through to onboarding.
  }

  return getNoUsernameOnboardingTarget(context.auth.user?.id);
}

// Redirects authenticated users away from public auth pages (login, register, forgot/reset password).
// Called from beforeLoad on every /auth/* route.
export async function redirectIfAuthenticated({
  context,
  location: _location,
}: {
  context: RouterContext;
  location: { pathname: string };
}) {
  if (context.auth.isLoading) return;
  if (context.auth.isAuthenticated) {
    const destination = await getResolvedAuthDestination(context);
    throw redirect({ to: destination });
  }
}
