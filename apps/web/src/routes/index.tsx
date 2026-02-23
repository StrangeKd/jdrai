import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { getAuthDestination } from "@/routes/routing.utils";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { auth } = Route.useRouteContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isLoading) return;
    void navigate({ to: getAuthDestination(auth), replace: true });
  }, [auth.isAuthenticated, auth.isLoading, auth.user?.id, auth.user?.username, navigate]);

  return null;
}
