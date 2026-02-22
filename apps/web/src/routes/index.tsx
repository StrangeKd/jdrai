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

    void navigate({
      to: auth.isAuthenticated ? "/hub" : "/auth/login",
      replace: true,
    });
  }, [auth.isAuthenticated, auth.isLoading, navigate]);

  return null;
}
