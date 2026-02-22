import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

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

    // Authenticated but no username → onboarding
    if (!auth.user?.username) {
      void navigate({ to: "/onboarding/profile-setup", replace: true });
      return;
    }

    void navigate({ to: "/hub", replace: true });
  }, [auth.isAuthenticated, auth.isLoading, auth.user?.username, navigate]);

  return null;
}
