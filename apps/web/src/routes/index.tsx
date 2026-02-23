import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { getNoUsernameOnboardingTarget } from "@/routes/_authenticated/onboarding/onboarding.utils";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { auth } = Route.useRouteContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.isAuthenticated) {
      void navigate({ to: "/auth/login", replace: true });
      return;
    }

    // Authenticated but no username → welcome page (start of onboarding funnel)
    if (!auth.user?.username) {
      void navigate({
        to: getNoUsernameOnboardingTarget(auth.user?.id),
        replace: true,
      });
      return;
    }

    void navigate({ to: "/hub", replace: true });
  }, [auth.isAuthenticated, auth.isLoading, auth.user?.id, auth.user?.username, navigate]);

  return null;
}
