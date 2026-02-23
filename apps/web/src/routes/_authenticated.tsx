import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";

import { AppLayout } from "@/components/layout/AppLayout";
import { getNoUsernameOnboardingTarget } from "@/routes/routing.utils";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    // Wait for session to resolve — avoid flash redirect on initial load.
    // router.invalidate() in main.tsx re-triggers this once isLoading becomes false.
    if (context.auth.isLoading) return;

    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.href },
      });
    }

    // Redirect to profile-setup if username not set, but NOT when already on an onboarding route.
    if (!context.auth.user?.username && !location.pathname.startsWith("/onboarding")) {
      throw redirect({ to: getNoUsernameOnboardingTarget(context.auth.user?.id) });
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
