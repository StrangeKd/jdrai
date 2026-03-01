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
//   1. Session  — populated by Better Auth once cookieCache is refreshed (may lag
//                 after profile update due to server-side cache TTL).
//   2. Cache    — ["user", "me"] key shared with useCurrentUser(); set by
//                 useUpdateProfile.onSuccess (immediate) or useCurrentUser() (5-min
//                 staleTime, 1-h gcTime). Survives navigation to game session.
//   3. API call — final fallback: fetches GET /users/me (DB direct read). Uses
//                 staleTime matching useCurrentUser() to avoid redundant requests.
export async function getResolvedAuthDestination(
  context: RouterContext,
): Promise<"/auth/login" | "/hub" | "/onboarding/welcome" | "/onboarding/profile-setup"> {
  if (!context.auth.isAuthenticated) return "/auth/login";

  // Tier 1: session
  if (context.auth.user?.username) return "/hub";

  // Tier 2: TanStack Query cache (no API call) — same key as useCurrentUser()
  const cached = context.queryClient.getQueryData<UserDTO>(["user", "me"]);
  if (cached?.username) return "/hub";

  // Tier 3: fresh DB read via API (page reload or cache GC'd)
  if (!context.auth.user?.id) return getNoUsernameOnboardingTarget(context.auth.user?.id);
  try {
    const res = await context.queryClient.fetchQuery({
      queryKey: ["user", "me"],
      queryFn: () =>
        api
          .get<{ success: true; data: UserDTO }>("/api/v1/users/me")
          .then((payload) => payload.data),
      staleTime: 5 * 60 * 1000, // respect useCurrentUser() 5-min cache when available
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
