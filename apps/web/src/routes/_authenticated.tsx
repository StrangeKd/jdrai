import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";

import { AppLayout } from "@/components/layout/AppLayout";
import { getSession } from "@/lib/auth-client";
import { getResolvedAuthDestination } from "@/routes/routing.utils";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    // Wait for session to resolve — avoid flash redirect on initial load.
    // router.invalidate() in main.tsx re-triggers this once isLoading becomes false.
    if (context.auth.isLoading) return;

    if (!context.auth.isAuthenticated) {
      // Double-check with a fresh server fetch before redirecting.
      // Guards against false logouts when the cookieCache briefly expires between renders
      // (useSession may momentarily emit { pending: false, data: null } before re-fetching).
      const { data: freshSession } = await getSession();
      if (!freshSession) {
        throw redirect({
          to: "/auth/login",
          search: { redirect: location.href },
        });
      }
      // Fresh session confirmed — let the route render; useSession will sync shortly.
      return;
    }

    // Redirect to onboarding if username is missing, but NOT when already on an onboarding route.
    // Uses fresh /users/me data when session user is stale right after profile update.
    const destination = await getResolvedAuthDestination(context);
    if (
      destination !== "/hub" &&
      destination !== "/auth/login" &&
      !location.pathname.startsWith("/onboarding")
    ) {
      throw redirect({ to: destination });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Tunnel mode: onboarding routes must never show the app navigation chrome (Story 4.1+).
  if (pathname.startsWith("/onboarding")) {
    return <Outlet />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
