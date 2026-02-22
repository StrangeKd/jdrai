import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/hub" });
    }
    throw redirect({ to: "/auth/login" });
  },
  component: () => null,
});
