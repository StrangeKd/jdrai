import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppLayout } from "@/components/layout/AppLayout";

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
    // New users reach /onboarding/welcome via register.tsx (explicit navigate) or route-guards.ts
    // (register race condition) — both guarantee E5 is seen before E6.
    // Returning users who land here have already seen E5 — send directly to profile-setup.
    if (!context.auth.user?.username && !location.pathname.startsWith("/onboarding")) {
      throw redirect({ to: "/onboarding/profile-setup" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
