import { createFileRoute, redirect } from "@tanstack/react-router";

import { getResolvedAuthDestination } from "@/routes/routing.utils";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    throw redirect({ to: getResolvedAuthDestination(context) });
  },
  component: () => null,
});
